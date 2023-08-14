import { SynchronousProducer } from "./synchronous_producer.js";
import { AsynchronousProducer } from "./asynchronous_producer.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";
import { KafkaError } from "@internal/errors/kafka_error.js";
import { IEventProducer } from "../../interfaces/event_producer.js";

/**
 * Function to be used as functional implementation for the producer classes for asynchronous
 * and synchronous producer. this function will create coder class if protobuf coder is required.
 * type and coder can be passed if coder other that protobuf coder is needed.
 * 
 * @param {IProducerConfig} config - producer config
 * @param {IEventProducer<KafkaError>} eventProducer - event producer function object for subscribe, error and close
 *  
 * @returns {AsynchronousProducer | SynchronousProducer}
 */
export function produce(
    config: IProducerConfig,
    eventProducer: IEventProducer<KafkaError>
): AsynchronousProducer | SynchronousProducer {
    const type = config.type;
    delete config.type;

    let producer: AsynchronousProducer | SynchronousProducer;

    switch (type) {
        case "asynchronous": {
            producer = new AsynchronousProducer(config);
            break;
        }

        case "synchronous": {
            producer = new SynchronousProducer(config);
            break;
        }

        default: {
            throw new Error("Invalid type");
        }
    }

    producer.start();

    eventProducer.subscribe.bind(producer);
    eventProducer.error.bind(producer);
    eventProducer.closed.bind(producer);

    producer.on("producer.error", eventProducer.error);
    producer.on("producer.disconnected", eventProducer.closed);

    eventProducer.subscribe();

    return producer;

}
