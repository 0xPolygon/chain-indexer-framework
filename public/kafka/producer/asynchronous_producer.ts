import { AsynchronousProducer as InternalAsynchronousProducer } from "@internal/kafka/producer/asynchronous_producer.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { ICoder } from "../../interfaces/coder.js";
import { Coder } from "@internal/coder/protobuf_coder.js";

/**
 * AsynchronousProducer class entends InternalAsynchronousProducer which creates an instance of AsynchronousProducer
 * it abstracts the usage of coder class internally. serialiser can be passed optionally if another type of
 * serialising/deserialising is required.
 */
export class AsynchronousProducer extends InternalAsynchronousProducer {
    /**
     *
     * @param {IProducerConfig} config - key value pairs to override the default config of the producer client.
     * @param {Coder} serialiser - The Serialiser object to serialise messages before production. 
     */
    constructor(
        config: IProducerConfig,
        serialiser?: ICoder,
    ) {
        if (serialiser && config.coderConfig) {
            throw new Error("Please provide either serialiser or coder config");
        }
        if (!serialiser && !config.coderConfig) {
            throw new Error("Please provide serialiser or coder config");
        }
        if (config.coderConfig) {
            serialiser = new Coder(
                config.coderConfig.fileName,
                config.coderConfig.packageName,
                config.coderConfig.messageType,
                config.coderConfig.fileDirectory,
            )
        }
        super(
            serialiser as ICoder,
            config
        );
    }
}
