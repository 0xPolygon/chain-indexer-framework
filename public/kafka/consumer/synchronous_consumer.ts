import { SynchronousConsumer as InternalSynchronousConsumer } from "@internal/kafka/consumer/synchronous_consumer.js";
import { IKafkaCoderConfig } from "@internal/interfaces/kafka_coder_config.js";
import { IConsumerConfig } from "@internal/interfaces/consumer_config.js";
import { Coder } from "@internal/coder/protobuf_coder.js";


/**
 * The SynchronousConsumer extends InternalSynchronousConsumer class to provide the abstraction of the coder class.
 * coders can be passed optionally if another type of serialising/deserialising is required.
 * 
 * @extends SynchronousConsumer
 */
export class SynchronousConsumer extends InternalSynchronousConsumer {

    /**
     * @constructor
     * 
     * @param {string|string[]} topic - The default topic that the consumer will subscribe to in case not specified in the method.
     * @param {IConsumerConfig} config - Key value pairs to override the default config of the consumer client. 
     * @param {IKafkaCoderConfig} coders  - Object with coder instances where key is the topic name. 
     */
    constructor(
        topic: string | string[],
        config: IConsumerConfig = {},
        coders?: IKafkaCoderConfig,
    ) {
        const coderConfig = config.coderConfig;
        if (coders && coderConfig) {
            throw new Error("Please provide either serialiser or coder config");
        }
        if (!coders && !coderConfig) {
            throw new Error("Please provide serialiser or coder config");
        }

        if (coderConfig) {
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

        super(
            topic,
            coders as IKafkaCoderConfig,
            config
        )
    }
}
