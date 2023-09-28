import { ITransformedBlock } from "@maticnetwork/chain-indexer-framework/interfaces/transformed_block";
import { Logger } from "@maticnetwork/chain-indexer-framework/logger";
import INFTTransferTx from "../interfaces/nft_transfer_tx.js";
import { IToken } from "../interfaces/token.js";

/**
 * TransferTokenMapper class is a mapper class which has function to map the data according to all NFT transfers and
 * these functions are not async as there is only data transformation according to the way it will be saved in mongodb.
 * 
 * @class TransferTokenMapper
 */
export default class TransferTokenMapper {

    /**
     * this is a public function which takes data from the kafka consumer and return in the form
     * where it will be saved in db for NFT token ownership. it will be used when user want 
     * to have data for all balances.
     * 
     * @param {ITransformedBlock<INFTTransferTx>} transformedBlock - data from the kafka consumer

     * @returns {IToken[]}
     */
    public map(transformedBlock: ITransformedBlock<INFTTransferTx>): IToken[] {
        let tokens: IToken[] = [];

        for (const transfer of transformedBlock.data) {
            tokens.push({
                owner: transfer.receiverAddress.toLowerCase(),
                tokenId: transfer.tokenId
            });
        }

        //Remove below when app is stable
        Logger.debug({
            location: "mapper: tokens",
            function: "mapTokens",
            status: "function completed",
        })
        return tokens;
    }
}
