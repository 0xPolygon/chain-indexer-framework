import { produce } from "@maticnetwork/chainflow/kafka/producer/produce";
import { Logger } from "@maticnetwork/chainflow/logger";
import dotenv from 'dotenv';
import { BlockProducer } from "../../../dist/internal/block_producers/block_producer.js";

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

const producer = produce<BlockProducer>({
    startBlock: parseInt(process.env.START_BLOCK as string),
    rpcWsEndpoints: process.env.RPC_WS_ENDPOINT_URL_LIST?.split(','),
    topic: process.env.PRODUCER_TOPIC || "polygon.1.blocks",
    maxReOrgDepth: 96,
    maxRetries: 5,
    mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/chain-flow',
    blockSubscriptionTimeout: 120000,
    "bootstrap.servers": process.env.KAFKA_CONNECTION_URL || "localhost:9092",
    "security.protocol": "plaintext",
    type: "blocks:erigon"
});

producer.on("blockProducer.fatalError", (error: any) => {
    Logger.error(`Block producer exited. ${error.message}`);

    process.exit(1); //Exiting process on fatal error. Process manager needs to restart the process.
});
