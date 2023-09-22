import { Logger } from "@maticnetwork/chain-indexer-framework/logger";
import { Model } from "mongoose";
import { IToken } from "../interfaces/token.js";

/**
 * TransferTokenService class has all the exposed functions to fetch transfer data from db so that API service can create an
 * instance of this class and can call these function and get data as per the requirement. 
 */
export default class TransferTokenService {
    /**
     * @constructor
     * 
     * @param {Model<IToken>} transferModel 
     */
    constructor(
        private transferModel: Model<IToken>,
    ) { }

    /**
     * this is a public function which takes an array of NFT transfer events and save it in mongodb.
     * 
     * @param {IToken[]} data - data to be saved in mongo
     * 
     * @returns {Promise<boolean>}
     */
    public async save(data: IToken[]): Promise<boolean> {
        Logger.debug({
            location: "transfer_token_service",
            function: "saveTokenTransfers",
            status: "function call",
            data: {
                length: data.length
            }
        });


        if (data && data.length) {
            //@ts-ignore
            await this.transferModel.updateTokens(data);
        }

        Logger.debug({
            location: "transfer_token_service",
            function: "saveTokenTransfers",
            status: "function completed"
        });

        return true;
    }
}
