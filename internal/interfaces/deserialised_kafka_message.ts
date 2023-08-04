import { Message } from "node-rdkafka";

export interface DeserialisedMessage extends Omit<Message, "value"> {
    value?: object
}
