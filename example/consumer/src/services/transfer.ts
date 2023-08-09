import { Logger } from "@maticnetwork/chainflow/logger";
import { Model } from "mongoose";
import { ITransfer } from "../interfaces/transfer.js";
import { IQueryResponse } from "../interfaces/query_response.js";

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

        const session = await this.transferModel.startSession();
        session.startTransaction();

        Logger.debug({
            location: "transfer_service",
            function: "saveTransfers",
            status: "function call",
            data: {
                length: data.length
            }
        });


        if (data && data.length > 0) {
            //@ts-ignore
            const latestTransferBlockNumber = await this.transferModel.getLastTransferBlock();

            if (latestTransferBlockNumber >= data[0].blockNumber) {
                //@ts-ignore
                await this.transferModel.deleteTxsForReorg(data[0].blockNumber, session);
            }
            //@ts-ignore
            await this.transferModel.addAllTransfers(data, session);
            await session.commitTransaction();
            await session.endSession();
        }

        Logger.debug({
            location: "transfer_service",
            function: "saveTransfers",
            status: "function completed"
        });

        return true;
    }

    /**
     * this returns all the transfer transactions
     * 
     * @param {number} page
     * @param {number} pageSize
     * @param {object} condition
     * 
     * @returns {Promise<IQueryResponse<ITransferERC20>>}
     */
    public async getAllTransactions(
        page: number,
        pageSize: number,
        condition: object = {}
    ): Promise<IQueryResponse<ITransfer>> {
        //@ts-ignore
        const totalCount = await this.transferModel.getTransactionCount(condition);
        return {
            //@ts-ignore
            result: await this.transferModel.getAll(page, pageSize, condition) ?? [],
            paginationData: {
                hasNextPage: (page * pageSize) <= totalCount,
                page,
                pageSize,
                totalCount
            }
        };
    }
}