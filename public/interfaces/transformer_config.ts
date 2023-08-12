import { IConsumerConfig } from "@internal/interfaces/consumer_config.js";
import { IProducerConfig } from "@internal/interfaces/producer_config.js";

export interface ITransformerConfig {
    consumerConfig: IConsumerConfig,
    producerConfig: IProducerConfig
    type: string,
} 
