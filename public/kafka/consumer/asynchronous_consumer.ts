import { AsynchronousConsumer as InternalAsynchronousConsumer } from "@internal/kafka/consumer/asynchronous_consumer.js";
import { IConsumerConfig } from "@internal/interfaces/consumer_config.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { ICoderConfig } from "@internal/interfaces/coder_config.js";

/**
 * The AsynchronousConsumer extends InternalAsynchronousConsumer class to provide the abstraction of the coder class.
 * coders can be passed optionally if another type of serialising/deserialising is required.
 * 
 * @extends AsynchronousConsumer
 */
export class AsynchronousConsumer extends InternalAsynchronousConsumer {

    /**
     * @constructor
     * 
     * @param {IConsumerConfig} config - Key value pairs to override the default config of the consumer client. 
     */
    constructor(
        config: IConsumerConfig,
    ) {
        let coders = config.coders;
        const topic = config.topic;
        delete config.topic;
        delete config.coders;

        if (!topic) {
            throw new Error("Please provide topic"); 
        }

        if (!coders) {
            throw new Error("Please provide coders"); 
        }

        if (Array.isArray(coders) || "fileName" in coders) {
            const coderConfig = coders;
            coders = {};
            if (Array.isArray(topic) && Array.isArray(coderConfig)) {
                for (let topicIndex = 0; topicIndex < topic.length; topicIndex++) {
                    coders[topic[topicIndex]] = new Coder(
                        coderConfig[topicIndex].fileName,
                        coderConfig[topicIndex].packageName,
                        coderConfig[topicIndex].messageType
                    );
                }
            } else if (!Array.isArray(topic) && !Array.isArray(coderConfig)) {
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

        super(
            topic,
            coders,
            config
        );
    }
}
