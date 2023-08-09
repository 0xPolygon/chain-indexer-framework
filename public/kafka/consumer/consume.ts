import { IConsumerConfig } from "@internal/interfaces/consumer_config.js";
import { SynchronousConsumer } from "@internal/kafka/consumer/synchronous_consumer.js";
import { AsynchronousConsumer } from "@internal/kafka/consumer/asynchronous_consumer.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { IObserver } from "@internal/interfaces/observer.js";
import { DeserialisedMessage } from "public/index.js";
import { BaseError } from "@internal/errors/base_error.js";
import { IKafkaCoderConfig } from "@internal/interfaces/kafka_coder_config.js";
import { ICoderConfig } from "@internal/interfaces/coder_config.js";

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
    let coders = config.coders;
    const type = config.type;
    const topic = config.topic;
    delete config.type;
    delete config.topic;
    delete config.coders;

    if (!topic) {
        throw new Error("Please provide topic"); 
    }

    if (!coders) {
        throw new Error("Please provide coders"); 
    }

    if (Array.isArray(coders) || "fileName" in coders) {
        const coderConfig = coders as ICoderConfig | ICoderConfig[];
        coders = {};
        if (Array.isArray(topic) && Array.isArray(coderConfig)) {
            for (let topicIndex = 0; topicIndex < topic.length; topicIndex++) {
                coders[topic[topicIndex]] = new Coder(
                    coderConfig[topicIndex].fileName,
                    coderConfig[topicIndex].packageName,
                    coderConfig[topicIndex].messageType
                );
            }
        } else if (!Array.isArray(topic) && !Array.isArray(coders)) {
            coders[topic] = new Coder(
                (coderConfig as ICoderConfig).fileName,
                (coderConfig as ICoderConfig).packageName,
                (coderConfig as ICoderConfig).messageType,
                (coderConfig as ICoderConfig).fileDirectory,
            );
        } else {
            throw new Error("Please provide valid coder config or topic");
        }
    }

    let consumer: AsynchronousConsumer | SynchronousConsumer | null = null;

    if (type === "asynchronous") {
        consumer = new AsynchronousConsumer(topic, coders as IKafkaCoderConfig, config);
    }

    if (type === "synchronous") {
        consumer = new SynchronousConsumer(topic, coders as IKafkaCoderConfig, config);
    }

    if (consumer) {
        consumer.start(observer);
        return consumer;
    }

    throw new Error("Invalid type");
}
