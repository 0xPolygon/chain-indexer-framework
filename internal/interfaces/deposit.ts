import { TokenType } from "../enums/tokentype.js";
import { BridgeType } from "../enums/bridgetype.js";

export interface IDeposit {
    tokenType: TokenType,
    bridgeType: BridgeType;
    transactionHash: string,
    depositor: string,
    depositReceiver: string,
    rootToken: string,
    amounts?: string[],
    tokenIds?: string[],
    timestamp?: number,
    rootTunnelAddress?: string
    refuel?: boolean
}
