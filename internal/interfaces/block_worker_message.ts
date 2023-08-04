import { IBlock } from "./block.js";

export interface IBlockWorkerMessage {
  callBackId: number;
  error: null | Error;
  block: IBlock
}
