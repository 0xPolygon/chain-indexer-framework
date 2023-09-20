import Long from "long";

export default interface IMaticTransferTx {
    transactionIndex: Long,
    transactionHash: string,
    transactionInitiator: string,
    tokenAddress: string,
    senderAddress: string,
    receiverAddress: string,
    amount: string,
}
