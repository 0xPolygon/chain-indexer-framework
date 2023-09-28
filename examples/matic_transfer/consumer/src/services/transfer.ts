import { Logger } from "@maticnetwork/chain-indexer-framework/logger";
import { Model } from "mongoose";
import { ITransfer } from "../interfaces/transfer.js";

/**
 * TransferService class has all the exposed functions to fetch transfer data from db so that API service can create an
 * instance of this class and can call these function and get data as per the requirement. 
 */
export default class TransferService {
    /**
     * @constructor
     * 
     * @param {Model<ITransfer>} transferModel 
     */
    constructor(
        private transferModel: Model<ITransfer>,
    ) { }

    /**
     * this is a public function which takes an array of matic transfer events and save it in mongodb.
     * parallely it also handles the reorg part where it checks for the last saved blocknumber and acts 
     * accordingly and returns a boolean value.
     * 
     * @param {ITransfer[]} data - data to be saved in mongo
     * 
     * @returns {Promise<boolean>}
     */
    public async save(data: ITransfer[]): Promise<boolean> {
        Logger.debug({
            location: "transfer_service",
            function: "saveTransfers",
            status: "function call",
            data: {
                length: data.length
            }
        });


        if (data && data.length) {
            //@ts-ignore
            const latestTransferBlockNumber = await this.transferModel.getLastTransferBlock();

            if (latestTransferBlockNumber >= data[0].blockNumber) {
                //@ts-ignore
                await this.transferModel.deleteTxsForReorg(data[0].blockNumber);
            }
            //@ts-ignore
            await this.transferModel.addAllTransfers(data);
        }

        Logger.debug({
            location: "transfer_service",
            function: "saveTransfers",
            status: "function completed"
        });

        return true;
    }
}
