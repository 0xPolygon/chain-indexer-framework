import { Logger } from "@maticnetwork/chainflow/logger";

import TransferService from "./services/transfer.js";
import TransferServiceController from "./controllers/transfer_service_controller.js";
import CallGetAllTransactionSchema from "./schema/callGetAllTransactionSchema.js";

import { FastifyInstance } from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";
import cors from "@fastify/cors";

/**
 * startApi function which starts api service for the consumer so that data can retreived
 * in the client side. it exposes the endpoints that can be called from external.
 * 
 * @function startApi
 * 
 * @param {FastifyInstance<Server, IncomingMessage, ServerResponse>} app - fasify instance
 * @param {TransferService} transferService - the transfer Service class
 * 
 * @returns {Promise<void>}
 */
export default async function startApi(
    app: FastifyInstance<Server, IncomingMessage, ServerResponse>,
    transferService: TransferService
): Promise<void> {
    await app.register(
        cors,
        {
            origin: "*"
        }
    );

    const transferServiceController = new TransferServiceController(transferService);

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
