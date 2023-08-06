import { SynchronousConsumer } from "@maticnetwork/chainflow/kafka/consumer/synchronous_consumer";
import { AsynchronousProducer } from "@maticnetwork/chainflow/kafka/producer/asynchronous_producer";
import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";
import { Logger } from "@maticnetwork/chainflow/logger";
import { BlockProducerError } from "@maticnetwork/chainflow/errors/block_producer_error";
import { MaticTransferDataTransformer } from "./matic_transfer_data_transformer.js";
import { MaticTransferMapper } from "./mappers/matic_transfer_mapper.js";
import dotenv from 'dotenv';
import path from "path";

dotenv.config();

Logger.create({
    sentry: {
        dsn: process.env.SENTRY_DSN,
        level: 'error'
    },
    datadog: {
        api_key: process.env.DATADOG_API_KEY,
        service_name: process.env.DATADOG_APP_KEY,
    }
});

async function main() {
    const tranformer: MaticTransferDataTransformer = new MaticTransferDataTransformer(
        new SynchronousConsumer(
            process.env.CONSUMER_TOPIC || "polygon.1.blocks",
            {
                [process.env.CONSUMER_TOPIC || "polygon.1.blocks"]: new Coder(
                    "block",
                    "blockpackage",
                    "Block",
                )
            },
            {
                "bootstrap.servers": process.env.KAFKA_CONNECTION_URL || "localhost:9092",
                "group.id": "matic.transfer.transformer",
                "security.protocol": "plaintext",
                "message.max.bytes": 26214400,
                "fetch.message.max.bytes": 26214400
            }
        ),
        new AsynchronousProducer(
            new Coder(
                "matic_transfer",
                "matictransferpackage",
                "MaticTransferBlock",
                path.resolve("./schemas")
            ),
            {
                "topic": process.env.PRODUCER_TOPIC || "apps.1.matic.transfer",
                "bootstrap.servers": process.env.KAFKA_CONNECTION_URL || "localhost:9092",
                "security.protocol": "plaintext",
                "message.max.bytes": 26214400
            }
        ),
        new MaticTransferMapper()
    );

    tranformer.on("dataTransformer.fatalError", (error) => {
        Logger.error(`Tranformer exited due to error: ${error.message}`);

        process.exit(1);
    });

    await tranformer.start();
}

/**
 * Initialise the transform service with producer topic, proto file names,
 *  producer config, consumer topic and consumer proto files
 */
try {
    main();
} catch (e) {
    Logger.error(BlockProducerError.createUnknown(e));
}
