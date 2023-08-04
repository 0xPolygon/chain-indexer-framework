export interface IBlockHeader {
    number: number;
    hash: string;
    gasLimit: number;
    gasUsed: number;
    logsBloom: string;
    parentHash: string;
    receiptsRoot: string;
    sha3Uncles: string;
    stateRoot: string;
    timestamp: number|string;
    transactionsRoot: string;
    miner: string;
    nonce: string;
    extraData?: string;
}
