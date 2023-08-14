import { BlockPollerProducer } from "./block_polling_producer.js";
import { QuickNodeBlockProducer } from "./quicknode_block_producer.js";
import { ErigonBlockProducer } from "./erigon_block_producer.js";
import { BlockProducer } from "@internal/block_producers/block_producer.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";

export function produceBlocks(
    config: IBlockProducerConfig
): BlockProducer {
    const type = config.type;
    delete config.type;

    let producer: BlockProducer;

    switch (type) {
        case "quicknode": {
            producer = new QuickNodeBlockProducer(config);
            break;
        }

        case "erigon": {
            producer = new ErigonBlockProducer(config);
            break;
        }

        case "polling": {
            producer = new BlockPollerProducer(config);
            break;
        }

        default: {
            throw new Error("Invalid type");
        }
    }

    producer.start();
    return producer;
}
