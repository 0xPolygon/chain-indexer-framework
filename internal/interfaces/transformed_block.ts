import Long from "long";

export interface ITransformedBlock<T> {
    blockNumber: Long,
    timestamp: Long,
    data: T[]
}
