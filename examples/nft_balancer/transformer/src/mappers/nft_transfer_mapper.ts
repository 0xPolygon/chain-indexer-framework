import { ITransaction } from "@maticnetwork/chain-indexer-framework/interfaces/transaction";
import { IMapper } from "@maticnetwork/chain-indexer-framework/interfaces/mapper";
import { ABICoder } from "@maticnetwork/chain-indexer-framework/coder/abi_coder";
import { BloomFilter } from "@maticnetwork/chain-indexer-framework/filter";
import INFTTransferTx from "../interfaces/nft_transfer_tx.js";

import dotenv from 'dotenv';
dotenv.config();

/**
 * NFT Transfer Mapper maps a given transaction to NFT token transfer events if exisiting
 * in the transaction
 * 
 * @author - Nitin Mittal, Polygon Technology
 */
export class NFTTransferMapper implements IMapper<ITransaction, INFTTransferTx> {
    /**
     * Maps the given transaction receipt object to INFTTransfer Txs
     * 
     * @param {ITransaction} transaction - The transaction to be mapped.
     * 
     * @returns {INFTTransferTx[]} - Returns an array of nft transfer transaction events.
     */
    map(transaction: ITransaction): INFTTransferTx[] {
        const logsBloom = transaction.receipt.logsBloom;
        let transfers: INFTTransferTx[] = [];

        if (this.isNFTTransfer(logsBloom)) {
            let maticTransfer = this.mapTransferErc20(transaction);
            transfers = [...transfers, ...maticTransfer];
        }

        return transfers;
    }

    /**
     * Returns the mapped transaction to NFT Transfers
     * 
     * @param {ITransaction} transaction - The transaction details
     * 
     * @returns {INFTTransferTx[]} - NFT transfer transaction object
     */
    private mapTransferErc20(transaction: ITransaction): INFTTransferTx[] {
        let transfers: INFTTransferTx[] = [];

        for (const log of transaction.receipt.logs) {
            if (
                log.topics.length && log.topics.length >= 3 &&
                // Check if event was emitted by NFT Contract
                log.address.toLowerCase() === (process.env.NFT_CONTRACT as string).toLowerCase()
            ) {
                transfers.push({
                    transactionIndex: transaction.receipt.transactionIndex,
                    transactionHash: transaction.hash.toLowerCase(),
                    transactionInitiator: transaction.from.toLowerCase(),
                    tokenAddress: log.address.toLowerCase(),
                    tokenId: parseInt(ABICoder.decodeParameter("uint256", log.topics[3])),
                    senderAddress: ABICoder.decodeParameter("address", log.topics[1]).toLowerCase(),
                    receiverAddress: ABICoder.decodeParameter("address", log.topics[2]).toLowerCase()
                })
            }
        }

        return transfers;
    }

    /**
     * @private
     * Returns true if a nft transfer event exists in the logsBloom provided. 
     * 
     * @param {string} logsBloom - The logsbloom string to perform the check on.
     * 
     * @returns {boolean} - true if transfer exists, false otherwise.
     */
    private isNFTTransfer(logsBloom: string): boolean {
        return BloomFilter.isTopicInBloom(logsBloom,
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" // ERC20_ERC721_TRANSFER_TOPIC
        ) && BloomFilter.isContractAddressInBloom(
            logsBloom,
            process.env.NFT_CONTRACT as string
        );
    }
}
