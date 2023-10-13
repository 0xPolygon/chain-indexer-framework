import noderdkafka, { Metadata, LibrdKafkaError, Message, TopicPartition } from "node-rdkafka";
import { DeserialisedMessage } from "../../interfaces/deserialised_kafka_message.js";
import { IConsumerQueueObject } from "../../interfaces/consumer_queue_object.js";
import { IConsumerConfig } from "../../interfaces/consumer_config.js";
import { IKafkaCoderConfig } from "../../interfaces/kafka_coder_config.js";
import { isBaseError } from "../../errors/is_base_error.js";
import { IObserver } from "../../interfaces/observer.js";
import { KafkaError } from "../../errors/kafka_error.js";
import { BaseError } from "../../errors/base_error.js";
import { Logger } from "../../logger/logger.js";
import { Queue } from "../../queue/queue.js";

/**
 * Abstract Consumer class wraps the Producer class of Node-RdKafka and provides simple straightforward methods to start producing events to Kafka.
 * Connection is handled by the class internally and an option to create the connection manually is also provided. Connecting manually allows to get the 
 * metadata details and also avoid latency involved in creating a connection on production of first event. 
 * Each public method follows a promised based error handling pattern to report thrown during the execution of the method. 
 * To capture all exceptions that may occur internally in the library outside the execution of a method, error event is emitted which can be subscribed to. 
 * @extends noderdkafka.KafkaConsumer
 * @author Vibhu Rajeev - Polygon Technology - 2022
 */
export abstract class AbstractConsumer extends noderdkafka.KafkaConsumer {
    private consumerPaused: boolean = false;
    private maxBufferLength: number;
    private connectionTimeout: number;
    private consumerConnected: boolean = false;
    private consumerConnecting: boolean = false;
    private consumerConnectPromise: Promise<Metadata | LibrdKafkaError> | null = null;
    private brokerMetadata: Metadata | null = null;
    private queueIsProcessing: boolean = false;
    private startOffsets: {
        [topic: string]: number
    };
    protected topics: string[];
    protected maxRetries: number;
    protected queue: Queue<IConsumerQueueObject<DeserialisedMessage>>;
    protected observer: IObserver<DeserialisedMessage, BaseError> | null = null;
    private seekCalled: boolean = false;

    /**
     * @param {string|string[]} topic - The default topic that the consumer will subscribe to in case not specified in the method.
     * @param {IKafkaCoderConfig} coders  - Object with coder instances where key is the topic name. 
     * @param {IConsumerConfig} config - Key value pairs to override the default config of the consumer client. 
     * The following additional config can also be set:
     *      1. [maxBufferLength=100]  - The maximum length of the internal buffer exceeding which consumer will be paused. 
     *      2. [maxRetries=10] - Number of times to retry executing the onData promise before giving up.
     *      3. [flushTimeout=10000] - Timeout in milliseconds before which the buffer of internal producer client should be cleared when the disconnect method is called.
     */
    constructor(
        topic: string | string[],
        private coders: IKafkaCoderConfig,
        config: IConsumerConfig = {}
    ) {
        // Has to be done otherwise Kafka will complain (they have runtime checks)
        const maxBufferLength = config.maxBufferLength || 100;
        const maxRetries = config.maxRetries || config.maxRetries === 0 ? config.maxRetries : 10;
        const connectionTimeout = config.connectionTimeout || 10000;
        const topicConfig = config.topicConfig || {};
        const startOffsets = config.startOffsets || {};

        delete config.maxBufferLength;
        delete config.maxRetries;
        delete config.connectionTimeout;
        delete config.topicConfig;
        delete config.startOffsets;

        super(
            Object.assign({
                "debug": "cgrp",
                "bootstrap.servers": "localhost:9092",
                "enable.auto.commit": false,
                "enable.auto.offset.store": false,
                "event_cb": true,
                "message.max.bytes": 26214400,
                "fetch.message.max.bytes": 26214400,
                "queued.max.messages.kbytes": 25000,
                "isolation.level": "read_uncommitted",
            }, config),
            Object.assign(
                {
                    "auto.offset.reset": "earliest",
                },
                topicConfig
            )
        );

        //Below is required to not break current implementations. TODO: Apply changes with a breaking change.
        if (Array.isArray(topic)) {
            this.topics = topic;
        } else {
            this.topics = [topic];
        }

        this.queue = new Queue();
        this.maxBufferLength = maxBufferLength;
        this.maxRetries = maxRetries;
        this.connectionTimeout = connectionTimeout;
        this.startOffsets = startOffsets;
    }

    /**
     * This method must be implemented by the subclasses. This method is called before adding the message to queue. 
     * It must be used to call promises concurrently, before adding to queue.
     * 
     * @param {DeserialisedMessage} message - The Deserialised message to perform any action on.
     * @returns {IConsumerQueueObject} - The method needs to return an object that implements interface IConsumerQueueObject.
     */
    protected abstract enqueue(message: DeserialisedMessage): IConsumerQueueObject<DeserialisedMessage>;

    /**
     * Private internal method to connect to the broker and return broker metadata. 
     * 
     * @returns {Promise<Metadata>} A promise which resolves to give the metadata of connected.
     * 
     * @throws {KafkaError} - On failure to connect, rejects with the kafka error.  
     */
    private connectToBroker(): Promise<Metadata | LibrdKafkaError> {
        return new Promise<Metadata | LibrdKafkaError>((resolve, reject) => {
            // The method can be expanded in future to allow requesting metadata of specific topics along with broker details.
            this.consumerConnecting = true;
            this.connect({ timeout: this.connectionTimeout }, (error: LibrdKafkaError, metadata: Metadata) => {
                this.consumerConnecting = false;
                if (error) {
                    reject(
                        KafkaError.convertLibError(error)
                    );

                    return;
                }

                this.consumerConnected = true;
                this.brokerMetadata = metadata;
                
                Logger.info(this.brokerMetadata);
                resolve(metadata);
            });
        });
    }

    /**
     * The private internal method, that pauses or resumes the consumer based on the current 
     * length of internal buffer.
     * 
     * @param message {DeserialisedMessage} - The latest message added to the queue.
     * 
     * @returns {void}
     */
    private handleBackpressure(message: DeserialisedMessage): void {
        if (!this.consumerPaused && this.maxBufferLength <= this.queue.getLength()) {
            this.pause([message as TopicPartition]);
            this.consumerPaused = true;

            return;
        }

        if (this.consumerPaused && this.queue.getLength() < this.maxBufferLength) {
            this.resume([message as TopicPartition]);
            this.consumerPaused = false;
        }
    }

    /**
     * @async
     * Protected method, which deserialises the kafka message and adds it to the internal queue.
     * It also then calls handlebackPressure() and processQueue() after the message is added to the queue.
     * 
     * @param {Message} message - The kafka message, value of which needs to be deserialised.
     *
     * @throws {KafkaError|CoderError} - Throws CoderError or KafkaError on failure to deserialise or add the message to queue. 
     */
    protected async onData(message: Message): Promise<void> {
        //Skip processing the message if behind start offset.
        if (message.offset < (this.startOffsets[message.topic] || 0)) {
            if (!this.seekCalled) {
                Logger.info(`Seeking offset number: ${this.startOffsets[message.topic]}, for topic: ${message.topic}`);
                await new Promise(
                    (res, rej) => this.seek({
                        topic: message.topic,
                        offset: this.startOffsets[message.topic],
                        partition: message.partition
                    }, this.connectionTimeout, (err) => {
                        if (err) {
                            return rej(err);
                        }

                        res(undefined);
                    })
                );
                this.seekCalled = true;
            }

            return;
        }

        const deserializedMsg = await this.deserialize(message);
        this.queue.enqueue(this.enqueue(deserializedMsg));
        this.handleBackpressure(deserializedMsg);
        this.processQueue();
    }

    /**
     * Internal private method to commitMessage and retry on failure upto maxRetries.
     * 
     * @param {Message} message - Kafka message to be committed to cluster. 
     * 
     * @param {number} errorCount - This param must not be set externally and is used to track errorCount.
     */
    private safeCommitMessage(message: Message, errorCount: number = 0): void {
        try {
            this.commitMessage(message);
        } catch (error) {
            // TODO - skip retry if fatal error 
            if (this.maxRetries <= errorCount) {
                this.onError(KafkaError.createUnknown(error as LibrdKafkaError));

                return;
            }

            return this.safeCommitMessage(message, errorCount + 1);
        }
    }

    /**
     * Private internal method that is used to process a queue of messages, commit its offset after successful processing/
     * On failure after maximum retries of processing a message, the queue is cleared and error function of the observer is called. 
     * 
     * @returns {Promise<void>}
     */
    private async processQueue(): Promise<void> {
        if (!this.observer) {
            throw new KafkaError("Kafka Consumer Error", KafkaError.codes.CONSUMER_OBSERVER_INVALID, true, "Observer is not set", "local");
        }

        if (this.queueIsProcessing) {
            return;
        }

        let errorCount: number = 0;
        this.queueIsProcessing = true;

        while (!this.queue.isEmpty()) {
            try {
                const element: IConsumerQueueObject<DeserialisedMessage> = this.queue.front() as IConsumerQueueObject<DeserialisedMessage>;

                if (element.promise) {
                    await element.promise;
                } else {
                    await this.observer.next(element.message);
                }

                this.safeCommitMessage(element.message as Message);
                this.queue.shift();
                this.handleBackpressure(element.message);
                errorCount = 0;
            } catch (error) {
                errorCount++;
                if (errorCount > this.maxRetries || (isBaseError(error) && (error as BaseError).isFatal)) {
                    this.onError(
                        KafkaError.createUnknown(error)
                    );

                    return;
                }
            }
        }

        this.queueIsProcessing = false;
    }

    /**
     * @async
     * Private internal method to deserialise every message.
     * 
     * @param {Messsage} message - Kafka message of which the value needs to be deserialised  
     * 
     * @returns {Promise<DeserialisedMessage>} - The LibRdKafka message object with deserialised message value. 
     * 
     * @throws {CoderError} - Throws coder error on failure to deserialise.
     */
    private async deserialize(message: Message): Promise<DeserialisedMessage> {
        if (message.value) {
            Object.assign(
                message,
                {
                    value: await this.coders[message.topic].deserialize(message.value)
                }
            );
        }

        return message as DeserialisedMessage;
    }


    /**
     * Internal method which clears the queue and diconnects the kafka consumer on fatal 
     * error, and always informs the observer about any error
     * 
     * @param {BaseError} error - The error object to be acted on.
     * 
     * @returns {void}
     */
    protected onError(error: BaseError): void {
        if (error.isFatal) {
            this.queue.clear();
            this.stop();
        }

        this.observer?.error(error);
    }

    /**
     * Private method which updates the connection status of consumer to disconnected, and removes all listeners.
     * 
     * @returns {void}
     */
    private onDisconnect(): void {
        if (this.consumerConnected || this.brokerMetadata || !this.queue.isEmpty()) {
            this.queue.clear();
            this.brokerMetadata = null;
            this.consumerConnected = false;
            this.observer?.closed();
            this.removeAllListeners();
        }
    }

    /**
     * Private internal method to subscribe a consumer to a single topic and start consuming from previously committed offset.
     * 
     * @returns {Promise<void>} 
     */
    private async createSubscription(): Promise<void> {
        try {
            if (!this.consumerConnected) {
                await this.createConnection();
            }

            // Can alternatively use this.assign();
            this.subscribe(this.topics);

            this.consume();
        } catch (error) {
            throw KafkaError.createUnknown(error);
        }
    }

    /**
     * @async
     * Method to connect the consumer to broker and update the connection status in the class. 
     * This method is called internally when produceEvent() method is called if consumer is not connected. 
     * In cases where it may be beneficial to connect the consumer in advance, it may be called by an external caller. 
     * If there is an already existing promise to connect to broker, the method will wait for the original promise to resolve.
     *
     * @returns {Promise<Metadata|LibrdKafkaError>} - The promise resolves to give the object containing the metadata of broker that 
     * the consumer is connected to and the topics available in that broker or the error thrown during connection.
     *
     * @throws {KafkaError} - Throws error object on failure. 
     */
    public async createConnection(): Promise<Metadata | LibrdKafkaError | Error> {
        if (Object.keys(this.coders).length !== this.topics.length) {
            throw new KafkaError(
                "Invalid coder config",
                KafkaError.codes.INVALID_CODER_CONFIG,
                true,
                "Coder configuration is not set for every topic.",
                "local"
            );
        }

        this.topics.forEach((topic) => {
            if (!this.coders[topic]) {
                throw new KafkaError(
                    "Invalid coder config",
                    KafkaError.codes.INVALID_CODER_CONFIG,
                    true,
                    "Coder config does not match topic names.",
                    "local"
                );
            }
        });

        if (!this.consumerConnecting && !this.consumerConnected) {
            this.consumerConnectPromise = this.connectToBroker();
        }

        return this.brokerMetadata ? this.brokerMetadata : await this.consumerConnectPromise as Metadata;
    }

    /**
     * @async
     * The main entry point to start consuming events. This method returns an observable object which on subscription 
     * connects the consumer to a broker if not connection and creates a stream of messages consumed from kafka. 
     * Calling this event, creates a new stream everytime.
     * 
     * @param {Observer} observer - Th observer object to be passed consisting of next(), error(), and closed(). 
     * next() method is the promise method to be called for every event.
     * 
     * @returns {Promise<void>} - This method on resolving does not return any value. 
     * 
     * @throws {KafkaError} - Throws KafkaError on failure to connect or subscribe to the topic.
     */
    public async start(observer: IObserver<DeserialisedMessage, BaseError>): Promise<void> {
        if (this.listenerCount("event.error") || this.listenerCount("data") || this.listenerCount("disconnected")) {
            this.removeAllListeners();
        }

        this.observer = observer;

        this.on("event.error",
            (error: LibrdKafkaError) => this.onError(
                KafkaError.convertLibError(error)
            ))
            .on("data",
                async (message: Message) => {
                    try {
                        await this.onData(message);
                    } catch (error) {
                        this.onError(KafkaError.createUnknown(error));
                    }
                })
            .on("disconnected", this.onDisconnect.bind(this));

        await this.createSubscription();
    }

    /**
     * Public method that must be called to stop consuming kafka events. It de registers all listeners and disconnects from brokers. 
     * 
     * @returns {void}
     */
    public stop(): void {
        this.disconnect((err: unknown) => {
            if (err) {
                Logger.error(KafkaError.createUnknown(err));
            }

            this.onDisconnect();
        });
    }
}
