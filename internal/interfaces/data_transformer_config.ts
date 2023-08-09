import { IConsumerConfig } from "./consumer_config.js";
import { IProducerConfig } from "./producer_config.js";

export interface IDataTransformerConfig {
    consumerConfig: IConsumerConfig,
    producerConfig: IProducerConfig,
    type: string,
}