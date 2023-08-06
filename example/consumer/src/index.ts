import { Database } from "@maticnetwork/chainflow/mongo/database";
import { consume } from "@maticnetwork/chainflow/kafka/consumer/consume"
import { Logger } from "@maticnetwork/chainflow/logger";

import TransferMapper from "./mapper/transfer.js";
import TransferService from "./services/transfer.js";
import { TransferModel } from "./models/transfer.js";

import TransferConsumer from "./transfer_consumer.js";
import TransferServiceController from "./controllers/transfer_service_controller.js";

import CallGetAllTransactionSchema from "./schema/callGetAllTransactionSchema.js";

import fastify, { FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";
import cors from "@fastify/cors";
import dotenv from 'dotenv';
import path from "path";

dotenv.config()

const database = new Database(process.env.MONGO_URL || 'mongodb://localhost:27017/transfers');
let transferServiceController: TransferServiceController;
let transferService: TransferService;

const app: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify.default();

async function startConsume() {
    try {
        const transferConsumer = new TransferConsumer(transferService, new TransferMapper());
        const consumer = consume({
            "metadata.broker.list": process.env.KAFKA_CONNECTION_URL || "localhost:9092",
            "group.id": process.env.CONSUMER_GROUP_ID || "matic.transfer.consumer",
            "security.protocol": "plaintext",
            "topic": process.env.TRANSFER_TOPIC || "apps.1.matic.transfer",
            "coderConfig": {
                fileName: "matic_transfer",
                packageName: "matictransferpackage",
                messageType: "MaticTransferBlock",
                fileDirectory: path.resolve("./schemas")
            },
            type: 'synchronous'
        }, {
            next: transferConsumer.onTransferData,
            error(err: Error) {
                console.error('something wrong occurred: ' + err);
            },
            closed: () => {
                Logger.info(`subscription is ended.`);

                throw new Error("Consumer stopped");
            },
        });
    } catch (error) {
        Logger.error(`Consumer instance is exiting due to error: ${error}`);
        process.exit(1);

    }
}

async function startApi(): Promise<void> {
    await app.register(
        cors,
        {
            origin: "*"
        }
    );

    transferServiceController = new TransferServiceController(transferService);

    app.get("/", { schema: CallGetAllTransactionSchema }, transferServiceController.callGetAllTransaction.bind(transferServiceController));
    app.get('/health-check', async (req, res) => {
        res.status(200).send({
            success: true,
            result: "Success"
        })
    });

    app.listen(
        {
            port: 3000,
            host: "0.0.0.0"
        },
        (err, address) => {
            if (err) {
                Logger.error(err);
                process.exit(1);
            }

            Logger.info(`Server listening at ${address}`);
        }
    );
};

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
        await database.connect();

        transferService = new TransferService(
            await TransferModel.new(database),
        );

        if (process.env.START_CONSUMER === "true") {
            await startConsume();
        }

        if (process.env.START_API_ENDPOINTS === "true") {
            await startApi();
        }
    } catch (error) {
        Logger.error(`Error when starting consumer service: ${(error as Error).message}`);
    }
}

start();
