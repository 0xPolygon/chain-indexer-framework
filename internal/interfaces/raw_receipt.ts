export interface IRawEventLog {
  address: string;
  data: string;
  logIndex: string;
  topics: string[];
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  removed?: boolean;
}

export interface IRawReceipt {
  transactionHash: string;
  transactionIndex: string;
  from: string;
  to: string
  blockNumber: string;
  blockHash: string;
  contractAddress?: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  logs: IRawEventLog[];
  logsBloom: string;
  status: string;
  effectiveGasPrice?: string;
}
