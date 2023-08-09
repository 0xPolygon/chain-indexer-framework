import { ITransformedBlock } from "@maticnetwork/chainflow/interfaces/transformed_block";
import { ITransaction } from "@maticnetwork/chainflow/interfaces/transaction";
import { IBlock } from "@maticnetwork/chainflow/interfaces/block";
import { IConsumerConfig } from "@maticnetwork/chainflow/interfaces/consumer_config";
import { IProducerConfig } from "@maticnetwork/chainflow/interfaces/producer_config";
import { SynchronousDataTransformer } from "@maticnetwork/chainflow";
import IMaticTransferTx from "./interfaces/matic_transfer_tx.js";
import { MaticTransferMapper } from "./mappers/matic_transfer_mapper.js";


/**
 * Matic transfer Data transformer extends the SynchronousDataTransformer to transform 
 * a consumed raw block to produce the block with relevant matic transfer events. 
 * 
 * @author - Nitin Mittal, Polygon Technology
 */
export class MaticTransferDataTransformer extends SynchronousDataTransformer<IBlock, IMaticTransferTx> {
    /**
     * @param {IConsumerConfig} consumerConfig
     * @param {IProducerConfig} producerConfig
     * @param  {MaticTransferMapper} maticTransferMapper
     * 
     * @constructor
     */
    constructor(
        consumerConfig: IConsumerConfig,
        producerConfig: IProducerConfig,
        private maticTransferMapper: MaticTransferMapper,
    ) {
        super(consumerConfig, producerConfig);
    }

    /**
     * @async
     * 
     * This method is main entry point to the class. It transforms a given block to block 
     * with matic transfer events. 
     * 
     * @param {IBlock} block - The raw block object with transaction receipts. 
     * 
     * @returns {ITransformedBlock<IMaticTransferTx>} - Transformed block with matic transfer events.
     */
    protected async transform(block: IBlock): Promise<ITransformedBlock<IMaticTransferTx>> {
        return {
            blockNumber: block.number,
            timestamp: block.timestamp,
            data: this.map(block)
        };
    }

    /**
     * @private
     * 
     * Private method which maps a given block to relevant mappers and returns array of matic transfer events.
     * 
     * @param {IBlock} block - Raw block object with transaction objects and receipts.
     * 
     * @returns {IMaticTransferTx[]} - Array of transfer events.
     */
    private map(block: IBlock): IMaticTransferTx[] {
        let transfers: IMaticTransferTx[] = [];

        block.transactions.forEach((transaction: ITransaction) => {
            transfers = transfers.concat(this.maticTransferMapper.map(transaction));
        });

        return transfers;
    }
}
