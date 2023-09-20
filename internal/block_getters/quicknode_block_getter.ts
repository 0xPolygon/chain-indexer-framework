import utils from "web3-utils";
import { WebsocketProvider } from "web3-core";
import { IQuickNodeResponse } from "../interfaces/quicknode_response.js";
import { ITransaction } from "../interfaces/transaction.js";
import { IBlock } from "../interfaces/block.js";
import { IBlockGetter } from "../interfaces/block_getter.js";
import { BlockGetter } from "./block_getter.js";
import { Eth } from "web3-eth";

/**
 * A wrapper class on web3 to get blocks from quicknode and format them.
 * 
 * @author - Vibhu Rajeev
 */
export class QuickNodeBlockGetter extends BlockGetter implements IBlockGetter {

    /**
     * @param {Eth} eth - Eth module from web3.js
     * @param {number} maxRetries - The number of times to retry on errors.
     *
     * @constructor
     */
    constructor(eth: Eth, maxRetries: number = 0, private alternateEth?: Eth, private rpcTimeout?: number) {
        super(eth, maxRetries);
    }

    /**
     * @async
     * Public method to query block data including transaction receipts of a single block.
     * 
     * @param {number | string} blockNumber - The block number for which block data needs to be retrieved. 
     * 
     * @returns {Promise<IBlock>} - Block object containing all details including transaction receipts.
     * 
     * @throws {Error} - Throws error object on failure.
     */
    public async getBlockWithTransactionReceipts(blockNumber: number | string, retryCount: number = 0): Promise<IBlock> {
        try {
            const response: IQuickNodeResponse = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Request timed out for block: ${blockNumber}`));
                }, this.rpcTimeout || 4000);

                let eth: Eth = this.eth;
                if (retryCount > 0 && this.alternateEth) {
                    eth = this.alternateEth;
                }

                (eth.currentProvider as WebsocketProvider).send({
                    method: "qn_getBlockWithReceipts",
                    id: Date.now().toString() + blockNumber,
                    params: [utils.numberToHex(blockNumber)],
                    jsonrpc: "2.0"
                }, (error, response) => {
                    if (error) {
                        clearTimeout(timeout);
                        reject(error);
                    }

                    clearTimeout(timeout);
                    resolve(response?.result);
                });
            });

            const transactions: ITransaction[] = [];

            for (const transactionObject of response.block.transactions) {
                transactions.push(this.formatRawTransactionObject(
                    transactionObject,
                    this.formatRawReceipt(response.receipts.find(
                        (receipt) => receipt.transactionHash === transactionObject.hash
                    )) ??
                    await this.getTransactionReceipt(transactionObject.hash)
                ));
            }

            return this.formatRawBlock(
                response.block,
                transactions
            );
        } catch (error) {
            if (retryCount < this.maxRetries) {
                return this.getBlockWithTransactionReceipts(
                    blockNumber,
                    retryCount + 1
                );
            }

            throw error;
        }
    }
}
