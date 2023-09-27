import Long from "long";

export default interface INFTTransferTx {
    transactionIndex: Long,
    transactionHash: string,
    transactionInitiator: string,
    tokenAddress: string,
    senderAddress: string,
    receiverAddress: string,
    tokenId: number,
}
