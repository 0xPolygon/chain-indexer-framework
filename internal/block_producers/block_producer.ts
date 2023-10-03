import { IProducedBlock, IProducedBlocksModel } from "./produced_blocks_model.js";
import { KafkaProducerEvents, EventListener } from "../interfaces/common_kafka_events.js";
import { AsynchronousProducer } from "../kafka/producer/asynchronous_producer.js";
import { IBlockSubscription } from "../interfaces/block_subscription.js";
import { BlockProducerError } from "../errors/block_producer_error.js";
import { IProducerConfig } from "../interfaces/producer_config.js";
import { BlockGetter } from "../block_getters/block_getter.js";
import { Metadata, DeliveryReport } from "node-rdkafka";
import { KafkaError } from "../errors/kafka_error.js";
import { ICoder } from "../interfaces/coder.js";
import { IBlock } from "../interfaces/block.js";
import { Database } from "../mongo/database.js";
import { Logger } from "../logger/logger.js";
import { Queue } from "../queue/queue.js";
import Long from "long";

/**
 * Common lock producer class which contains the common logic to retrieve 
 * raw block data from the configurable "startblock" number, and produce it to 
 * a kafka cluster while detecting re orgs and handling them. 
 * The block data source, and kafka modules is provided the user of this class. 
 * 
 * @author - Vibhu Rajeev
 */
export class BlockProducer extends AsynchronousProducer {
    private mongoInsertQueue: Queue<IProducedBlock>;
    private queueProcessingPromise?: Promise<void>;
    private mongoInsertInProcess: boolean = false;
    private restartPromise?: Promise<void>;
    private producingBlockPromises: Promise<void>[] = [];
    private forceStop: boolean = false;

    /**
     * @constructor
     * 
     * @param {ICoder} coder - The protobuf coder which will be used for serialising messages.
     * @param {IProducerConfig} config - Kafka producer config.
     * @param {IBlockSubscription} blockSubscription - The block subscription instance which will emit block data.
     * @param {BlockGetter} blockGetter - BlockGetter class instance
     * @param {Database} database - database instance
     * @param {IProducedBlocksModel<IProducedBlock>} producedBlocksModel - The produced blocks model 
     * which exposes methods to add and query produced block data.
     * @param {number} maxReOrgDepth - The depth upto which a re org can occur.
     */
    constructor(
        coder: ICoder,
        config: IProducerConfig,
        private blockSubscription: IBlockSubscription<IBlock, BlockProducerError>,
        private blockGetter: BlockGetter,
        private database: Database,
        private producedBlocksModel: IProducedBlocksModel<IProducedBlock>,
        private startBlock: number = 0,
        private maxReOrgDepth: number = 0
    ) {
        super(
            coder,
            Object.assign({
                "message.max.bytes": 26214400
            },
                config
            )
        );

        this.mongoInsertQueue = new Queue();
    }

    //TODO - to rewrite the overloads and reduce the redundancy
    on(event: "blockProducer.fatalError", listener: (error: KafkaError | BlockProducerError) => void): this;
    on(event: "producer.error", listener: (error: KafkaError) => void): this;
    on(event: "producer.disconnected", listener: () => void): this;
    on(event: "delivered", listener: (report: DeliveryReport) => void): this
    on<E extends KafkaProducerEvents, T>(event: E, listener: EventListener<E>): this;
    on<Event extends string, T>(event: Event, listener: EventListener<Event>): this {
        //@ts-ignore
        super.on(event, listener);

        return this;
    }

    /**
     * This is the main entry point for the block producer. This method is to be called externally to start indexing the raw block data from "startblock"
     * 
     * @returns {Promise<Metadata | KafkaError>} 
     * 
     * @throws {KafkaError | BlockProducerError} - On failure to start kafka producer or block subscription.
     */
    public async start(): Promise<Metadata | KafkaError> {
        this.forceStop = false;
        await this.database.connect();
        const metadata = await super.start();

        this.on("delivered", async (report: DeliveryReport) => {
            if (report.partition === -1) {
                const error = new BlockProducerError(
                    "Kafka topic does not exist",
                    undefined,
                    true,
                    "Kafka topic does not exist or could not be created.",
                    "remote"
                );
                
                this.onError(error);

                return;
            }

            Logger.info("Delivery-report:" + JSON.stringify({
                ...report.opaque, 
                offset: report.offset
            }));

            try {
                this.mongoInsertQueue.enqueue(report.opaque);

                if (!this.mongoInsertInProcess) {
                    this.queueProcessingPromise = this.processQueue();
                }
            } catch (error) {
                Logger.error(error as string | object);
            }
        });

        await this.blockSubscription.subscribe(
            {
                next: async (block: IBlock) => {
                    //TODO - Simplify below logic.
                    const producingBlockPromise = this.produceBlock(block);

                    this.producingBlockPromises.push(producingBlockPromise);

                    await producingBlockPromise;

                    this.producingBlockPromises = this.producingBlockPromises.filter(
                        (promise) => promise !== producingBlockPromise
                    );
                },
                error: this.onError.bind(this),
                closed: () => {
                    Logger.info("Closed");
                }
            },
            await this.getStartBlock()
        );

        return metadata;
    }

    /**
     * @async
     * The public method to stop an indexing process. It is important to call this to avoid application crashing when 
     * there are connection issues. 
     * 
     * @returns {Promise<boolean>} - Returns true on graceful shutdown or throws error.
     * 
     * @throws {BlockProducerError | KafkaError} - On failure to stop block subscription or kafka producer gracefully.
     */
    public async stop(): Promise<boolean> {
        await this.blockSubscription.unsubscribe();

        if (this.producingBlockPromises.length) {
            //Waiting for all pending blocks to be produced.
            await Promise.all(this.producingBlockPromises);
        }
        
        if (this.queueProcessingPromise) {
            await this.queueProcessingPromise;
        }

        await super.stop();

        this.removeAllListeners("delivered");

        return true;
    }

    /**
     * @private
     * 
     * Private method to handle errors and logging.
     * 
     * @param {KafkaError|BlockProducerError} error - Error object 
     */
    private async onError(error: KafkaError | BlockProducerError): Promise<void> {
        Logger.error(error);

        if (
            error.message === "Local: Erroneous state" ||
            error.message === "Erroneous state"
        ) {
            this.forceStop = true;

            try {
                await this.stop();
            } catch { }
            
            this.emit(
                "blockProducer.fatalError",
                error
            );

            return;
        }

        if (error.isFatal) {
            await this.restartBlockProducer();
        }
    }

    /**
     * @private
     * 
     * Private method to be used when a block producer has to be restarted.
     * 
     * @returns {Promise<void>} 
     */
    private async restartBlockProducer(): Promise<void> {
        try {
            if (this.restartPromise) {
                return await this.restartPromise;
            }

            this.restartPromise = new Promise(async (resolve, reject) => {
                try {
                    await this.stop();

                    if (!this.forceStop) {
                        await this.start();
                    }

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            await this.restartPromise;

            this.restartPromise = undefined;
        } catch (error) {
            this.restartPromise = undefined;

            Logger.error(error as string | object);
            this.emit(
                "blockProducer.fatalError",
                BlockProducerError.createUnknown(error)
            );
        }
    }

    /**
     * @private
     * 
     * Private method to add process the queue and add the blocks in queue 
     * to mongo DB.
     * 
     * @returns {Promise<void>}
     */
    private async processQueue(): Promise<void> {
        this.mongoInsertInProcess = true;

        try {
            while (!this.mongoInsertQueue.isEmpty()) {
                const queueLength = this.mongoInsertQueue.getLength();
                if (queueLength > this.maxReOrgDepth) {
                    await this.addBlockToMongo(
                        this.mongoInsertQueue.shiftByN(queueLength - this.maxReOrgDepth) as IProducedBlock
                    );
                } else {
                    await this.addBlockToMongo(
                        this.mongoInsertQueue.shift() as IProducedBlock
                    );
                }
            }
        } catch (error) {
            Logger.error(error as object);
        }

        this.mongoInsertInProcess = false;
    }

    /**
     * @private
     * 
     * Private method which adds given produced block details mongoDB
     * 
     * @param {IProducedBlock} details - Produced block details to be added to mongo.
     * @param {number} retryCount - param used to keep track of retry count. Should not be set externally.
     * 
     * @returns {Promise<void>} 
     */
    private async addBlockToMongo(details: IProducedBlock, retryCount: number = 0): Promise<void> {
        try {
            await this.producedBlocksModel.add(
                details,
                this.maxReOrgDepth
            );
        } catch (error) {
            // Tries upto 5 times to add transaction.
            if (retryCount < 4) {
                return await this.addBlockToMongo(details, retryCount + 1);
            }

            throw BlockProducerError.createUnknown(error);
        }
    }

    /**
     * @async
     * Internal method to retrieve last produced block from mongoDB,
     * and check to see if produced blocks have been re orged when producer was offline.
     *
     * @returns {Promise<number>} - Returns last produced valid block or startBlock if last block does not exist.
     */
    private async getStartBlock(): Promise<number> {
        let blockNumber: number | undefined = (await this.producedBlocksModel.get())?.number;
        let block: IProducedBlock | null;

        for (let depth: number = 0; depth < this.maxReOrgDepth; depth++) {
            block = await this.producedBlocksModel.get(blockNumber);
            if (!block) {
                if (blockNumber) {
                    return blockNumber;
                }

                return this.startBlock;
            }

            const remoteBlock = await this.blockGetter.getBlock(block.number);

            if (remoteBlock.hash === block.hash) {
                return (remoteBlock.number + 1);
            }

            blockNumber = remoteBlock.number - 1;
        }

        return blockNumber || this.startBlock;
    }

    /**
     * @private
     * 
     * Private method to produce block to kafka. This method handled exceptions internally.
     * 
     * @param {IBlock} block - Block to be produced to kafka
     * 
     * @returns {Promise<void>}
     */
    private async produceBlock(block: IBlock): Promise<void> {
        try {
            //Have to do below as toString and toNumber methods do not exist on json Long object.
            const blockNumber: Long = Long.fromValue(block.number);

            await this.produceEvent(
                blockNumber.toString(),
                block,
                undefined,
                undefined,
                undefined,
                {
                    number: blockNumber.toNumber(),
                    hash: block.hash
                }
            );
        } catch (error) {
            this.onError(error as KafkaError);
        }
    }
}
