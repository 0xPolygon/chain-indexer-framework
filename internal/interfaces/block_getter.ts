import { Block } from "web3-eth";
import { IBlock } from "./block.js";

export interface IBlockGetter {
    getBlock(blockNumber: number|string): Promise<Block>;
    getBlockWithTransactionReceipts(blockNumber: number): Promise<IBlock>;
    getLatestBlockNumber(): Promise<number>;
}
