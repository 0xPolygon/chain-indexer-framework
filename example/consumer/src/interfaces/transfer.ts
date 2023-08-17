
/**
 * Interface for token transfers. it has attributes which is present in mongodb and the way it will
 * be saved there for all transfers.
*/
export interface ITransfer {
    transactionIndex: number,
    transactionHash: string,
    transactionInitiator: string,
    tokenAddress: string,
    senderAddress: string,
    receiverAddress: string,
    amount: string,
    timestamp: Date,
    blockNumber: number
}
