import { IProducedBlock, ProducedBlocksModel, IProducedBlocksModel } from "@internal/block_producers/produced_blocks_model.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { HttpBlockGetter } from "@internal/block_getters/http_block_getter.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { BlockPoller } from "@internal/block_subscription/block_polling.js";
import { Database } from "@internal/mongo/database.js";
import { BlockProducer } from "@internal/block_producers/block_producer.js";
import Eth from "web3-eth";

/**
 * HttpBlockProducer block producer class which retrieves block from http node
 * for producing to kafka.
 * 
 * @author - Rajesh Chaganti
 */
export class HttpBlockProducer extends BlockProducer {
    /**
     * @constructor
     * 
     * @param {IBlockProducerConfig} config
     * 
     * @returns {HttpBlockProducer}
     */
    constructor(config: IBlockProducerConfig) {
        const endpoint = config.rpcWsEndpoints?.[0] ?? "";
        const startBlock = config.startBlock ?? 0;
        const dbCollection = config.dbCollection ?? "producedblocks";
        const mongoUrl = config.mongoUrl ?? "mongodb://localhost:27017/open-api";
        const blockPollingTimeout = config.blockPollingTimeout ?? 2000;
        const maxRetries = config.maxRetries ?? 0;
        const maxReOrgDepth = config.maxReOrgDepth ?? 0;

        delete config.rpcWsEndpoints;
        delete config.startBlock;
        delete config.mongoUrl;
        delete config.dbCollection;
        delete config.maxReOrgDepth;
        delete config.maxRetries;
        delete config.blockPollingTimeout;

        const database = new Database(mongoUrl);

        const blockGetter = new HttpBlockGetter(
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
                dbCollection
            ),
            startBlock,
            maxReOrgDepth
        );
    }
}
