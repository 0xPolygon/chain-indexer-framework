import { IBlockGetterWorkerPromise } from "../interfaces/block_getter_worker_promise.js";
import { IBlockSubscription } from "../interfaces/block_subscription.js";
import { BlockProducerError } from "../errors/block_producer_error.js";
import { Subscription } from "web3-core-subscriptions";
import { IObserver } from "../interfaces/observer.js";
import { IBlock } from "../interfaces/block.js";
import { Logger } from "../logger/logger.js";
import { Queue } from "../queue/queue.js";
import { Eth } from "web3-eth";
import { Log } from "web3-core";
import Long from "long";

/**
 * @abstract
 * 
 * Block subscription class which emits full block data whenever added to chain and 
 * takes care to backfill historical blocks requested. The backfilling strategy needs to be implemented by 
 * class extending from this.
 * 
 * @author - Vibhu Rajeev
 */
export abstract class AbstractBlockSubscription extends Queue<IBlockGetterWorkerPromise> implements IBlockSubscription<IBlock, BlockProducerError> {
    private subscription: Subscription<Log> | null = null;
    // @ts-ignore 
    protected observer: IObserver<IBlock, BlockProducerError>; // ts-ignore added for this special case (it will always get initialized in the subscribe method).
    private lastBlockHash: string = "";
    private processingQueue: boolean = false;
    protected fatalError: boolean = false;
    protected lastFinalizedBlock: number = 0;
    protected nextBlock: number = 0;
    protected activeBackFillingId: number | null = null;
    private checkIfLiveTimeout?: NodeJS.Timeout;
    private lastReceivedBlockNumber: number = 0;
    private lastEmittedBlock?: {
        number: number,
        hash: string
    };

    /**
     * @constructor
     * 
     * @param {Eth} eth - Eth module from web3.js
     * @param {number} timeout - Timeout for which if there has been no event, connection must be restarted. 
     */
    constructor(private eth: Eth, private timeout: number = 60000, private blockDelay: number = 0) {
        super();
    }

    /**
     * The subscribe method starts the subscription from last produced block, and calls observer.next for 
     * each new block.
     *
     * @param {IObserver} observer - The observer object with its functions which will be called on events.
     * @param {number} startBlock - The block number to start subscribing from.
     * 
     * @returns {Promise<void>} 
     * 
     * @throws {BlockProducerError} - On failure to get start block or start subscription.
     */
    public async subscribe(observer: IObserver<IBlock, BlockProducerError>, startBlock: number): Promise<void> {
        try {

            this.lastFinalizedBlock = this.blockDelay > 0
                                        ? (await this.eth.getBlock("latest")).number - this.blockDelay 
                                        : (await this.eth.getBlock("finalized")).number;
            // Clear any previously existing queue
            this.clear();
            this.observer = observer;
            this.fatalError = false;
            this.nextBlock = startBlock;
            this.lastBlockHash = "";
            this.lastReceivedBlockNumber = startBlock - 1;

            // Number 50 is added to allow block producer to create log subscription even and catch up after backfilling. 
            if (this.lastFinalizedBlock - 50 > startBlock) {
                this.backFillBlocks();

                return;
            }

            this.checkIfLive(this.lastBlockHash);

            this.subscription = this.eth.subscribe("logs", { fromBlock: this.nextBlock })
                .on("data", (log: Log) => {
                    try {
                        Logger.debug({
                            location: "eth_subscribe",
                            blockHash: log.blockHash,
                            blockNumber: log.blockNumber,
                            logIndex: log.logIndex
                        });

                        if (this.lastBlockHash == log.blockHash) {

                            return;
                        }

                        //Adding below logic to get empty blocks details which have not been added to queue.
                        if (this.hasMissedBlocks(log.blockNumber)) {
                            this.enqueueMissedBlocks(log.blockNumber);
                        }

                        this.lastBlockHash = log.blockHash;
                        this.lastReceivedBlockNumber = log.blockNumber;

                        this.enqueue(this.getBlockFromWorker(log.blockNumber));

                        if (!this.processingQueue) {
                            this.processQueue();
                        }
                    } catch (error) {
                        observer.error(
                            BlockProducerError.createUnknown(error)
                        );
                    }
                })
                .on("error", (error) => {
                    observer.error(
                        BlockProducerError.createUnknown(error)
                    );
                });
        } catch (error) {
            throw BlockProducerError.createUnknown(error);
        }
    }

    /**
     * Unsubscribes from block subscription and resolves on success
     * 
     * @returns {Promise<boolean>} - Resolves true on graceful unsubscription.
     * 
     * @throws {BlockProducerError} - Throws block producer error on failure to unsubscribe gracefully.
     */
    public unsubscribe(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.activeBackFillingId = null;
            this.clear();
            clearTimeout(this.checkIfLiveTimeout);

            if (!this.subscription) {
                resolve(true);

                return;
            }

            (this.subscription as Subscription<Log>).unsubscribe((error: Error, success: boolean) => {
                if (success) {
                    this.subscription = null;
                    resolve(true);

                    return;
                }

                reject(BlockProducerError.createUnknown(error));
            });
        });
    }

    /**
     * Private method to emit blocks upto current finalized block.
     * 
     * @returns {Promise<void>}
     */
    protected abstract backFillBlocks(): Promise<void>;

    /**
     * Does get the block from the defined worker (workerId).
     * 
     * @param {number} blockNumber 
     * @param {number} workerId
     * 
     * @returns {Promise<IBlockGetterWorkerPromise>}
     */
    protected abstract getBlockFromWorker(blockNumber: number, workerId?: number): Promise<IBlockGetterWorkerPromise>;


    /**
     * @async
     * Private method, process queued promises of getBlock, and calls observer.next when resolved.
     * 
     * @returns {Promise<void>}
     */
    private async processQueue(): Promise<void> {
        this.processingQueue = true;

        while (!this.isEmpty() && !this.fatalError && this.observer) {
            try {
                const promiseResult = await (this.shift()) as IBlockGetterWorkerPromise;

                if (promiseResult?.error) {
                    throw promiseResult.error;
                }

                const blockNumber = Long.fromValue(promiseResult.block.number);

                this.nextBlock = parseInt(blockNumber.toString()) + 1;

                //If the block number is greater than last emitted block, check if there was a re org not detected. 
                if (
                    this.isReOrgedMissed(promiseResult.block)
                ) {
                    throw new Error("Chain re org not handled.");
                }

                this.observer.next(
                    promiseResult.block
                );

                this.lastEmittedBlock = {
                    number: blockNumber.toNumber(),
                    hash: promiseResult.block.hash
                };
            } catch (error) {
                this.fatalError = true;
                this.observer.error(
                    BlockProducerError.createUnknown(error)
                );

                break;
            }
        }

        this.processingQueue = false;
    }

    /**
     * @private
     * 
     * Method to check if there are empty or missed blocks between last produced block and current event received.
     * 
     * @param {number} blockNumber - The block number of the received event log.
     * 
     * @returns {boolean}
     */
    private hasMissedBlocks(blockNumber: number): boolean {
        return blockNumber - this.lastReceivedBlockNumber > 1;
    }

    /**
     * @private
     * 
     * Private method to check if a re org has been missed by the subscription. 
     * 
     * @param {IBlock} block - Latest block being emitted.
     * 
     * @returns {boolean}
     */
    private isReOrgedMissed(block: IBlock): boolean {
        const blockNumber = Long.fromValue(block.number);
        return this.lastEmittedBlock &&
            blockNumber.toNumber() > this.lastEmittedBlock.number &&
            this.lastEmittedBlock.hash !== block.parentHash ?
            true :
            false;
    }

    /**
     * @private
     * 
     * Method to enqueue missed or empty blocks between last produced blocks and currently received event.
     * 
     * @param {number} currentBlockNumber - Block number for which current event was received.
     * 
     * @returns {void}
     */
    private enqueueMissedBlocks(currentBlockNumber: number): void {
        for (let i = 1; i < currentBlockNumber - this.lastReceivedBlockNumber; i++) {
            this.enqueue(this.getBlockFromWorker(this.lastReceivedBlockNumber + i));
        }
    }

    private checkIfLive(lastBlockHash: string): void {
        this.checkIfLiveTimeout = setTimeout(async () => {
            //Check if the block hash has changed since the timeout. 
            if (this.lastBlockHash === lastBlockHash) {
                try {
                    await this.unsubscribe();

                    await this.subscribe(this.observer, this.nextBlock);
                } catch (error) {
                    this.observer.error(
                        BlockProducerError.createUnknown(
                            `Error when restarting producer: ${error}`
                        )
                    );
                }

                return;
            }

            this.checkIfLive(this.lastBlockHash);
        },
            this.timeout
        );
    }
}
