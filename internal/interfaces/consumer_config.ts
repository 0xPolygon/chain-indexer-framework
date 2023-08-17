import { ConsumerGlobalConfig, ConsumerTopicConfig } from "node-rdkafka";
import { ICoderConfig } from "./coder_config.js";
import { IKafkaCoderConfig } from "./kafka_coder_config.js";

export interface IConsumerConfig extends ConsumerGlobalConfig {
    maxBufferLength?: number,
    maxRetries?: number,
    connectionTimeout?: number, 
    topicConfig?: ConsumerTopicConfig, 
    startOffsets?: {
        [topic: string]: number
    },
    topic?: string | string[],
    coders?: ICoderConfig | ICoderConfig[] | IKafkaCoderConfig,
    type?: string,
} 
