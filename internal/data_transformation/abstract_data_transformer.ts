import { DeserialisedMessage } from "../interfaces/deserialised_kafka_message.js";
import { ITransformedBlock } from "../interfaces/transformed_block.js";
import { AbstractConsumer } from "../kafka/consumer/abstract_consumer.js";
import { AbstractProducer } from "../kafka/producer/abstract_producer.js";
import { KafkaError } from "../errors/kafka_error.js";
import { Logger } from "../logger/logger.js";
import { EventEmitter } from "events";

/**
 * Abstract DataTransformer class privides a way to create a Data transformer which takes input from the data consumer and 
 * produces the transformed data using the passed producer. Services need to implement their own transform method.
 */
export abstract class AbstractDataTransformer<T, G> extends EventEmitter {
    /**
    * @param {AbstractConsumer} consumer - the consumer instance to consume raw data 
    * @param {AbstractProducer} producer - producer instance to produce the transformed data
    */
    constructor(
        protected consumer: AbstractConsumer,
        protected producer: AbstractProducer,
        protected restart: boolean = true
    ) {
        super();
    }

    /**
     * @param {T} data can be of any type of raw block
     * 
     * @returns {Promise<ITransformedBlock<G>>} - Returns the transformed data of type G
     */
    protected abstract transform(data: T): Promise<ITransformedBlock<G>>;

    /**
     * This method starts the data transformation process by inititating the consumer and calling the onData function
     * 
     * @returns {Promise<void>}
     */
    public async start(): Promise<void> {
        Logger.info("Starting transformer.");
        await this.producer.start();

        return await this.consumer.start({
            next: this.onData.bind(this),
            error: (error) => {
                Logger.error(error);
            },
            closed: async () => {
                if (this.restart) {
                    try {
                        await this.producer.stop();

                        await this.start();

                        return;
                    } catch (error) {
                        return this.emit(
                            "dataTransformer.fatalError",
                            KafkaError.createUnknown(error)
                        );
                    }
                }

                this.emit(
                    "dataTransformer.fatalError",
                    new KafkaError(
                        "Transformer stopped",
                        KafkaError.codes.UNKNOWN_CONSUMER_ERR,
                        true,
                        "Transformer stopped due to a fatal error."
                    )
                );

                return;
            }
        });
    }

    public on(event: "dataTransformer.fatalError", listener: (error: KafkaError) => void): this {
        super.on(event, listener);

        return this;
    }

    /**
     * Will be called on each in coming event and transform the message value as expected to type T.
     * 
     * @param {DeserialisedMessage} message 
     * 
     * @returns {Promise<any>}
     */
    protected async onData(message: DeserialisedMessage): Promise<any> {
        const transformedBlock = await this.transform(message.value as T);

        Logger.debug({
            location: "abstract_data_transformer",
            function: "onData",
            status: "data received",
            data: {
                blockNumber: transformedBlock.blockNumber,
                length: transformedBlock.data.length
            }
        });

        if (transformedBlock.data.length > 0) {
            await this.producer.produceEvent(transformedBlock.blockNumber.toString(), transformedBlock);

            Logger.info({
                location: "abstract_data_transformer",
                function: "onData",
                status: "data produced",
                data: {
                    blockNumber: transformedBlock.blockNumber,
                    length: transformedBlock.data.length
                }
            });
        }
    }
}
