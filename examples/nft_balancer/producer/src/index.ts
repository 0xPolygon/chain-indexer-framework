import { produce } from "@maticnetwork/chain-indexer-framework/kafka/producer/produce";
import { Logger } from "@maticnetwork/chain-indexer-framework/logger";
import dotenv from 'dotenv';
import { BlockPollerProducer } from "@maticnetwork/chain-indexer-framework/block_producers/block_polling_producer";

dotenv.config();
Logger.create({
    sentry: {
        dsn: process.env.SENTRY_DSN,
        level: 'error'
    },
    datadog: {
        api_key: process.env.DATADOG_API_KEY,
        service_name: process.env.DATADOG_APP_KEY
    },
    console: {
        level: "debug"
    }
});

const producer = produce<BlockPollerProducer>({
    startBlock: parseInt(process.env.START_BLOCK as string),
    rpcWsEndpoints: process.env.HTTP_PROVIDER ? [process.env.HTTP_PROVIDER] : undefined,
    blockPollingTimeout: parseInt(process.env.BLOCK_POLLING_TIMEOUT as string),
    topic: process.env.PRODUCER_TOPIC || "polygon.1442.blocks",
    maxReOrgDepth: 0,
    maxRetries: 5,
    mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/chain-indexer',
    // blockSubscriptionTimeout: 120000,
    "bootstrap.servers": process.env.KAFKA_CONNECTION_URL || "localhost:9092",
    "security.protocol": "plaintext",
    type: "blocks:polling"
});

producer.on("blockProducer.fatalError", (error: any) => {
    Logger.error(`Block producer exited. ${error.message}`);

    process.exit(1); //Exiting process on fatal error. Process manager needs to restart the process.
});
