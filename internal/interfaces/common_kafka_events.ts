import { ClientMetrics, LibrdKafkaError, DeliveryReport, ReadyInfo, Metadata, Message, EofEvent, TopicPartition, SubscribeTopicList, TopicPartitionOffset } from "node-rdkafka";
//
type KafkaClientEvents = "disconnected" | "ready" | "connection.failure" | "event.error" | "event.stats" | "event.log" | "event.event" | "event.throttle";

type EventListenerMap = {
    // ### Client
    // connectivity events
    "disconnected": (metrics: ClientMetrics) => void,
    "ready": (info: ReadyInfo, metadata: Metadata) => void,
    "connection.failure": (error: LibrdKafkaError, metrics: ClientMetrics) => void,
    // event messages
    "event.error": (error: LibrdKafkaError) => void,
    "event.stats": (eventData: any) => void,
    "event.log": (eventData: any) => void,
    "event.event": (eventData: any) => void,
    "event.throttle": (eventData: any) => void,
    // ### Consumer only
    // domain events
    "data": (arg: Message) => void,
    "partition.eof": (arg: EofEvent) => void,
    "rebalance": (err: LibrdKafkaError, assignments: TopicPartition[]) => void,
    "rebalance.error": (err: Error) => void,
    // connectivity events
    "subscribed": (topics: SubscribeTopicList) => void,
    "unsubscribe": () => void,
    "unsubscribed": () => void,
    // offsets
    "offset.commit": (error: LibrdKafkaError, topicPartitions: TopicPartitionOffset[]) => void,
    // ### Producer only
    // delivery
    "delivery-report": (error: LibrdKafkaError, report: DeliveryReport) => void,
}

export type KafkaConsumerEvents = "data" | "partition.eof" | "rebalance" | "rebalance.error" | "subscribed" | "unsubscribed" | "unsubscribe" | "offset.commit" | KafkaClientEvents;
export type KafkaProducerEvents = "delivery-report" | KafkaClientEvents;
export type EventListener<K extends string> = K extends keyof EventListenerMap ? EventListenerMap[K] : never;
