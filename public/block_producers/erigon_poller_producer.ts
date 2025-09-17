import { IProducedBlock, ProducedBlocksModel, IProducedBlocksModel } from "@internal/block_producers/produced_blocks_model.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { BlockGetter } from "@internal/block_getters/block_getter.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { Database } from "@internal/mongo/database.js";
import EthClass from "web3-eth";
import { BlockProducer } from "@internal/block_producers/block_producer.js";
import { ErigonBlockPoller } from "@internal/block_subscription/erigon_block_polling.js";

/**
 * Erigon block producer class which retrieves block from http erigon node
 * for producing to kafka.
 *  
 * @author - Nitin Mittal
 */
export class ErigonPollerProducer extends BlockProducer {
    /**
     * @constructor
     * 
     * @param {IBlockProducerConfig} config
     * 
     * @returns {ErigonPollerProducer}
     */
    constructor(config: IBlockProducerConfig) {
        const rpcApiKey = config.rpcApiKey;
        const endpoints = config.rpcWsEndpoints ?? [];
        const startBlock = config.startBlock ?? 0;
        const mongoUrl = config.mongoUrl ?? "mongodb://localhost:27017/chain-indexer";
        const dbCollection = config.dbCollection ?? "producedblocks";
        const blockPollingTimeout = config.blockPollingTimeout ?? 2000;
        const maxRetries = config.maxRetries ?? 0;
        const maxReOrgDepth = config.maxReOrgDepth ?? 0;

        // Has to be done or Kafka complains later
        delete config.rpcWsEndpoints;
        delete config.startBlock;
        delete config.mongoUrl;
        delete config.dbCollection;
        delete config.maxReOrgDepth;
        delete config.maxRetries;
        delete config.blockPollingTimeout;
        delete config.rpcApiKey;

        const database = new Database(mongoUrl);

        const blockGetter = new BlockGetter(
            //@ts-ignore
            new EthClass(new EthClass.providers.HttpProvider(endpoints[0], {
                headers: [{
                    name: "X-ERPC-Secret-Token",
                    value: rpcApiKey ?? ""
                }]
            })), maxRetries
        );

        super(
            new Coder(
                "block",
                "blockpackage",
                "Block"
            ),
            config as IProducerConfig,
            new ErigonBlockPoller(
                endpoints,
                rpcApiKey,
                blockGetter,
                blockPollingTimeout,
                maxRetries
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
