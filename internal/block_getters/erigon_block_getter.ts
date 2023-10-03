import utils from "web3-utils";
import { WebsocketProvider } from "web3-core";
import { BlockTransactionObject } from "web3-eth";
import { ITransaction } from "../interfaces/transaction.js";
import { IBlock } from "../interfaces/block.js";
import { BlockGetter } from "./block_getter.js";
import { IBlockGetter } from "../interfaces/block_getter.js";
import { IRawReceipt } from "../interfaces/raw_receipt.js";
import { IWeb3Transaction } from "../interfaces/web3_transaction.js";

/**
 * A wrapper class on web3 to get blocks from erigon nodes and format them.
 * 
 * @author - Vibhu Rajeev
 */
export class ErigonBlockGetter extends BlockGetter implements IBlockGetter {

    /**
     * @async
     * Public method to query block data including transaction receipts of a single block.
     * 
     * @param {number | string} blockNumber - The block number for which block data needs to be retrieved. 
     * @param {number} retryCount - The amount of retries it should. Defaults to 0.
     * 
     * @returns {Promise<IBlock>} - Block object containing all details including transaction receipts.
     * 
     * @throws {Error} - Throws error object on failure.
     */
    public async getBlockWithTransactionReceipts(blockNumber: number | string, retryCount: number = 0): Promise<IBlock> {
        try {
            const result: [BlockTransactionObject, IRawReceipt[]] = await Promise.all([
                this.eth.getBlock(blockNumber, true),
                this.getTransactionReceipts(blockNumber)
            ]);

            const transactions: ITransaction[] = [];

            for (const transactionObject of result[0].transactions) {
                transactions.push(this.formatTransactionObject(
                    transactionObject as IWeb3Transaction,
                    this.formatRawReceipt(result[1]?.find(
                        (receipt) => receipt.transactionHash === transactionObject.hash
                    )) ??
                    await this.getTransactionReceipt(transactionObject.hash)
                ));
            }

            return this.formatBlockWithTransactions(
                result[0],
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

    /**
     * @private 
     * 
     * Private method to get all transaction receipts for a block.
     * 
     * @param {number | string} blockNumber - Block number for which transaction receipts are to be retrieved. 
     * 
     * @returns {Promise<IRawReceipt[]>} - Array of raw transaction receipts.
     */
    private getTransactionReceipts(blockNumber: number | string): Promise<IRawReceipt[]> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Request timed out for block: ${blockNumber}`));
            }, 45000);

            this.sendTransactionReceiptsCall(blockNumber, timeout, resolve, reject);
        });
    }

    /**
     * Private method to make an RPC call through provider, to get transaction receipts for a block.
     * 
     * @param {number} blockNumber - Block number for which receipts need to be retrieved. 
     * @param {NodeJS.Timeout} timeout - Timeout instance that needs to be cleared on successful query. 
     * @param {(value: IRawReceipt[] | PromiseLike<IRawReceipt[]>) => void} resolve - 
     * The resolve callback that needs to be called on successful query.
     * @param {(reason?: any) => void} reject - The reject callback that needs to be called 
     * on failed query.
     * @param {boolean} [isRetry=false] - Boolean that is not to be set by external calls. 
     * Is used by internal recursive calls to identify if this request is a retry.
     * 
     * @returns {void} 
     */
    private sendTransactionReceiptsCall(
        blockNumber: number | string, 
        timeout: NodeJS.Timeout, 
        resolve: (value: IRawReceipt[] | PromiseLike<IRawReceipt[]>) => void, 
        reject: (reason?: any) => void, 
        isRetry: boolean = false
    ): void {
        (this.eth.currentProvider as WebsocketProvider).send({
            method: "eth_getBlockReceipts",
            id: Date.now().toString() + blockNumber,
            params: [utils.numberToHex(blockNumber)],
            jsonrpc: "2.0"
        }, (error, response) => {
            if (error) {
                clearTimeout(timeout);
                reject(error);

                return;
            }

            if (!response?.result && !isRetry) {
                setTimeout(() => {
                    this.sendTransactionReceiptsCall(blockNumber, timeout, resolve, reject, true);
                }, 500);

                return;
            }

            clearTimeout(timeout);
            resolve(response?.result);
        });
    }
}
