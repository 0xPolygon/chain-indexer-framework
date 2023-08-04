import { IEventLog } from "./event_log.js";
import Long from "long";

export interface ITransactionReceipt {
    transactionHash: string;
    transactionIndex: Long;
    from: string;
    to: string
    blockNumber: Long;
    blockHash: string;
    contractAddress?: string | null; //Have to add null as web3.js types are incorrect.
    gasUsed: Long;
    cumulativeGasUsed: Long;
    logs: IEventLog[];
    logsBloom: string;
    status: boolean;
    effectiveGasPrice?: string;
}
