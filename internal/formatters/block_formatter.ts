import { ITransactionReceipt } from "../interfaces/transaction_receipt.js";
import { ITransaction } from "../interfaces/transaction.js";
import { BlockTransactionObject } from "web3-eth";
import { formatters } from "web3-core-helpers";
import { IBlock } from "../interfaces/block.js";
import Long from "long";
import { IRawBlock } from "../interfaces/raw_block.js";
import { IRawTransaction } from "../interfaces/raw_transaction.js";
import { IRawReceipt } from "../interfaces/raw_receipt.js";
import { IWeb3Transaction } from "../interfaces/web3_transaction.js";
import { IWeb3TransactionReceipt } from "../interfaces/web3_transaction_receipt.js";
import utils from "web3-utils";


export class BlockFormatter {
    /**
     * @protected 
     * 
     * Formats a raw transaction receipt response from a JSON RPC request to EVM Client. 
     *  
     * @param {IRawReceipt} receipt - The transaction receipt to format.
     * 
     * @returns { ITransactionReceipt | void } - The formatted transaction receipt object.
     */
    protected formatRawReceipt(receipt?: IRawReceipt): ITransactionReceipt | void {
        if (!receipt) {
            return;
        }

        if (typeof receipt !== "object") {
            throw new Error("Received receipt is invalid: " + receipt);
        }

        return this.formatTransactionReceipt({
            ...receipt,
            blockNumber: utils.hexToNumber(receipt.transactionIndex) as number,
            cumulativeGasUsed: utils.hexToNumber(receipt.cumulativeGasUsed) as number,
            transactionIndex: utils.hexToNumber(receipt.transactionIndex) as number,
            gasUsed: utils.hexToNumber(receipt.gasUsed) as number,
            logs: receipt.logs?.length ? receipt.logs.map(log => formatters.outputLogFormatter(log)) : [],
            effectiveGasPrice: receipt.effectiveGasPrice,
            status: typeof receipt.status !== "undefined" && receipt.status !== null ?
                Boolean(parseInt(receipt.status)) : false
        });
    }

    /**
     * @protected 
     * 
     * Formats a raw transaction object returned by an evm client. 
     * 
     * @param {IRawTransaction} transaction - The transaction object to format.
     * @param {ITransactionReceipt} receipt - Formatted transaction receipt object to be 
     * added to transaction object.
     * 
     * @returns {ITransaction} - The formatted transaction object.
     */
    protected formatRawTransactionObject(transaction: IRawTransaction, receipt: ITransactionReceipt): ITransaction {
        return this.formatTransactionObject(
            formatters.outputTransactionFormatter(transaction),
            receipt
        );
    }

    /**
     * @protected
     * 
     * Formats a raw block response returned by a JSON RPC request to evm client.
     * 
     * @param {IRawBlock} block - The block object to be formatted.
     * @param {[ITransaction]} transactions - Formatted transactions array that needs to be added
     * to the formatted block object.
     * 
     * @returns {IBlock} - Formatted block object with transactions and transaction receipts.
     */
    protected formatRawBlock(block: IRawBlock, transactions: ITransaction[]): IBlock {
        return this.formatBlockWithTransactions(
            formatters.outputBlockFormatter(block),
            transactions
        );
    }

    /**
     * @protected
     * 
     * Formats a block object that is returned by 'web3.js'.
     * 
     * @param {BlockTransactionObject} block - The block object to be formatted returned by 'web3.js'.
     * @param {[ITransaction]} transactions - Formatted transactions array that needs to be added
     * to the formatted block object.
     * 
     * @returns {IBlock} - Formatted block object with transactions and transaction receipts.
     */
    protected formatBlockWithTransactions(block: BlockTransactionObject, transactions: ITransaction[]): IBlock {
        return {
            ...block,
            nonce: Long.fromValue(
                utils.hexToNumberString(
                    block.nonce
                ),
                true
            ),
            difficulty: utils.toHex(block.difficulty),
            totalDifficulty: utils.toHex(block.totalDifficulty),
            timestamp: Long.fromValue((block.timestamp as number) * 1000, true),
            number: Long.fromValue(block.number, true),
            baseFeePerGas: (block.baseFeePerGas || block.baseFeePerGas === 0 ?
                utils.toHex(block.baseFeePerGas) :
                undefined
            ),
            size: utils.toHex(block.size),
            transactions: transactions,
            gasLimit: Long.fromValue(block.gasLimit, true),
            gasUsed: Long.fromValue(block.gasUsed, true),
        };
    }

    /**
     * @protected 
     * 
     * Formats a raw transaction object that is returned by the 'web3.js' formatter. 
     * 
     * @param {IWeb3Transaction} transactionObject - The transaction object to format.
     * @param {ITransactionReceipt} receipt - Formatted transaction receipt object to be 
     * added to transaction object.
     * 
     * @returns {ITransaction} - The formatted transaction object.
     */
    protected formatTransactionObject(transactionObject: IWeb3Transaction, receipt: ITransactionReceipt): ITransaction {
        return {
            ...transactionObject,
            receipt,
            value: utils.toHex(transactionObject.value),
            transactionIndex: (
                transactionObject.transactionIndex || transactionObject.transactionIndex === 0 ?
                    Long.fromValue(transactionObject.transactionIndex, true) :
                    null
            ),
            gas: Long.fromValue(transactionObject.gas, true),
            gasPrice: utils.toHex(transactionObject.gasPrice),
            nonce: Long.fromValue(transactionObject.nonce, true),
            maxFeePerGas: (
                transactionObject.maxFeePerGas || transactionObject.maxFeePerGas === 0 ?
                    utils.toHex(
                        transactionObject.maxFeePerGas
                    ) :
                    undefined
            ),
            maxPriorityFeePerGas: (
                transactionObject.maxPriorityFeePerGas || transactionObject.maxPriorityFeePerGas === 0 ?
                    utils.toHex(
                        transactionObject.maxPriorityFeePerGas
                    ) :
                    undefined
            ),
            blockNumber: (
                transactionObject.blockNumber || transactionObject.blockNumber === 0 ?
                    Long.fromValue(transactionObject.blockNumber, true) :
                    null
            )
        };
    }

    /**
    * @protected 
    * 
    * Formats transaction receipt object returned or formatted by 'web3.js'. 
    *  
    * @param {IRawReceipt} transactionReceipt - The transaction receipt to format.
    * 
    * @returns { ITransactionReceipt | void } - The formatted transaction receipt object.
    */
    protected formatTransactionReceipt(transactionReceipt: IWeb3TransactionReceipt): ITransactionReceipt {
        return {
            ...transactionReceipt,
            effectiveGasPrice: (
                transactionReceipt.effectiveGasPrice || transactionReceipt.effectiveGasPrice === 0 ?
                    utils.toHex(
                        transactionReceipt.effectiveGasPrice
                    ) :
                    undefined
            ),
            cumulativeGasUsed: Long.fromValue(
                transactionReceipt.cumulativeGasUsed,
                true
            ),
            transactionIndex: Long.fromValue(
                transactionReceipt.transactionIndex,
                true
            ),
            blockNumber: Long.fromValue(
                transactionReceipt.blockNumber,
                true
            ),
            gasUsed: Long.fromValue(
                transactionReceipt.gasUsed,
                true
            ),
            logs: transactionReceipt.logs.map((log) => {
                return {
                    ...log,
                    transactionIndex: Long.fromValue(log.transactionIndex, true),
                    logIndex: Long.fromValue(log.logIndex, true),
                    blockNumber: Long.fromValue(log.blockNumber, true)
                };
            })
        };
    }
}
