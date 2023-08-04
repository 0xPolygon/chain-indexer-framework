import { Transaction } from "web3-core";

export interface IWeb3Transaction extends Transaction {
  chainId: string;
  v: string;
  r: string;
  s: string;
  type: number;
}
