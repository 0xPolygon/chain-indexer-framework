import { IRawReceipt } from "./raw_receipt.js";
import { IRawBlock } from "./raw_block.js";

export interface IQuickNodeResponse {
  block: IRawBlock,
  receipts: IRawReceipt[]
}
