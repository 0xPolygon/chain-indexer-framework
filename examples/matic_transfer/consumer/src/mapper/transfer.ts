import { ITransformedBlock } from "@maticnetwork/chain-indexer-framework/interfaces/transformed_block";
import { Logger } from "@maticnetwork/chain-indexer-framework/logger";
import IMaticTransferTx from "../interfaces/matic_transfer_tx.js";
import { ITransfer } from "../interfaces/transfer.js";

/**
 * TransferMapper class is a mapper class which has function to map the data according to all matic transfers and
 * these functions are not async as there is only data transformation according to the way it will be saved in mongodb.
 * 
 * @class TransferMapper
 */
export default class TransferMapper {

    /**
     * this is a public function which takes data from the kafka consumer and return in the form
     * where it will be saved in db for matic transfer transactions. it will be used when user want 
     * to have data for all matic transfers.
     * 
     * @param {ITransformedBlock<IMaticTransferTx>} transformedBlock - data from the kafka consumer

     * @returns {ITransfer[]}
     */
    public map(transformedBlock: ITransformedBlock<IMaticTransferTx>): ITransfer[] {
        let transfers: ITransfer[] = [];

        for (const transfer of transformedBlock.data) {
            transfers.push({
                transactionIndex: transfer.transactionIndex.toNumber(),
                transactionHash: transfer.transactionHash,
                transactionInitiator: transfer.transactionInitiator,
                tokenAddress: transfer.tokenAddress,
                senderAddress: transfer.senderAddress,
                receiverAddress: transfer.receiverAddress,
                amount: transfer.amount,
                timestamp: new Date(parseInt(transformedBlock.timestamp.toString())),
                blockNumber: transformedBlock.blockNumber.toNumber()
            });
        }

        //Remove below when app is stable
        Logger.debug({
            location: "mapper: transfers",
            function: "mapTransfers",
            status: "function completed",
        })
        return transfers;
    }
}
