import { IHttpTransaction } from "./http_transaction.js";

export interface IHttpBlock {
    difficulty: string;
    totalDifficulty: string;
    number: string;
    gasLimit: string;
    baseFeePerGas?: string;
    gasUsed: string;
    logsBloom: string;
    hash: string;
    parentHash: string;
    receiptsRoot: string;
    sha3Uncles: string;
    size: string;
    stateRoot: string;
    timestamp: string;
    transactionsRoot: string;
    miner: string;
    nonce: string;
    extraData: string;
    transactions: IHttpTransaction[];
    uncles?: string[];
}
