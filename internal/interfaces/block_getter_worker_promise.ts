import { IBlock } from "./block.js";

export interface IBlockGetterWorkerPromise {
  block: IBlock, error: Error | null
}
