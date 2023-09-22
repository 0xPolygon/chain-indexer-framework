import { IToken } from "./token.js";

/**
 * this class contains methods to interact with the database methods
 * 
 * @returns implementation of all the token model method
 */
const statics = {

    /**
     * Inserts multiple documents for NFT ownership into token collection 
     * 
     * @param {IToken[]} data 
     * @param {ClientSession} session 
     * 
     * @returns {Promise<void>}
     */
    async updateTokens(data: IToken[]): Promise<void> {
        for (let transfer of data) {
            //@ts-ignore
            await this.updateOne({ tokenId: transfer.tokenId }, { owner: transfer.owner }, { upsert: true });
        }
        return;
    }
}

export default statics;
