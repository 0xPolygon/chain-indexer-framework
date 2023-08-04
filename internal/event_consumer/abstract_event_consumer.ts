import { DeserialisedMessage } from "../interfaces/deserialised_kafka_message.js";
import { SynchronousConsumer } from "../kafka/consumer/synchronous_consumer.js";
import { EventConsumerError } from "../errors/event_consumer_error.js";
import { Logger } from "../logger/logger.js";

/**
 * This class will start consuming the events and has functions to call what to do with the data for each event.
 */
export abstract class AbstractEventConsumer extends SynchronousConsumer {
    /**
     * Public execute function has no parameters. this function will start consuming the events and will call
     * the callback function when an event is consumed. only need to call this event when you want to start
     * consuming the event.
     * 
     * @returns {Promise<void>}
     */
    public async execute(): Promise<void> {
        await this.start({
            next: async (event) => {
                try {
                    await this.onEvent(event);
                } catch (error) {
                    throw EventConsumerError.createUnknown(error);
                }
            },
            error: (err: Error) => {
                Logger.error(err);
            },
            closed: () => {
                Logger.info(`Consumer stopped for topics ${this.topics}`);
            },
        });
    }

    /**
     * Private internal callback method for the consumer to call when any deposit data is received. this function will
     * filter data based on its token type and execute the command based on which tokentype is present.
     * 
     * @param {DeserialisedMessage} data - Data that is received from kafka consumer
     * 
     * @returns {Promise<void>}
     */
    protected abstract onEvent(data: DeserialisedMessage): Promise<void>;
}
