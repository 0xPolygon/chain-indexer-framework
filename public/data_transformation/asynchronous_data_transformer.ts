import { AsynchronousConsumer } from "@internal/kafka/consumer/asynchronous_consumer.js";
import { AsynchronousProducer } from "@internal/kafka/producer/asynchronous_producer.js";
import { AbstractDataTransformer } from "@internal/data_transformation/abstract_data_transformer.js";

/**
 * Concurrent Data transformer transforms the data concurrently and doesn't for the transformed data to produce before 
 * transforming data further. Services needs to implement their own transform method
 */
export abstract class AsynchronousDataTransformer<T, G> extends AbstractDataTransformer<T, G> {
    /**
     * @param {AsynchronousConsumer} consumer - ConcurrentConsumer instance to consume data 
     * @param {AsynchronousProducer} producer - producer instance to produce transformed data
     */
    constructor(consumer: AsynchronousConsumer, producer: AsynchronousProducer)
    {
        super(consumer, producer);
    }
}
