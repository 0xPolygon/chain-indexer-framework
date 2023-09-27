import { IProducedBlock, ProducedBlocksModel, IProducedBlocksModel } from "@internal/block_producers/produced_blocks_model.js";
import { BlockProducer as InternalBlockProducer } from "@internal/block_producers/block_producer.js";
import { BlockSubscription } from "@internal/block_subscription/block_subscription.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { BlockGetter } from "@internal/block_getters/block_getter.js";
import { Coder } from "@internal/coder/protobuf_coder.js";
import { Database } from "@internal/mongo/database.js";

/**
 * Common lock producer class which contains the common logic to retrieve 
 * raw block data from the configurable "startblock" number, and produce it to 
 * a kafka cluster while detecting re orgs and handling them. 
 * The block data source, and kafka modules is provided the user of this class. 
 * 
 * @author - Nitin Mittal
 */
export class BlockProducer extends InternalBlockProducer {

    /**
     * @constructor
     * 
     * @param {IBlockProducerConfig} config
     * 
     * @returns {BlockProducer}
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
                "block_getter",
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
