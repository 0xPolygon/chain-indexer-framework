import { Database } from "@maticnetwork/chainflow/mongo/database";
import { Logger } from "@maticnetwork/chainflow/logger";

import TransferMapper from "./mapper/transfer.js";
import TransferService from "./services/transfer.js";
import { TransferModel } from "./models/transfer.js";

import startConsuming from "./consumer.js";
import startApi from "./start_api.js"

import fastify, { FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";

const app: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify.default();

async function start(): Promise<void> {
    try {
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

        const database = new Database(process.env.MONGO_URL || 'mongodb://localhost:27017/transfers');
        await database.connect();

        const transferService = new TransferService(
            await TransferModel.new(database),
        );

        if (process.env.START_CONSUMER === "true") {
            await startConsuming(transferService, new TransferMapper());
        }

        if (process.env.START_API_ENDPOINTS === "true") {
            await startApi(app, transferService);
        }
    } catch (error) {
        Logger.error(`Error when starting consumer service: ${(error as Error).message}`);
    }
}

start();
