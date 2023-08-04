import { SynchronousConsumer } from "@internal/kafka/consumer/synchronous_consumer.js";
import { AsynchronousProducer } from "@internal/kafka/producer/asynchronous_producer.js";
import { AbstractDataTransformer } from "@internal/data_transformation/abstract_data_transformer.js";

/**
 * SynchronousDataTransformer transforms the data sequentially and waits for the transformed data to produce before 
 * transforming data further. Services needs to implement their own transform method
 */
export abstract class SynchronousDataTransformer<T, G> extends AbstractDataTransformer<T, G> {
    /**
     * @param {SynchronousConsumer} consumer - Sequential consumer instance to produce raw data
     * @param {AsynchronousProducer} producer - Async producer instance to produce transformed data
     */
    constructor(consumer: SynchronousConsumer, producer: AsynchronousProducer)
    {
        super(consumer, producer);
    }
}
