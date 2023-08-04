import { DeliveryReport, LibrdKafkaError } from "node-rdkafka";
import { KafkaProducerEvents, EventListener } from "./common_kafka_events.js";

export interface ISynchronousProducer {
    produceEvent(
        topic: string,
        key: string,
        message: object,
        protobufMessageType: string,
        partition?: number,
        timestamp?: number, 
    ): Promise<DeliveryReport | LibrdKafkaError | Error>

    once<E extends KafkaProducerEvents>(event: E, listener: EventListener<E>): this;
    on<E extends KafkaProducerEvents>(event: E, listener: EventListener<E>): this;
}
