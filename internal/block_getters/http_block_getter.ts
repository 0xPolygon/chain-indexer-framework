import { Block, Eth } from "web3-eth";
import utils from "web3-utils";
import { WebsocketProvider } from "web3-core";
import { IBlock } from "../interfaces/block.js";
import { BlockGetter } from "./block_getter.js";
import { IBlockGetter } from "../interfaces/block_getter.js";
import { ITransaction } from "../interfaces/transaction.js";
import { Logger } from "../logger/logger.js";
import { IHttpBlock } from "../interfaces/http_block.js";
import { IHttpTransaction } from "../interfaces/http_transaction.js";

/**
 * A wrapper class on web3 block related functions
 *
 */
export class HttpBlockGetter extends BlockGetter implements IBlockGetter {
    /**
     * @param {Eth} eth - Eth module from web3.js
     * @param {number} maxRetries - The number of times to retry on errors.
     * @param {rpcTimeout} rpcTimeout - Option param to set timeout on the RPC call
     *
     * @constructor
     */
    constructor(eth: Eth, maxRetries: number = 0, private rpcTimeout?: number) {
        super(eth, maxRetries);
    }

    /**
     * @async
     * Public method to query block data of a single block
     *
     * @param {number | string} blockNumber - Block number to query the block details for.
     *
     * @returns {Promise<Block>} - Block object
     */
    public async getBlock(blockNumber: number | string): Promise<Block> {
        Logger.debug("getBlock called on getter");
        return await new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(
                    new Error(`Request timed out for block: ${blockNumber}`)
                );
            }, this.rpcTimeout ?? 4000);
            const eth: Eth = this.eth;
            (eth.currentProvider as WebsocketProvider).send(
                {
                    method: "eth_getBlockByNumber",
                    id: Date.now().toString() + blockNumber,
                    params: [utils.numberToHex(blockNumber)],
                    jsonrpc: "2.0",
                },
                (error, response) => {
                    if (error) {
                        clearTimeout(timeout);
                        reject(error);
                    }

                    if (!response?.result) {
                        clearTimeout(timeout);
                        reject(
                            new Error(
                                `null response received for block: ${blockNumber}`
                            )
                        );
                    }

                    clearTimeout(timeout);
                    resolve(response?.result);
                }
            );
        });
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
    public async getBlockWithTransactionReceipts(
        blockNumber: number | string
    ): Promise<IBlock> {
        Logger.debug(`Fetching block ${blockNumber}`);
        const block: IHttpBlock = await new Promise(async (resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(
                    new Error(`Request timed out for block: ${blockNumber}`)
                );
            }, this.rpcTimeout ?? 4000);
            const eth: Eth = this.eth;
            (eth.currentProvider as WebsocketProvider).send(
                {
                    method: "eth_getBlockByNumber",
                    id: Date.now().toString() + blockNumber,
                    params: [utils.numberToHex(blockNumber), true],
                    jsonrpc: "2.0",
                },
                (error, response) => {
                    if (error) {
                        clearTimeout(timeout);
                        reject(error);
                    }

                    if (!response?.result) {
                        clearTimeout(timeout);
                        reject(
                            new Error(
                                `null response received for block: ${blockNumber}`
                            )
                        );
                    }

                    clearTimeout(timeout);
                    resolve(response?.result);
                }
            );
        });
        Logger.debug(
            `Fetching transaction receipts for the following block ${block.number}`
        );

        const transactions: ITransaction[] = [];

        for (const transactionObject of block.transactions) {
            Logger.debug(`Processing transaction object ${transactionObject}`);
            transactions.push(
                this.formatHttpTransactionObject(
                    transactionObject as IHttpTransaction,
                    await this.getTransactionReceipt(transactionObject.hash)
                )
            );
        }
        Logger.debug(
            `Fetched transactions receipts successfully for the following block ${block.number}`
        );

        return this.formatHttpBlock(block, transactions);
    }
}
