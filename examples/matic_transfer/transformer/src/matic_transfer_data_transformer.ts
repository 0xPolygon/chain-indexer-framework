import { ITransformedBlock } from "@maticnetwork/chain-indexer-framework/interfaces/transformed_block";
import { ITransaction } from "@maticnetwork/chain-indexer-framework/interfaces/transaction";
import { IBlock } from "@maticnetwork/chain-indexer-framework/interfaces/block";
import { Logger } from "@maticnetwork/chain-indexer-framework/logger";
import { IConsumerConfig } from "@maticnetwork/chain-indexer-framework/interfaces/consumer_config";
import { IProducerConfig } from "@maticnetwork/chain-indexer-framework/interfaces/producer_config";
import { transform } from "@maticnetwork/chain-indexer-framework/data_transformation/transform";
import IMaticTransferTx from "./interfaces/matic_transfer_tx.js";
import { MaticTransferMapper } from "./mappers/matic_transfer_mapper.js";

/**
 * startTransforming function which starts consuming events from the consumer and then transforming it
 * and then finally producing the trasnformed data to new kafka topic
 * 
 * @function startTransforming
 * 
 * @param {IConsumerConfig} consumerConfig - consumer config
 * @param {IProducerConfig} producerConfig - producer config
 * @param {MaticTransferMapper} maticTransferMapper - transfer mapper class instance
 * 
 * @returns {Promise<void>}
 */
export default async function startTransforming(
    consumerConfig: IConsumerConfig,
    producerConfig: IProducerConfig,
    maticTransferMapper: MaticTransferMapper
): Promise<void> {
    try {
        transform<IBlock, IMaticTransferTx>({
            consumerConfig,
            producerConfig,
            type: 'asynchronous'
        }, {
            transform: async (block: IBlock): Promise<ITransformedBlock<IMaticTransferTx>> => {
                let transfers: IMaticTransferTx[] = [];

                block.transactions.forEach((transaction: ITransaction) => {
                    transfers = transfers.concat(maticTransferMapper.map(transaction));
                });

                return {
                    blockNumber: block.number,
                    timestamp: block.timestamp,
                    data: transfers
                };
            },
            error(err: Error) {
                console.error('something wrong occurred: ' + err);
            },
        })
    } catch (error) {
        Logger.error(`Transformer instance is exiting due to error: ${error}`);
        process.exit(1);

    }
}
