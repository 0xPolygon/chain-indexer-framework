import { TransactionReceipt } from "web3-core";

export interface IWeb3TransactionReceipt extends Omit<TransactionReceipt, "effectiveGasPrice"> {
  effectiveGasPrice?: string | number;
}
