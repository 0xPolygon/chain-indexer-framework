import { IConsumerConfig } from "@internal/interfaces/consumer_config.js";
import { SynchronousConsumer } from "./synchronous_consumer.js";
import { AsynchronousConsumer } from "./asynchronous_consumer.js";
import { IObserver } from "@internal/interfaces/observer.js";
import { DeserialisedMessage } from "public/index.js";
import { BaseError } from "@internal/errors/base_error.js";

/**
 * Function to be used as functional implementation for the consumer classes for asynchronous
 * and synchronous consumer. this function will create coder class if protobuf coder is required.
 * type and coder can be passed if coder other that protobuf coder is needed.
 * 
 * @param {IConsumerConfig} config - consumer config
 * @param {IObserver<DeserialisedMessage, BaseError>} observer - observer class for next, error, closed event
 *  
 * @returns {AsynchronousConsumer | SynchronousConsumer}
 */
export function consume(
    config: IConsumerConfig, observer: IObserver<DeserialisedMessage, BaseError>
): AsynchronousConsumer | SynchronousConsumer {
    const type = config.type;
    delete config.type;

    let consumer: AsynchronousConsumer | SynchronousConsumer;

    switch (type) {
        case "asynchronous": {
            consumer = new AsynchronousConsumer(config);
            break;
        }

        case "synchronous": {
            consumer = new SynchronousConsumer(config);
            break;
        }

        default: {
            throw new Error("Invalid type");
        }
    }

    consumer.start(observer);

    return consumer;
}
