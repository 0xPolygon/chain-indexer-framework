import { BlockProducer } from "@internal/block_producers/block_producer.js";
import { IProducedBlock, ProducedBlocksModel, IProducedBlocksModel } from "@internal/block_producers/produced_blocks_model.js";
import { BlockSubscription } from "@internal/block_subscription/block_subscription.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { QuickNodeBlockGetter } from "@internal/block_getters/quicknode_block_getter.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { Database } from "@internal/mongo/database.js";
import Eth from "web3-eth";

/**
 * Quicknode block producer class which retrieves block from quick node
 * for producing to kafka.
 *  
 */
export class QuickNodeBlockProducer extends BlockProducer {

    /**
     * @constructor
     * 
     * @param {IBlockProducerConfig} config
     * 
     * @returns {QuickNodeBlockProducer}
     */
    constructor(config: IBlockProducerConfig) {

        const endpoints = config.rpcWsEndpoints || [];
        const startBlock = config.startBlock || 0;
        const mongoUrl = config.mongoUrl || "mongodb://localhost:27017/chain-indexer";
        const maxReOrgDepth = config.maxReOrgDepth || 0;
        const maxRetries = config.maxRetries || 0;
        const blockSubscriptionTimeout = config.blockSubscriptionTimeout;
        const blockDelay = config.blockDelay || 0;
        const alternateEndpoint = config.alternateEndpoint;
        const rpcTimeout = config.rpcTimeout;

        // Has to be done or Kafka complains later
        delete config.rpcWsEndpoints;
        delete config.startBlock;
        delete config.mongoUrl;
        delete config.maxReOrgDepth;
        delete config.maxRetries;
        delete config.blockDelay;
        delete config.blockSubscriptionTimeout;
        delete config.blockDelay;
        delete config.alternateEndpoint;
        delete config.rpcTimeout;


        //@ts-ignore
        const eth = new Eth(
            //@ts-ignore
            new Eth.providers.WebsocketProvider(
                endpoints[0],
                {
                    reconnect: {
                        auto: true
                    },
                    clientConfig: {
                        maxReceivedFrameSize: 1000000000,
                        maxReceivedMessageSize: 1000000000,
                    }
                }
            )
        );

        const database = new Database(mongoUrl);

        super(
            new Coder("block", "blockpackage", "Block"),
            config as IProducerConfig,
            new BlockSubscription(
                //@ts-ignore
                eth,
                endpoints,
                maxRetries,
                "quicknode_block_getter",
                blockSubscriptionTimeout,
                blockDelay,
                alternateEndpoint,
                rpcTimeout
            ),
            new QuickNodeBlockGetter(eth, maxRetries),
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
