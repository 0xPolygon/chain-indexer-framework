type Log = {
  lid: string;
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionIndex: string;
  logIndex: string;
  removed: boolean;
}

type Account = {
  "@type": "Account";
  address: string;
}

type Transaction = {
  hash: string;
  blockNumber: string
  from: Account
  gas: string
  gasPrice: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  input: string
  nonce: string
  to: Account
  transactionIndex: string
  value: string
  fee: string
  type: string
  chainId: string
  v: string
  r: string
  s: string
  logsBloom: string
  root: string
  contractAddress: string
  cumulativeGasUsed: string
  gasUsed: string
  status: string
  logs: Log[]
}

export interface IStreamApiBlock {
  hash: string;
  number: string;
  baseFeePerGas: string;
  difficulty: string;
  extraData: string;
  gasLimit: string;
  gasUsed: string;
  logsBloom: string;
  miner: Account;
  mixHash: string;
  nonce: string;
  parentHash: string;
  receiptsRoot: string;
  sha3Uncles: string;
  size: string
  stateRoot: string
  timestamp: string
  totalDifficulty: string
  transactions: Transaction[]
  transactionsRoot: string
  ommerCount: string
  logs: Log[]
}
