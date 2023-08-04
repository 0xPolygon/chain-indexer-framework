import { IRawTransaction } from "./raw_transaction.js";

export interface IRawBlock {
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
  transactions: IRawTransaction[];
  uncles?: string[];
}
