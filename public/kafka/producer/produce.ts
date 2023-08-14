import { SynchronousProducer } from "./synchronous_producer.js";
import { AsynchronousProducer } from "./asynchronous_producer.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { IBlockProducerConfig } from "@internal/interfaces/block_producer_config.js";
import { KafkaError } from "@internal/errors/kafka_error.js";
import { IEventProducer } from "../../interfaces/event_producer.js";
import { BlockPollerProducer } from "../../block_producers/block_polling_producer.js";
import { QuickNodeBlockProducer } from "../../block_producers/quicknode_block_producer.js";
import { ErigonBlockProducer } from "../../block_producers/erigon_block_producer.js";
import { BlockProducer } from "../../block_producers/block_producer.js";

/**
 * Function to be used as functional implementation for the producer classes for asynchronous
 * and synchronous producer and block producers. this function will create coder class if protobuf coder is required.
 * type and coder can be passed if coder other that protobuf coder is needed.
 * 
 * @param {IProducerConfig} config - producer config
 * @param {IEventProducer<KafkaError>} eventProducer - event producer function object for emitter, error and close
 *  
 * @returns {AsynchronousProducer | SynchronousProducer | BlockProducer}
 */
export function produce<T>(
    config: IProducerConfig | IBlockProducerConfig,
    eventProducer?: IEventProducer<KafkaError>
): T {
    const type = config.type;
    delete config.type;

    let producer: AsynchronousProducer | SynchronousProducer | BlockProducer;

    switch (type) {
        case "asynchronous": {
            producer = new AsynchronousProducer(config);
            break;
        }

        case "synchronous": {
            producer = new SynchronousProducer(config);
            break;
        }

        case "blocks:quicknode": {
            producer = new QuickNodeBlockProducer(config);
            break;
        }

        case "blocks:erigon": {
            producer = new ErigonBlockProducer(config);
            break;
        }

        case "blocks:polling": {
            producer = new BlockPollerProducer(config);
            break;
        }

        case "blocks": {
            producer = new BlockProducer(config);
            break;
        }

        default: {
            throw new Error("Invalid type");
        }
    }

    producer.start();

    if (eventProducer) {
        eventProducer.emitter.bind(producer);
        eventProducer.error.bind(producer);
        eventProducer.closed.bind(producer);

        producer.on("producer.error", eventProducer.error);
        (producer as BlockProducer).on("blockProducer.fatalError", eventProducer.error);
        producer.on("producer.disconnected", eventProducer.closed);

        eventProducer.emitter();
    }

    return producer as unknown as T;

}
