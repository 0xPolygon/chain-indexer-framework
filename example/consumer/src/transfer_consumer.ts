import { ITransformedBlock } from "@maticnetwork/chainflow/interfaces/transformed_block";
import { DeserialisedMessage } from "@maticnetwork/chainflow/interfaces/deserialised_kafka_message";

import TransferService from "./services/transfer.js";
import TransferMapper from "./mapper/transfer.js";
import IMaticTransferTx from "./interfaces/matic_transfer_tx.js";

import { Logger } from "@maticnetwork/chainflow/logger";

/**
 * TransferConsumer class is a class which is having on transfer function which will map the event
 * accordingly and then save it to database
 * 
 * @class TransferConsumer
 */
export default class TransferConsumer {
    /**
     * @constructor
     * 
     * @param {TransferService} transferService - The transfer command class interface
     * @param {TransferMapper} transferMapper - the transfer Mapper class
    */
    constructor(
        private transferService: TransferService,
        private transferMapper: TransferMapper,
    ) { }

    /**
     * Public callback method for the consumer to call when any transfer data is received. this function will
     * save matic transfers data in transfer DB collection
     * 
     * @param {DeserialisedMessage} message - Data that is received from kafka consumer
     * 
     * @returns {Promise<void>}
     */
    public async onTransferData(message: DeserialisedMessage): Promise<void> {
        const transformedBlock = message.value as ITransformedBlock<IMaticTransferTx>;
        const transfers: IMaticTransferTx[] = transformedBlock.data as IMaticTransferTx[];

        Logger.debug({
            location: "transfer_consumer",
            function: "onTransferData",
            status: "function call",
            data: {
                blockNumber: transformedBlock.blockNumber,
                dataLength: transfers.length
            }
        });

        if (transfers && transfers.length > 0) {
            await this.transferService.save(
                this.transferMapper.map(transformedBlock)
            );
        }

        Logger.debug({
            location: "transfer_consumer",
            function: "onTransferData",
            status: "function completed"
        });
    }
}
