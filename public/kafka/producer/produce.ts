import { SynchronousProducer } from "@internal/kafka/producer/synchronous_producer.js";
import { AsynchronousProducer } from "@internal/kafka/producer/asynchronous_producer.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { Coder } from "@internal/coder/protobuf_coder.js";

/**
 * Function to be used as functional implementation for the producer classes for asynchronous
 * and synchronous producer. this function will create coder class if protobuf coder is required.
 * type and coder can be passed if coder other that protobuf coder is needed.
 * 
 * @param {IProducerConfig} config - producer config
 *  
 * @returns {AsynchronousProducer | SynchronousProducer}
 */
export function produce(
    config: IProducerConfig
): AsynchronousProducer | SynchronousProducer {
    const type = config.type;
    const encoding = config.encoding;
    let coder = config.coder;
    const coderConfig = config.coderConfig;
    delete config.type;
    delete config.encoding;
    delete config.coder;
    delete config.coderConfig;

    if (!encoding || encoding === "protobuf") {
        if (!coderConfig) {
            throw new Error("Please provide coder config");
        }
        coder = new Coder(coderConfig.fileName, coderConfig.packageName, coderConfig.messageType);
    }

    if (!coder) {
        throw new Error("Please provide coders");
    }

    let producer: AsynchronousProducer | SynchronousProducer | null = null;

    if (type === "asynchronous") {
        producer = new AsynchronousProducer(coder, config);
    }

    if (type === "synchronous") {
        producer = new SynchronousProducer(coder, config);
    }

    if (producer) {
        producer.start();
        return producer;
    }

    throw new Error("Invalid type");
}
