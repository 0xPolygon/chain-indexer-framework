import { SynchronousConsumer } from "../kafka/consumer/synchronous_consumer.js";
import { AsynchronousProducer } from "../kafka/producer/asynchronous_producer.js";
import { AbstractDataTransformer } from "@internal/data_transformation/abstract_data_transformer.js";
import { IConsumerConfig } from "@internal/interfaces/consumer_config.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";

/**
 * SynchronousDataTransformer transforms the data sequentially and waits for the transformed data to produce before 
 * transforming data further. Services needs to implement their own transform method
 */
export abstract class SynchronousDataTransformer<T, G> extends AbstractDataTransformer<T, G> {
    /**
     * @param {IConsumerConfig} consumerConfig - consumer config to create SynchronousConsumer interface
     * @param {IProducerConfig} producerConfig - producer config to create AsynchronousProducer interface
     */
    constructor(consumerConfig: IConsumerConfig, producerConfig: IProducerConfig) {
        super(
            new SynchronousConsumer(consumerConfig),
            new AsynchronousProducer(producerConfig)
        );
    }
}
