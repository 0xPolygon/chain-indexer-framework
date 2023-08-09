import { SynchronousProducer } from "@internal/kafka/producer/synchronous_producer.js";
import { AsynchronousProducer } from "@internal/kafka/producer/asynchronous_producer.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { ICoder } from "@internal/interfaces/coder.js";

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
    let coder = config.coder;
    const coderConfig = config.coderConfig;
    delete config.type;
    delete config.coder;
    delete config.coderConfig;

    if (coder && coderConfig) {
        throw new Error("Please provide either coder or coderConfig");
    }

    if (!coder && !coderConfig) {
        throw new Error("Please provide coder or coderConfig");
    }

    if (coderConfig) {
        coder = new Coder(coderConfig.fileName, coderConfig.packageName, coderConfig.messageType);
    }

    let producer: AsynchronousProducer | SynchronousProducer | null = null;

    if (type === "asynchronous") {
        producer = new AsynchronousProducer(coder as ICoder, config);
    }

    if (type === "synchronous") {
        producer = new SynchronousProducer(coder as ICoder, config);
    }

    if (producer) {
        producer.start();
        return producer;
    }

    throw new Error("Invalid type");
}
