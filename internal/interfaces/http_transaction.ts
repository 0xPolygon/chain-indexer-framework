export interface IHttpTransaction {
    hash: string;
    nonce: string;
    blockHash: string | null;
    blockNumber: string;
    transactionIndex?: string;
    from: string;
    to: string | null;
    value: string | string;
    gasPrice: string | string;
    gas: string;
    input: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    chainId: string;
    v: string;
    r: string;
    s: string;
    type: number;
}
