import Long from "long";
import { ITransactionReceipt } from "./transaction_receipt.js";

export interface ITransaction {
    hash: string,
    nonce: Long,
    blockHash: string | null,
    blockNumber: Long | null,
    transactionIndex: Long | null,
    from: string,
    to: string | null,
    value: string,
    gasPrice: string,
    gas: Long,
    input: string,
    maxFeePerGas?: string, 
    maxPriorityFeePerGas?: string,
    chainId: string,
    v: string,
    r: string,
    s: string,
    type: number,
    receipt: ITransactionReceipt
}
