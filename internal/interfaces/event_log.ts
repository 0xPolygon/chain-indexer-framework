import Long from "long";

export interface IEventLog {
    address: string;
    data: string;
    logIndex: Long;
    topics: string[];
    transactionHash: string;
    transactionIndex: Long;
    blockHash: string;
    blockNumber: Long;
    removed?: boolean;
}
