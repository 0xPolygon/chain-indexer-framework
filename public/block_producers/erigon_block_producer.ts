import { IProducedBlock, ProducedBlocksModel, IProducedBlocksModel } from "@internal/block_producers/produced_blocks_model.js";
import { BlockSubscription } from "@internal/block_subscription/block_subscription.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { BlockGetter } from "@internal/block_getters/block_getter.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { Database } from "@internal/mongo/database.js";
import Eth from "web3-eth";
import { BlockProducer } from "@internal/block_producers/block_producer.js";

/**
 * Erigon block producer class which retrieves block from erigon node
 * for producing to kafka.
 *  
 * @author - Vibhu Rajeev
 */
export class ErigonBlockProducer extends BlockProducer {
    /**
     * @constructor
     * 
     * @param {IBlockProducerConfig} config
     * 
     * @returns {ErigonBlockProducer}
     */
    constructor(config: IBlockProducerConfig) {
        const endpoints = config.rpcWsEndpoints || [];
        const startBlock = config.startBlock || 0;
        const mongoUrl = config.mongoUrl || "mongodb://localhost:27017/chain-indexer";
        const maxReOrgDepth = config.maxReOrgDepth || 0;
        const maxRetries = config.maxRetries || 0;
        const blockSubscriptionTimeout = config.blockSubscriptionTimeout;

        // Has to be done or Kafka complains later
        delete config.rpcWsEndpoints;
        delete config.startBlock;
        delete config.mongoUrl;
        delete config.maxReOrgDepth;
        delete config.maxRetries;
        delete config.blockSubscriptionTimeout;

        const database = new Database(mongoUrl);

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

        super(
            new Coder("block", "blockpackage", "Block"),
            config as IProducerConfig,
            new BlockSubscription(
                //@ts-ignore
                eth,
                endpoints,
                maxRetries,
                "erigon_block_getter",
                blockSubscriptionTimeout
            ),
            new BlockGetter(eth, maxRetries),
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
