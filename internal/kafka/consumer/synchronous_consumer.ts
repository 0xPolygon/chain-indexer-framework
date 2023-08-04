import { AbstractConsumer } from "./abstract_consumer.js";
import { DeserialisedMessage } from "../../interfaces/deserialised_kafka_message.js";
import { IConsumerQueueObject } from "../../interfaces/consumer_queue_object.js";

/**
 * The SynchronousConsumer extends AbstractConsumer class to provide guarantee of 
 * synchronous one at a time processing of events and committing of offsets. The class maintains the new events in an 
 * internal buffer and only moves to the next event after successful processing of the previous one. In case of exception, 
 * The queue is cleared, on a maximum number of retries that can be set via config. The class also internally handles
 * back pressure by pausing the consumer if buffer exceeds the maximum limit. 
 * @extends AbstractConsumer
 */
export class SynchronousConsumer extends AbstractConsumer {
    /**
     * Implementation of the abstract enqueue method. This implementation adds queue object with the wrapped retryPromise to the queue
     * 
     * @param {DeserialisedMessage} message - The message of which queue object needs to be added to the internal queue. 
     * 
     * @returns {IConsumerQueueObject<DeserialisedMessage>} - Returns consumer queue object without the observer.next promise.
     */
    protected enqueue(message: DeserialisedMessage): IConsumerQueueObject<DeserialisedMessage> {
        return {message};
    }
}
