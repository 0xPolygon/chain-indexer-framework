import { IConsumerConfig } from "@internal/interfaces/consumer_config.js";
import { SynchronousConsumer } from "@internal/kafka/consumer/synchronous_consumer.js";
import { AsynchronousConsumer } from "@internal/kafka/consumer/asynchronous_consumer.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { IObserver } from "@internal/interfaces/observer.js";
import { DeserialisedMessage } from "public/index.js";
import { BaseError } from "@internal/errors/base_error.js";

/**
 * Function to be used as functional implementation for the consumer classes for asynchronous
 * and synchronous consumer. this function will create coder class if protobuf coder is required.
 * type and coder can be passed if coder other that protobuf coder is needed.
 * 
 * @param {IConsumerConfig} config - consumer config
 *  
 * @returns {AsynchronousConsumer | SynchronousConsumer}
 */
export function consume(
    config: IConsumerConfig, observer: IObserver<DeserialisedMessage, BaseError>
): AsynchronousConsumer | SynchronousConsumer {
    const topic = config.topic;
    let coders = config.coders;
    const type = config.type;
    const coderConfig = config.coderConfig;
    const encoding = config.encoding;
    delete config.topic;
    delete config.coders;
    delete config.type;
    delete config.coderConfig;
    delete config.encoding;

    if (!encoding || encoding === "protobuf") {
        if (!coderConfig || !topic) {
            throw new Error("Please provide coder config or topic");
        }
        coders = {};
        if (Array.isArray(topic) && Array.isArray(coderConfig)) {
            for (let topicIndex = 0; topicIndex < topic.length; topicIndex++) {
                coders[topic[topicIndex]] = new Coder(coderConfig[topicIndex].fileName, coderConfig[topicIndex].packageName, coderConfig[topicIndex].messageType);
            }
        } else if (!Array.isArray(topic) && !Array.isArray(coderConfig)) {
            coders[topic] = new Coder(coderConfig.fileName, coderConfig.packageName, coderConfig.messageType);
        } else {
            throw new Error("Please provide valid coder config or topic");
        }
    }

    if (!topic || !coders) {
        throw new Error("Please provide coders or topic");
    }

    let consumer: AsynchronousConsumer | SynchronousConsumer | null = null;

    if (type === "asynchronous") {
        consumer = new AsynchronousConsumer(topic, coders, config);
    }

    if (type === "synchronous") {
        consumer = new SynchronousConsumer(topic, coders, config);
    }

    if (consumer) {
        consumer.start(observer);
        return consumer;
    }

    throw new Error("Invalid type");
}
