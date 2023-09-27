import { IProducedBlock, ProducedBlocksModel, IProducedBlocksModel } from "@internal/block_producers/produced_blocks_model.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { BlockGetter } from "@internal/block_getters/block_getter.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { BlockPoller } from "@internal/block_subscription/block_polling.js";
import { Database } from "@internal/mongo/database.js";
import { BlockProducer } from "@internal/block_producers/block_producer.js";
import Eth from "web3-eth";

/**
 * Block Poller producer class which retrieves block from polling every block
 * for producing to kafka.
 *  
 */
export class BlockPollerProducer extends BlockProducer {
    /**
     * @constructor
     * 
     * @param {IBlockProducerConfig} config
     * 
     * @returns {BlockPollerProducer}
     */
    constructor(config: IBlockProducerConfig) {
        const endpoint = config.rpcWsEndpoints?.[0] || "";
        const startBlock = config.startBlock || 0;
        const mongoUrl = config.mongoUrl || "mongodb://localhost:27017/chain-indexer";
        const blockPollingTimeout = config.blockPollingTimeout || 2000;
        const maxRetries = config.maxRetries || 0;
        const maxReOrgDepth = config.maxReOrgDepth || 0;

        delete config.rpcWsEndpoints;
        delete config.startBlock;
        delete config.mongoUrl;
        delete config.maxReOrgDepth;
        delete config.maxRetries;
        delete config.blockPollingTimeout;

        const database = new Database(mongoUrl);

        const blockGetter = new BlockGetter(
            //@ts-ignore
            new Eth(endpoint),
            maxRetries
        );

        super(
            new Coder(
                "block",
                "blockpackage",
                "Block"
            ),
            config as IProducerConfig,
            new BlockPoller(
                blockGetter,
                blockPollingTimeout
            ),
            blockGetter,
            database,
            database.model<IProducedBlock, IProducedBlocksModel<IProducedBlock>>(
                "ProducedBlocks",
                ProducedBlocksModel,
                "producedblocks"
            ),
            startBlock,
            maxReOrgDepth
        );
    }
}
