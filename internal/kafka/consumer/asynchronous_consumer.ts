import { BaseError } from "../../errors/base_error.js";
import { AbstractConsumer } from "./abstract_consumer.js";
import { DeserialisedMessage } from "../../interfaces/deserialised_kafka_message.js";
import { IConsumerQueueObject } from "../../interfaces/consumer_queue_object.js";
import { isBaseError } from "../../errors/is_base_error.js";
import { KafkaError } from "../../errors/kafka_error.js";

/**
 * The AsynchronousConsumer extends AbstractConsumer class to provide guarantee of 
 * ordered committing of offsets. The messages are processed concurrently using the event loop, 
 * but offsets are committed in order. If an earlier promise in the queue fails, later offsets will 
 * not be comitted even if successful. 
 * @extends AbstractConsumer
 */
export class AsynchronousConsumer extends AbstractConsumer {
    /**
     * Private method to be used as a wrapper to retry the next promise internally upto max retries by using recursive calls. 
     * 
     * @param {DeserialisedMessage} message - The Deserialised message to be passed to the next promise. 
     * 
     * @param {number} errorCount - This param should not be set externally and is used by recursive calls to track the number of times next promise failed.
     *  
     * @returns {Promise<void>}
     */
    private async retryPromise(message: DeserialisedMessage, errorCount: number = 0): Promise<void> {
        try {
            await  this.observer?.next(message);
        } catch (error) {
            if (errorCount >=  this.maxRetries || (isBaseError(error) && (error as BaseError).isFatal)) {
                throw KafkaError.createUnknown(error);
            }

            return this.retryPromise(message, errorCount + 1);
        }
    }

    /**
     * Implementation of the abstract enqueue method. This implementation adds queue object with the wrapped retryPromise to the queue
     * 
     * @param {DeserialisedMessage} message - The message of which queue object needs to be added to the internal queue. 
     * 
     * @returns {IConsumerQueueObject<DeserialisedMessage>} - Returns consumer queue object with the observer.next wrapped in next promise.
     */
    protected enqueue(message: DeserialisedMessage): IConsumerQueueObject<DeserialisedMessage> {
        return {
            message,
            promise: this.retryPromise(message)
        };
    }
}
