import { BlockPollerProducer } from "./block_polling_producer.js";
import { QuickNodeBlockProducer } from "./quicknode_block_producer.js";
import { ErigonBlockProducer } from "./erigon_block_producer.js";
import { BlockProducer } from "@internal/block_producers/block_producer.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";

function getProducer(
    config: IBlockProducerConfig
): BlockProducer {
    const type = config.type;
    delete config.type;

    if (type === "quicknode") {
        return new QuickNodeBlockProducer(config);
    }

    if (type === "erigon") {
        return new ErigonBlockProducer(config);
    }

    return new BlockPollerProducer(config);
}

export function produceBlocks(
    config: IBlockProducerConfig
): BlockProducer {
    const producer = getProducer(config);
    producer.start();
    return producer
}
