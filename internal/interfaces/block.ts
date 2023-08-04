import { ITransaction } from "./transaction.js";
import Long from "long";

export interface IBlock {
    difficulty?: string;
    totalDifficulty?: string;
    number: Long;
    gasLimit: Long;
    baseFeePerGas?: string;
    gasUsed: Long;
    logsBloom: string;
    hash: string;
    parentHash: string;
    receiptsRoot: string;
    sha3Uncles: string;
    size: string;
    stateRoot: string;
    timestamp: Long;
    transactionsRoot: string;
    miner: string;
    nonce: Long;
    extraData: string;
    transactions: ITransaction[];
    //TODO - store uncles.
}
