import { ClientSession } from "mongoose";
import { ITransfer } from "./transfer.js";

/**
 * this class contains methods to interact with the database methods
 * 
 * @returns implementation of all the transfer model method
 */
const statics = {

    /**
     * Get all the documents from the transfer collection
     * 
     * @param {number} page 
     * @param {number} pageSize 
     * @param {object} condition 
     * 
     * @returns {Promise<ITransfer[] | null>}
     */
    getAll(page: number, pageSize: number, condition: object = {}): Promise<ITransfer[] | null> {
        //Check below and change to  (page - 1) * pageSize for skip if does not start from 0.
        //@ts-ignore
        return this.find(condition, null, { limit: pageSize, skip: page * pageSize }).sort({ timestamp: -1 }).exec();
    },

    /**
     * Get the last block number in the transfer collection for matic transfers
     * 
     * @returns {Promise<number>}
     */
    async getLastTransferBlock(): Promise<number> {
        //@ts-ignore
        const tx = await this.findOne().sort({ timestamp: -1 }).exec();

        return tx?.blockNumber || 0;
    },

    /**
     * Inserts multiple documents for matic transfers into transfer collection 
     * 
     * @param {ITransfer[]} data 
     * @param {ClientSession} session 
     * 
     * @returns {Promise<void>}
     */
    async addAllTransfers(data: ITransfer[], session: ClientSession): Promise<void> {
        for (let transfer of data) {
            //@ts-ignore
            await this.create([transfer], { rawResult: false, session: session });
        }
        return;
    },

    /**
     * Get the transaction count based on the condition being passed
     * 
     * @param {object} condition 
     * 
     * @returns {Promise<number>}
     */
    getTransactionCount(condition?: object): Promise<number> {
        let countQuery: object = {};

        if (condition) {
            countQuery = { ...countQuery, ...condition }
        }
        //@ts-ignore
        return this.countDocuments(countQuery).exec();
    },

    /**
     * Deletes all the transactions for reorg
     * 
     * @param {number} blockNumber 
     * @param {ClientSession} session 
     * 
     * @returns {Promise<number>}
     */
    async deleteTxsForReorg(blockNumber: number, session: ClientSession): Promise<number> {

        let deletedCount = (
            //@ts-ignore
            await this.deleteMany({ blockNumber: { $gte: blockNumber } }, { session })
        ).deletedCount;

        return deletedCount;
    }
}

export default statics;
