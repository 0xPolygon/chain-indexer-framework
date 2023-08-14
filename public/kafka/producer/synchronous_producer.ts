import { SynchronousProducer as InternalSynchronousProducer } from "@internal/kafka/producer/synchronous_producer.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { Coder } from "@internal/coder/protobuf_coder.js";

/**
 * SynchronousProducer class entends InternalSynchronousProducer which creates an instance of SynchronousProducer
 * it abstracts the usage of coder class internally. serialiser can be passed optionally if another type of
 * serialising/deserialising is required.
 */
export class SynchronousProducer extends InternalSynchronousProducer {
    /**
     *
     * @param {IProducerConfig} config - key value pairs to override the default config of the producer client.
     */
    constructor(
        config: IProducerConfig,
    ) {
        let coder = config.coder;
        delete config.coder;

        if (!coder) {
            throw new Error("Please provide coder");
        }

        if ("fileName" in coder) {
            coder = new Coder(
                coder.fileName,
                coder.packageName,
                coder.messageType,
                coder.fileDirectory,
            );
        }

        super(
            coder,
            config
        );
    }
}
