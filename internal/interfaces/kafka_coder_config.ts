import { ICoder } from "./coder.js";

export interface IKafkaCoderConfig {
  [topic: string]: ICoder
}
