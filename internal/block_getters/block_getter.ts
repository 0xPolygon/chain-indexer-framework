import { Block, BlockTransactionObject, Eth, TransactionReceipt } from "web3-eth";
import { ITransactionReceipt } from "../interfaces/transaction_receipt.js";
import { BlockProducerError } from "../errors/block_producer_error.js";
import { IWeb3Transaction } from "../interfaces/web3_transaction.js";
import { BlockFormatter } from "../formatters/block_formatter.js";
import { ITransaction } from "../interfaces/transaction.js";
import { IBlock } from "../interfaces/block.js";
import { IBlockGetter } from "../interfaces/block_getter.js";
import { Logger } from "../logger/logger.js";

/**
 * A wrapper class on web3 block related functions
 * 
 * @author - Vibhu Rajeev, Nitin Mittal
 */
export class BlockGetter extends BlockFormatter implements IBlockGetter { 
    /**
     * @param {Eth} eth - Eth module from web3.js
     * @param {number} maxRetries - The number of times to retry on errors.
     * 
     * @constructor
     */
    constructor(protected eth: Eth, protected maxRetries: number = 0) { 
        super();
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
        return await this.eth.getBlock(blockNumber);
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
    public async getBlockWithTransactionReceipts(blockNumber: number | string): Promise<IBlock> {
        const block: BlockTransactionObject = await this.eth.getBlock(blockNumber, true);
        Logger.debug(`Fetching transaction receipts for the following block ${block.number}`);

        const transactions: ITransaction[] = [];

        for (const transactionObject of block.transactions) {
            transactions.push(
                this.formatTransactionObject(
                    transactionObject as IWeb3Transaction,
                    await this.getTransactionReceipt(transactionObject.hash)
                )
            );
        }

        return this.formatBlockWithTransactions(
            block,
            transactions
        );
    }

    /**
     * @async
     * Public method to query the current block number.
     * 
     * @returns {Promise<number>} - the current block.
     * 
     * @throws {Error} - Throws error object on failure.
     */
    public getLatestBlockNumber(): Promise<number> {
        return this.eth.getBlockNumber();
    }

    /**
     * @async
     * This internal method retrieves the transaction receipt of the given transaction hash and retries upto retryLimit on failure. 
     * 
     * @param {string} transactionHash - The transaction hash for which transaction receipt is to be retrieved.  
     * @param {number} errorCount - Parameter for the function to know the number of times query has been retried. 
     * This parameter must ideally not be set by an external call. 
     * 
     * @returns {Promise<ITransactionReceipt>} - The transaction receipt of the given transaction hash. On failure throws error object. 
     * 
     * @throws {Error} - Throws error object on failure.
     */
    protected async getTransactionReceipt(transactionHash: string, errorCount: number = 0): Promise<ITransactionReceipt> {
        try {
            const transactionReceipt: TransactionReceipt = await this.eth.getTransactionReceipt(transactionHash);

            if (transactionReceipt === null) {
                throw new BlockProducerError(
                    "Block producer error",
                    BlockProducerError.codes.RECEIPT_NOT_FOUND,
                    false,
                    `Transaction receipt not found for ${transactionHash}.`,
                    "remote"
                );
            }

            return this.formatTransactionReceipt(transactionReceipt);
        } catch (error) {
            if (errorCount >= this.maxRetries) {
                throw error;
            }

            return this.getTransactionReceipt(transactionHash, errorCount + 1);
        }
    }
}
