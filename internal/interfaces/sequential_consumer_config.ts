import { ConsumerGlobalConfig } from "node-rdkafka";

export interface ISequentialConsumerConfig {
    maxBufferLength?: number,
    maxRetries?: number,
} 
