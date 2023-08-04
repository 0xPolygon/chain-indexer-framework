import noderdkafka, { LibrdKafkaError, Metadata } from "node-rdkafka";
import { KafkaProducerEvents, EventListener } from "../../interfaces/common_kafka_events.js";
import { IProducerConfig } from "../../interfaces/producer_config.js";
import { ICoder } from "../../interfaces/coder.js";
import { KafkaError } from "../../errors/kafka_error.js";


/**
 * Producer class wraps the Producer class of Node-RdKafka and provides simple straightforward methods to start producing events to Kafka.
 * Connection is handled by the class internally and an option to create the connection manually is also provided. 
 * Connecting manually allows to get the metadata details and also avoid latency involved in creating a connection on production of first event. 
 * Each public method follows a promised based error handling pattern to report thrown during the execution of the method. 
 * To capture all exceptions that may occur internally in the library or the kafka producer client, error event ('producer.error') is emitted which can be subscribed to. 
 * @extends noderdkafka.Producer
 */
export abstract class AbstractProducer extends noderdkafka.Producer {
    private topic: string;
    private producerConnected: boolean = false;
    private producerConnecting: boolean = false;
    private producerConnectPromise?: Promise<Metadata | LibrdKafkaError>;
    private pollInterval: number;
    private connectionTimeout: number;
    private flushTimeout: number;
    private stopProducerPromise?: Promise<boolean>;
    private static readonly DISCONNECTED: string = "producer.disconnected";
    private static readonly ERROR: string = "producer.error";

    /**
     * @param {Coder} serialiser - The Serialiser object to serialise messages before production.
     * @param {IProducerConfig}  config - Key value pairs to override the default config of the producer client. 
     */
    constructor(
        private serialiser: ICoder,
        config: IProducerConfig
    ) {
        // This has to be done cause otherwise Kafka complains
        const pollInterval = config.pollInterval || 1000;
        const connectionTimeout = config.connectionTimeout || 10000;
        const flushTimeout = config.flushTimeout || 10000;
        const topic = config.topic;

        delete config.pollInterval;
        delete config.connectionTimeout;
        delete config.flushTimeout;
        delete (config as any).topic;

        super(
            Object.assign(
                {
                    "bootstrap.servers": "localhost:9092",
                    "dr_cb": true,
                    "enable.idempotence": true,
                    "acks": -1
                },
                config
            )
        );

         this.pollInterval = pollInterval;
         this.connectionTimeout = connectionTimeout;
         this.flushTimeout = flushTimeout;
         this.topic = topic;
    }

    once(event: "producer.error", listener: (error: KafkaError) => void): this;
    once(event: "producer.disconnected", listener: () => void): this;
    once<E extends KafkaProducerEvents>(event: E, listener: EventListener<E>): this;
    once<Event extends string>(event: Event, listener: EventListener<Event>): this {
        //@ts-ignore
        return super.once(event, listener);
    }

    on(event: "producer.error", listener: (error: KafkaError) => void): this;
    on(event: "producer.disconnected", listener: () => void): this;
    on<E extends KafkaProducerEvents>(event: E, listener: EventListener<E>): this;
    on<Event extends string>(event: Event, listener: EventListener<Event>): this {
        //@ts-ignore
        return super.on(event, listener);
    }

    /**
     * Private internal method to connect to the broker and subscribe to the librdkafka events. 
     * 
     * @returns {Promise<Metadata|LibrdKafkaError>} A promise which resolves to give the metadata of connected broker or rejects with the error that caused connection failure. 
     */
    private connectToBroker(): Promise<Metadata> {
        return new Promise<Metadata>((resolve, reject) => {
            this.on("event.error",
                (error: LibrdKafkaError) => {
                     this.onKafkaError(
                        KafkaError.convertLibError(error, true)
                    );
                }
            )
                .on("disconnected",  this.onDisconnected.bind(this));

             this.producerConnecting = true;
            // The method can be expanded in future to allow requesting metadata of specific topics along with broker details. 
            this.connect({ timeout:  this.connectionTimeout }, (error: LibrdKafkaError, metadata: Metadata) => {
                 this.producerConnecting = false;
                if (error) {
                    reject(error);

                    return;
                }

                this.setPollInterval( this.pollInterval);
                 this.producerConnected = true;
                resolve(metadata);
            });
        });
    }

    /**
     * Private internal method to handle connection internally when disconnected from broker 
     * and if no re connection is achieved emit disconnected event. 
     * 
     * @returns {void}
     */
    private onDisconnected(): void {
        //Can further implement reconnecting logic failing which, disconnected event will be emitted. 
         this.producerConnected = false;
        this.emit(AbstractProducer.DISCONNECTED);
        this.removeAllListeners("event.error");
        this.removeAllListeners("disconnected");
    }

    /**
     * Internal private method to emit error event when librdkafka reports an error. 
     * 
     * @param {LibrdKafkaError} error - Error object to be emitted. 
     * 
     * @returns {void}
     */
    private onKafkaError(error: KafkaError): void {
        this.emit(AbstractProducer.ERROR, error);

        return;
    }

    /**
     * @async
     * Method to connect the producer to broker and update the connection status in the class. 
     * This method is called internally when produceEvent() method is called if producer is not connected. 
     * In cases where it may be beneficial to connect the producer in advance, it may be called by an external caller. 
     * If there is an already existing promise to connect to broker, the method will wait for the original promise to resolve.
     * 
     * @returns {Promise<Metadata|LibrdKafkaError>} - The object containing the metadata of broker that the producer is connected to 
     * and the topics available in that broker or the error thrown during connection.
     */
    public async start(): Promise<Metadata | KafkaError> {
        try {
            if (! this.producerConnecting && ! this.producerConnected) {
                 this.producerConnectPromise =  this.connectToBroker();
            }
            const brokerMetadata: Metadata = await  this.producerConnectPromise as Metadata;
            return brokerMetadata;
        } catch (error) {
             this.producerConnecting = false;
            throw KafkaError.createUnknown(error, true);
        }
    }

    /**
     * @async 
     * This method serialises and sends the message to the internal producer client. It resolves on successful adding of 
     * event to internal producer buffer which means it does not guarantee delivery of message to kafka cluster. 
     * The method throws an error on failure which is usually when the queue is full. It is recommended to listen 
     * "delivered" event for confirmation and set "acks" setting to -1 which is the default setting. 
     * 
     * @param {string} key - The key associated with the message. 
     * @param {object} message - The message object to produce to kafka
     * @param {string} topic - The topic name to produce the event to. 
     * @param {number} partition - To manually set the partition number of the topic to which the event needs to be produced to. 
     * @param {number} timestamp - To manually set the timestamp (Unix in ms) of the message.
     * @param {object} opaque - Per-message opaque pointer that will be provided in the delivery report callback (dr_cb) for referencing this message.
     * 
     * @returns {Promise<LibrdKafkaError|boolean|Error>} - Throws an error if it failed, or resolves to "true" if not
     * 
     * @throws {LibrdKafkaError|Error} - Throws the exception behind the failure. 
     */
    public async sendToInternalProducer(
        key: string,
        message: object,
        topic: string =  this.topic,
        partition?: number,
        timestamp?: number,
        opaque?: object
    ): Promise<KafkaError | boolean> {
        try {
            if (! this.producerConnected) {
                await this.start();
            }
            // TODO: Runtime check for all parameters
            const produced = await this.produce(
                topic,
                partition,
                await this.serialiser.serialize(message) as Buffer,
                key,
                timestamp,
                opaque
            );

            if (produced === true) {
                return produced;
            }

            throw produced;
        } catch (error) {
             this.onKafkaError(KafkaError.createUnknown(error, true));

            throw KafkaError.createUnknown(error, true);
        }
    }

    /**
     * This methods clears the internal client buffer by sending all the messages and on success disconnects the producer client from clust
     * 
     * @returns {true} - Returns true on successful disconnection. The producer still disconnects on failure to flush before timeout.
     * 
     * @throws {LibrdKafkaError} - Throws any error faced during flushing or disconnecting.
     */
    public async stop(): Promise<boolean> {
        try {
            if (!this.stopProducerPromise) {
                this.stopProducerPromise = new Promise((resolve, reject) => {
                    this.disconnect( this.flushTimeout, (error: LibrdKafkaError) => {
                        if (error) {
                            return reject(KafkaError.convertLibError(error));
                        }

                        return resolve(true);
                    });
                });
            }

            await this.stopProducerPromise;

            this.stopProducerPromise = undefined;

            return true;
        } catch (error) {
            this.stopProducerPromise = undefined;

            throw error;
        }
    }

    /** 
     * @param {string} topic - The topic name to produce the event to. 
     * @param {string} key - The key associated with the message. 
     * @param {object} message - The message object to produce to kafka
     * @param {number} partition - To manually set the partition number of the topic to which the event needs to be produced to. 
     * @param {number} timestamp - To manually set the timestamp (Unix in ms) of the message.
     * @param {object} opaque - Per-message opaque pointer that will be provided in the delivery report callback (dr_cb) for referencing this message.
     * 
     * @returns {Promise<LibrdKafkaError|boolean|Error>} - Returns an error if it failed, or true if not
     */
    public abstract produceEvent(
        key: string,
        message: object,
        topic?: string,
        partition?: number,
        timestamp?: number,
        opaque?: object
    ): Promise<any>
}
