import { ProducerGlobalConfig } from "node-rdkafka";
import { ICoder } from "../interfaces/coder.js";
import { ICoderConfig } from "./coder_config.js";

export interface IProducerConfig extends ProducerGlobalConfig {
    topic: string;
    pollInterval?: number,
    connectionTimeout?: number,
    flushTimeout?: number,
    deliveryTimeout?: number,
    type?: string,
    coder?: ICoder | ICoderConfig
}
