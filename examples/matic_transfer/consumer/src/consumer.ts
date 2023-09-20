import { ITransformedBlock } from "@maticnetwork/chain-indexer-framework/interfaces/transformed_block";
import { DeserialisedMessage } from "@maticnetwork/chain-indexer-framework/interfaces/deserialised_kafka_message";
import { consume } from "@maticnetwork/chain-indexer-framework/kafka/consumer/consume";
import { Logger } from "@maticnetwork/chain-indexer-framework/logger";

import TransferService from "./services/transfer.js";
import TransferMapper from "./mapper/transfer.js";
import IMaticTransferTx from "./interfaces/matic_transfer_tx.js";

import dotenv from 'dotenv';
import path from "path";

dotenv.config()

/**
 * startConsuming function which starts consuming the events from kafka and then save the data to
 * database. it also handles the reorg internally in the save function.
 * 
 * @function startConsume
 * 
 * @param {TransferService} transferService - The transfer service class
 * @param {TransferMapper} transferMapper - the transfer Mapper class
 * 
 * @returns {Promise<void>}
 */
export default async function startConsuming(transferService: TransferService, transferMapper: TransferMapper): Promise<void> {
    try {
        consume({
            "metadata.broker.list": process.env.KAFKA_CONNECTION_URL || "localhost:9092",
            "group.id": process.env.CONSUMER_GROUP_ID || "matic.transfer.consumer",
            "security.protocol": "plaintext",
            topic: process.env.TRANSFER_TOPIC || "apps.1.matic.transfer",
            coders: {
                fileName: "matic_transfer",
                packageName: "matictransferpackage",
                messageType: "MaticTransferBlock",
                fileDirectory: path.resolve("dist", "./schemas")
            },
            type: 'synchronous'
        }, {
            next: async (message: DeserialisedMessage) => {
                const transformedBlock = message.value as ITransformedBlock<IMaticTransferTx>;
                const transfers: IMaticTransferTx[] = transformedBlock.data as IMaticTransferTx[];

                if (transfers && transfers.length > 0) {
                    await transferService.save(
                        transferMapper.map(transformedBlock)
                    );
                }
            },
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
