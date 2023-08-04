import { LibrdKafkaError, DeliveryReport } from "node-rdkafka";
import { ICoder } from "../../interfaces/coder.js";
import { AbstractProducer, } from "./abstract_producer.js";
import { IProducerConfig } from "../../interfaces/producer_config.js";
import { KafkaProducerEvents, EventListener } from "../../interfaces/common_kafka_events.js";
import { KafkaError } from "../../errors/kafka_error.js";

/**
 * This class is to be used for sending events to kafka producer internal buffer. 
 * The class extends the Abstract producer class to emit delivered events which can be subscribed to for guarantee of delivery and 
 * appropriate error handling.  
 * @extends AbstractProducer
 */
export class AsynchronousProducer extends AbstractProducer {
    private static readonly DELIVERED: string = "delivered";

    /**
     * @param {Coder} serialiser - The Serialiser object to serialise messages before production.
     * @param {IProducerConfig}  config - Key value pairs to override the default config of the producer client. 
     * Config related to broker connection can also be added. The possible values are: 
     * 1. [pollInterval=1000]  - Interval in milliseconds at which client polls the broker for delivery reports. 
     * 2. [connectionTimeout=5000] - Timeout in milliseconds for successful connection to kafka cluster and retrieving of metadata. 
     * 3. [flushTimeout=10000] - Timeout in milliseconds before which the buffer of internal producer client should be cleared when the disconnect method is called. 
     */
    constructor(
        serialiser: ICoder,
        config: IProducerConfig
    ) {
        super(serialiser, config);
    }

    /**
     * Private internal method which emits delivered event on successful delivery or emits error event on exceptions. 
     * 
     * @param {LibrdKafkaError} error -  Error object returned by librdkafka in case of failure to retrieve reports. 
     * @param {DeliveryReport} report - Delivery Report object returned by kafka with details of the delivered record/event after successful delivery to cluster.
     * 
     * @returns {void}
     */
    private onDeliveryReport(error: LibrdKafkaError, report: DeliveryReport): void {
        if (report) {
            this.emit(AsynchronousProducer.DELIVERED, report);

            return;
        }
    }

    //TODO - to rewrite the overloads and reduce the redundancy 
    once(event: "producer.error", listener: (error: KafkaError) => void): this;
    once(event: "producer.disconnected", listener: () => void): this;
    once(event: "delivered", listener: (report: DeliveryReport) => void): this
    once<E extends KafkaProducerEvents>(event: E, listener: EventListener<E>): this;
    once<Event extends string>(event: Event, listener: EventListener<Event>): this {
        //@ts-ignore
        return super.once(event, listener);
    }

    //TODO - to rewrite the overloads and reduce the redundancy 
    on(event: "producer.error", listener: (error: KafkaError) => void): this;
    on(event: "producer.disconnected", listener: () => void): this;
    on(event: "delivered", listener: (report: DeliveryReport) => void): this
    on<E extends KafkaProducerEvents, T>(event: E, listener: EventListener<E>): this;
    on<Event extends string, T>(event: Event, listener: EventListener<Event>): this {
        //@ts-ignore
        return super.on(event, listener);
    }

    /**
     * This is method produces an event to kafka in asynchrononous mode. It does not wait for success delivery report and resolves on successful adding of 
     * event to internal producer buffer. The method throws an error on failure which is usually when the queue is full. The successful resolving of this 
     * method does not guarantee delivery of message to kafka cluster. It is recommended to listen "delivered" event for confirmation and set "acks" setting
     * to -1 which is the default setting. 
     * 
     * @param {string} key - The key associated with the message. 
     * @param {object} message - The message object to produce to kafka
     * @param {string} topic - The topic name to produce the event to. 
     * @param {number} partition - To manually set the partition number of the topic to which the event needs to be produced to. 
     * @param {number} timestamp - To manually set the timestamp (Unix in ms) of the message.
     * @param {object} opaque - Per-message opaque pointer that will be provided in the delivery report callback (dr_cb) for referencing this message.
     * 
     * @returns {Promise<KafkaError|boolean>} - Returns an error if it failed, or true if not
     */
    public produceEvent(
        key: string,
        message: object,
        topic?: string,
        partition?: number,
        timestamp?: number,
        opaque?: object
    ): Promise<KafkaError | boolean> {
        if (!this.listenerCount("delivery-report")) {
            this.on("delivery-report", this.onDeliveryReport.bind(this));
        }
        return this.sendToInternalProducer(key, message, topic, partition, timestamp, opaque);
    }
}
