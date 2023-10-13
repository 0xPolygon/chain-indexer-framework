
jest.mock("../../../dist/internal/queue/queue");
jest.mock("node-rdkafka");
import { DeserialisedMessage } from "../../../dist/internal/interfaces/deserialised_kafka_message";
import { KafkaConsumer, LibrdKafkaError, Metadata, MetadataOptions } from "node-rdkafka";
import { IConsumerQueueObject } from "../../../dist/internal/interfaces/consumer_queue_object";
import { AbstractConsumer } from "../../../dist/internal/kafka/consumer/abstract_consumer";
import disconnectedError from "../../mock_data/disconnected_error.json";
import { KafkaError } from "../../../dist/internal/errors/kafka_error";
import { CoderError } from "../../../dist/internal/errors/coder_error";
import { IObserver } from "../../../dist/internal/interfaces/observer";
import { BaseError } from "../../../dist/internal/errors/base_error";
import connectError from "../../mock_data/connect_error.json";
import metadataMock from "../../mock_data/metadata_mock.json";
import { Coder } from "../../../dist/internal/coder/protobuf_coder";
import mockMessage from "../../mock_data/mock_message.json";
//@ts-ignore
import { observer } from "../../__mocks__/observer";
//@ts-ignore
import { coder } from "../../__mocks__/coder";
import { Queue } from "../../../dist/internal/queue/queue";

describe("Kafka - AbstractConsumer", () => {
    class Subclass extends AbstractConsumer {
        protected enqueue(message: DeserialisedMessage): IConsumerQueueObject<DeserialisedMessage> {
            return {
                message
            };
        }
    }

    let mockedKafkaConsumer: jest.MockedClass<typeof KafkaConsumer>,
        mockedQueueClass: jest.MockedClass<typeof Queue>,
        consumer: Subclass,
        mockedKafkaConsumerInstance: jest.Mocked<KafkaConsumer>,
        mockedQueueClassInstance: jest.Mocked<Queue<IConsumerQueueObject<DeserialisedMessage>>>;


    const mockTopicName: string = "chainId-137";
    mockedKafkaConsumer = KafkaConsumer as jest.MockedClass<typeof KafkaConsumer>;
    mockedQueueClass = Queue as jest.MockedClass<typeof Queue>;
    beforeEach(() => {
        consumer = new Subclass(mockTopicName, { [mockTopicName]: coder as Coder });
        mockedKafkaConsumerInstance = mockedKafkaConsumer.mock.instances[0] as jest.Mocked<KafkaConsumer>;
        mockedQueueClassInstance = mockedQueueClass.mock.instances[0] as jest.Mocked<Queue<IConsumerQueueObject<DeserialisedMessage>>>;

        mockedKafkaConsumerInstance.connect.mockImplementation(
            (
                metadataOptions?: MetadataOptions | undefined,
                cb?: (err: LibrdKafkaError, data: Metadata) => void
            ): KafkaConsumer => {
                //@ts-ignore
                if (cb) cb(null, metadataMock);
                return new KafkaConsumer({}, {});
            }
        );
        mockedKafkaConsumerInstance.subscribe.mockReturnThis();
        mockedKafkaConsumerInstance.on.mockReturnThis();
        mockedKafkaConsumerInstance.commitMessage.mockReturnThis();
        mockedKafkaConsumerInstance.listenerCount.mockReturnValue(0);
        mockedQueueClassInstance.isEmpty.mockReturnValue(true);
    });

    describe("constructor", () => {
        test("should call super with default kafka config and topic config", () => {
            consumer = new Subclass(
                mockTopicName, 
                { [mockTopicName]: coder as Coder }, 
                {
                    "bootstrap.servers": "localhost:9094", 
                    "event_cb": false, 
                    "topicConfig": {
                        "auto.offset.reset": "latest", 
                        "consume.callback.max.messages": 10
                    }
                }
            );

            expect(mockedKafkaConsumer).toHaveBeenNthCalledWith(
                2,
                {
                    "debug": "cgrp",
                    "bootstrap.servers": "localhost:9094",
                    "enable.auto.commit": false,
                    "enable.auto.offset.store": false,
                    "event_cb": false,
                    "message.max.bytes": 26214400,
                    "isolation.level": "read_uncommitted",
                    "fetch.message.max.bytes": 26214400,
                    "queued.max.messages.kbytes": 25000
                },
                {
                    "auto.offset.reset": "latest", 
                    "consume.callback.max.messages": 10
                },
            )
        });

        test("If consumer and topic config is passed default config must not be used", () => {
            expect(mockedKafkaConsumer).toBeCalledWith(
                {
                    "debug": "cgrp",
                    "bootstrap.servers": "localhost:9092",
                    "enable.auto.commit": false,
                    "enable.auto.offset.store": false,
                    "event_cb": true,
                    "message.max.bytes": 26214400,
                    "fetch.message.max.bytes": 26214400,
                    "queued.max.messages.kbytes": 25000,
                    "isolation.level": "read_uncommitted",
                },
                {
                    "auto.offset.reset": "earliest" as "earliest" | "smallest" | "beginning" | "largest" | "latest" | "end" | "error" | undefined
                },
            )
        });
    });

    describe("createConnection() - successful", () => {

        test("Should return broker metadata on connection", async () => {
            expect(
                await consumer.createConnection()
            ).toBe(metadataMock);
        });

        test("The connectionTimeout value used should be the one passed", async () => {
            await new Subclass(mockTopicName, { [mockTopicName]: coder as Coder }, { connectionTimeout: 100 }).createConnection();
            expect(
                mockedKafkaConsumer.mock.instances[1].connect
            ).toBeCalledWith(
                expect.objectContaining(
                    { timeout: 100 }
                ),
                expect.anything()
            );
        });

        test("Default connection timeout must be used if not set via constructor.", async () => {
            await consumer.createConnection();
            expect(
                mockedKafkaConsumerInstance.connect
            ).toBeCalledWith(
                expect.objectContaining(
                    { timeout: 10000 }
                ),
                expect.anything()
            );
        });


        test("Should wait for first internal connect call, even if startConnection is called twice.", async () => {
            //Setting timeout to make connect call asynchronous.
            mockedKafkaConsumerInstance.connect.mockImplementationOnce(
                (
                    metadataOptions?: MetadataOptions | undefined,
                    cb?: (err: LibrdKafkaError, data: Metadata) => void
                ): KafkaConsumer => {
                    setTimeout(() => {
                        //@ts-ignore
                        if (cb) cb(null, metadataMock);
                    }, 100);
                    return new KafkaConsumer({}, {});
                }
            );

            consumer.createConnection();

            expect(
                await consumer.createConnection()
            ).toBe(metadataMock);
            expect(mockedKafkaConsumerInstance.connect).toBeCalledTimes(1);
        });

        test("If consumer already connected, connect() function must not be called.", async () => {
            await consumer.createConnection();

            expect(mockedKafkaConsumerInstance.connect).toBeCalledTimes(1);
            expect(await consumer.createConnection()).toBe(metadataMock);
            expect(mockedKafkaConsumerInstance.connect).toBeCalledTimes(1);
        });

        test("Should throw error if coder config is not set correctly as per topics", async () => {
            const consumerMultipleTopics = new Subclass(["mock1", "mock2"], { "mock2": coder as Coder, "mock3": coder as Coder });

            await expect(consumerMultipleTopics.createConnection()).rejects.toEqual(
                new KafkaError(
                    "Invalid coder config",
                    KafkaError.codes.INVALID_CODER_CONFIG,
                    true,
                    "Coder config does not match topic names.",
                    "local"
                )
            );
        });

        test("Should throw error if number of coders is not equal to number of topics", async () => {
            const consumerMultipleTopics = new Subclass(["mock1", "mock2"], { "mock2": coder as Coder });

            await expect(consumerMultipleTopics.createConnection()).rejects.toEqual(
                new KafkaError(
                    "Invalid coder config",
                    KafkaError.codes.INVALID_CODER_CONFIG,
                    true,
                    "Coder configuration is not set for every topic.",
                    "local"
                )
            );
        });
    });

    describe("createConnection() - errors", () => {
        beforeEach(() => {
            mockedKafkaConsumerInstance.connect.mockImplementationOnce(
                (
                    metadataOptions?: MetadataOptions | undefined,
                    cb?: (err: LibrdKafkaError, data: Metadata) => void
                ): KafkaConsumer => {
                    //@ts-ignore
                    if (cb) cb(connectError, null);
                    return new KafkaConsumer({}, {});
                }
            );
        });

        test("Should throw KafkaError on connection failure", async () => {
            await expect(consumer.createConnection()).rejects.toEqual(
                new KafkaError(
                    "Kafka consumer connection error",
                    connectError.code,
                    connectError.isFatal,
                    connectError.message,
                    connectError.origin,
                    connectError.stack
                )
            );
        });
    });


    describe("start()", () => {
        test("If existing listeners, listeners must be cleared before registering current ones.",
            async () => {
                mockedKafkaConsumerInstance.listenerCount.mockReturnValueOnce(0);
                mockedKafkaConsumerInstance.listenerCount.mockReturnValueOnce(0);
                mockedKafkaConsumerInstance.listenerCount.mockReturnValueOnce(1);

                mockedKafkaConsumerInstance.connect.mockImplementationOnce(
                    (
                        metadataOptions?: MetadataOptions | undefined,
                        cb?: (err: LibrdKafkaError, data: Metadata) => void
                    ): KafkaConsumer => {
                        //@ts-ignore
                        if (cb) cb(null, metadataMock);
                        return new KafkaConsumer({}, {});
                    }
                );

                await consumer.start(observer as IObserver<DeserialisedMessage, BaseError>);
                expect(mockedKafkaConsumerInstance.removeAllListeners).toBeCalled();
            });

        test("If no existing listeners, removeAllListeners must not be called.", async () => {
            await consumer
                .start(
                    observer as IObserver<DeserialisedMessage, BaseError>
                );

            expect(mockedKafkaConsumerInstance.removeAllListeners).not.toBeCalled();
        });


        test("If consumer is not connected to broker, connect() must be called, or must be skipped otherwise.", async () => {
            await consumer.start(observer as IObserver<DeserialisedMessage, BaseError>);
            await consumer.start(observer as IObserver<DeserialisedMessage, BaseError>);

            expect(mockedKafkaConsumerInstance.connect).toBeCalledTimes(1);
        });

        test("Subscribe and consume method must be called on successful connection", async () => {
            await consumer.start(observer as IObserver<DeserialisedMessage, BaseError>);

            expect(mockedKafkaConsumerInstance.subscribe).toBeCalledTimes(1);
            expect(mockedKafkaConsumerInstance.consume).toBeCalledTimes(1);
        });

        test("Subscribe method must be called with right topic names as parameter when topic passed is string", async () => {
            await consumer.start(observer as IObserver<DeserialisedMessage, BaseError>);

            expect(mockedKafkaConsumerInstance.subscribe).toBeCalledWith(expect.arrayContaining([mockTopicName]));
        });

        test("Subscribe method must be called with right topic names as parameter when topic passed is an array", async () => {
            const consumerMultipleTopics = new Subclass(["mock1", "mock2"], { "mock1": coder as Coder, "mock2": coder as Coder });
            await consumerMultipleTopics.start(observer as IObserver<DeserialisedMessage, BaseError>);

            expect(mockedKafkaConsumerInstance.subscribe).toBeCalledWith(expect.arrayContaining(["mock1", "mock2"]));
        });

        test("On subscribe/consume error, start must reject with Kafka error",
            async () => {
                mockedKafkaConsumerInstance.subscribe.mockImplementationOnce(() => {
                    throw disconnectedError;
                });

                await expect(
                    consumer.start(observer as IObserver<DeserialisedMessage, BaseError>)
                ).rejects.toEqual(
                    new KafkaError(
                        "Kafka consumer error",
                        disconnectedError.code,
                        disconnectedError.isFatal,
                        disconnectedError.message,
                        disconnectedError.origin,
                        disconnectedError.stack
                    )
                );
            });

        test("On unknown subscribe/consume error, start must reject with Kafka error",
            async () => {
                mockedKafkaConsumerInstance.subscribe.mockImplementationOnce(() => {
                    throw "demo";
                });

                await expect(
                    consumer.start(observer as IObserver<DeserialisedMessage, BaseError>)
                ).rejects.toEqual(
                    new KafkaError(
                        "Kafka consumer error",
                        KafkaError.codes.UNKNOWN_CONSUMER_ERR,
                        true,
                        "demo",
                        "local"
                    )
                );
            }
        );

        test("Event listener for event.error, data, and disconnected must be registered.", async () => {
            mockedKafkaConsumerInstance.subscribe.mockReturnValueOnce(new KafkaConsumer({}, {}));
            await consumer.start(observer);

            expect(mockedKafkaConsumerInstance.on).toHaveBeenNthCalledWith(1, "event.error", expect.anything());
            expect(mockedKafkaConsumerInstance.on).toHaveBeenNthCalledWith(2, "data", expect.anything());
            expect(mockedKafkaConsumerInstance.on).toHaveBeenNthCalledWith(3, "disconnected", expect.anything());
            expect(mockedKafkaConsumerInstance.on).toHaveBeenCalledTimes(3);
        });

        test("on failure to deserialise consumed message, CoderError  must be thrown.",
            (done) => {
                const decodingError = new CoderError(
                    "Decoding error",
                    CoderError.codes.DECODING_ERROR,
                    true,
                    "decoding error"
                );

                coder.deserialize.mockRejectedValueOnce(decodingError);

                consumer.start({
                    next: observer.next as IObserver<DeserialisedMessage, BaseError>["next"],
                    error: (error: KafkaError) => {
                        expect(error).toBe(decodingError);
                        done();
                    },
                    closed: observer.closed
                }).then(
                    () => {
                        const callback = mockedKafkaConsumerInstance.on.mock.calls[1][1];
                        //@ts-ignore
                        callback({ value: "demo", topic: mockTopicName });
                    }
                );
            }
        );

        test("On event, next must be called with the Deserialised message",
            (done) => {
                coder.deserialize.mockResolvedValueOnce("demo");
                mockedQueueClassInstance.isEmpty.mockReturnValueOnce(false);
                mockedQueueClassInstance.front.mockReturnValueOnce({
                    message: mockMessage as unknown as DeserialisedMessage
                });

                consumer.start({
                    next: async (message: object) => {
                        expect(message).toBe(mockMessage);
                        expect(observer.error).not.toBeCalled();
                        done();
                        return;
                    },
                    error: observer.error,
                    closed: observer.closed
                }).then(
                    () => {
                        const callback = mockedKafkaConsumerInstance.on.mock.calls[1][1];
                        //@ts-ignore
                        callback(mockMessage);
                    }
                );
            }
        );

        test("On next promise reject, the promise must be retried upto maxRetries before calling error on observer",
            (done) => {
                let retryCount = -1;
                const maxRetries = 5;
                const consumerWithCustomConfig = new Subclass(
                    mockTopicName,
                    { [mockTopicName]: coder as Coder },
                    { maxRetries }
                );
                mockedQueueClassInstance = mockedQueueClass.mock.instances[1] as jest.Mocked<Queue<IConsumerQueueObject<DeserialisedMessage>>>;
                mockedQueueClassInstance.isEmpty.mockReturnValue(true);

                coder.deserialize.mockResolvedValueOnce("demo");
                for (let i = 0; i <= maxRetries; i++) {
                    mockedQueueClassInstance.isEmpty.mockReturnValueOnce(false);
                    mockedQueueClassInstance.front.mockReturnValueOnce({
                        message: mockMessage as unknown as DeserialisedMessage
                    });
                }

                consumerWithCustomConfig.start({
                    next: async () => {
                        retryCount++;
                        throw new Error("demo error");
                    },
                    error: () => {
                        expect(retryCount).toBe(maxRetries);
                        done();
                    },
                    closed: observer.closed
                }).then(
                    () => {
                        //@ts-ignore
                        (
                            mockedKafkaConsumer.mock.instances[1].on as jest.MockedFunction<KafkaConsumer["on"]>
                        ).mock.calls[1][1](mockMessage);
                    }
                );
            }
        );

        test("Error thrown by next promise must be converted to KafkaError",
            (done) => {
                const maxRetries = 0;
                const consumerWithCustomConfig = new Subclass(
                    mockTopicName,
                    { [mockTopicName]: coder as Coder },
                    { maxRetries }
                );

                coder.deserialize.mockResolvedValueOnce("demo");

                consumerWithCustomConfig.start({
                    next: async () => {
                        throw new Error("demo");
                    },
                    error: (error: KafkaError) => {
                        expect(error.name).toBe("Kafka consumer error");
                        expect(error.isFatal).toBe(true);
                        expect(error.code).toBe(KafkaError.codes.UNKNOWN_CONSUMER_ERR);
                        done();
                    },
                    closed: observer.closed
                }).then(
                    () => {
                        //@ts-ignore
                        (
                            mockedKafkaConsumer.mock.instances[1].on as jest.MockedFunction<KafkaConsumer["on"]>
                        ).mock.calls[1][1](mockMessage);
                    }
                );
            }
        );

        test("When commitMessage fails, the observer must be informed and the next event must not be processed",
            (done) => {
                const maxRetries = 0;
                const consumerWithCustomConfig = new Subclass(
                    mockTopicName,
                    { [mockTopicName]: coder as Coder },
                    { maxRetries }
                );
                mockedQueueClassInstance = mockedQueueClass.mock.instances[1] as jest.Mocked<Queue<IConsumerQueueObject<DeserialisedMessage>>>;
                mockedQueueClassInstance.isEmpty.mockReturnValue(true);

                coder.deserialize.mockResolvedValueOnce("demo");
                for (let i = 0; i <= maxRetries + 1; i++) {
                    mockedQueueClassInstance.isEmpty.mockReturnValueOnce(false);
                    mockedQueueClassInstance.front.mockReturnValueOnce({
                        message: mockMessage as unknown as DeserialisedMessage
                    });
                }
                //Adding a small timeout before next is resolved, 
                // so as to add the second event to queue before attempting to commit message.
                observer.next.mockImplementationOnce(() => {
                    return new Promise((resolve) => {
                        setTimeout(resolve, 100);
                    });
                });
                mockedKafkaConsumerInstance.commitMessage.mockImplementationOnce(() => {
                    throw disconnectedError;
                });

                consumerWithCustomConfig.start({
                    next: observer.next as IObserver<DeserialisedMessage, BaseError>["next"],
                    error: (error: KafkaError) => {
                        expect(error.name).toBe("Kafka consumer error");
                        expect(error.message).toBe(disconnectedError.message);
                        expect(observer.next).toBeCalledTimes(1);
                        done();
                    },
                    closed: observer.closed
                }).then(
                    () => {
                        const callback = (
                            mockedKafkaConsumer.mock.instances[1].on as jest.MockedFunction<KafkaConsumer["on"]>
                        ).mock.calls[1][1];

                        //@ts-ignore
                        callback(mockMessage);
                        //@ts-ignore
                        callback(mockMessage);
                    }
                );
            });

        test("When commitMessage fails, class must retry to commit message upto maxRetry times before calling error on observer.",
            (done) => {
                const maxRetries = 5;
                const consumerWithCustomConfig = new Subclass(
                    mockTopicName,
                    { [mockTopicName]: coder as Coder },
                    { maxRetries }
                );
                mockedQueueClassInstance = mockedQueueClass.mock.instances[1] as jest.Mocked<Queue<IConsumerQueueObject<DeserialisedMessage>>>;
                mockedQueueClassInstance.isEmpty.mockReturnValue(true);

                coder.deserialize.mockResolvedValueOnce("demo");
                for (let i = 0; i <= maxRetries; i++) {
                    mockedKafkaConsumerInstance.commitMessage.mockImplementationOnce(() => {
                        throw disconnectedError;
                    });
                    mockedQueueClassInstance.isEmpty.mockReturnValueOnce(false);
                    mockedQueueClassInstance.front.mockReturnValueOnce({
                        message: mockMessage as unknown as DeserialisedMessage
                    });
                }

                consumerWithCustomConfig.start({
                    next: observer.next as IObserver<DeserialisedMessage, BaseError>["next"],
                    error: () => {
                        expect(mockedKafkaConsumerInstance.commitMessage).toBeCalledTimes(maxRetries + 1);
                        done();
                    },
                    closed: observer.closed
                }).then(
                    () => {
                        //@ts-ignore
                        (
                            mockedKafkaConsumer.mock.instances[1].on as jest.MockedFunction<KafkaConsumer["on"]>
                        ).mock.calls[1][1](mockMessage);
                    }
                );
            }
        );

        test("When internal queue exceeds maxBuffer limit, the consumer must be paused.",
            (done) => {
                const onEventCount: number = 0;
                const maxRetries: number = 0;
                const maxBufferLength: number = 2;
                const consumerWithCustomConfig = new Subclass(
                    mockTopicName,
                    { [mockTopicName]: coder as Coder },
                    {
                        maxRetries,
                        maxBufferLength
                    }
                );
                mockedQueueClassInstance = mockedQueueClass.mock.instances[1] as jest.Mocked<Queue<IConsumerQueueObject<DeserialisedMessage>>>;
                mockedQueueClassInstance.isEmpty.mockReturnValue(true);

                coder.deserialize.mockResolvedValueOnce("demo");
                //Four messages emitted by mocks in test.
                mockedQueueClassInstance.isEmpty.mockReturnValueOnce(false);
                mockedQueueClassInstance.front.mockReturnValueOnce({
                    message: mockMessage as unknown as DeserialisedMessage
                });
                mockedQueueClassInstance.getLength.mockReturnValueOnce(2);
                mockedQueueClassInstance.getLength.mockReturnValueOnce(1);

                consumerWithCustomConfig.start({
                    next: async () => {
                        expect(mockedKafkaConsumerInstance.pause).toBeCalled();
                        expect(observer.error).not.toBeCalled();
                        done();
                    },
                    error: observer.next,
                    closed: observer.closed
                }).then(
                    async () => {
                        const callback = mockedKafkaConsumerInstance.on.mock.calls[1][1];
                        //@ts-ignore
                        callback(mockMessage);
                    }
                );
            }
        );

        test("A paused consumer must be resumed when buffer length decreases",
            (done) => {
                const maxRetries: number = 0;
                const maxBufferLength: number = 2;
                const consumerWithCustomConfig = new Subclass(
                    mockTopicName,
                    { [mockTopicName]: coder as Coder },
                    {
                        maxRetries,
                        maxBufferLength
                    }
                );
                mockedQueueClassInstance = mockedQueueClass.mock.instances[1] as jest.Mocked<Queue<IConsumerQueueObject<DeserialisedMessage>>>;
                mockedQueueClassInstance.isEmpty.mockReturnValue(true);

                coder.deserialize.mockResolvedValueOnce("demo");
                //Four messages emitted by the mock of test.
                mockedQueueClassInstance.isEmpty.mockReturnValueOnce(false);
                mockedQueueClassInstance.front.mockReturnValueOnce({
                    message: mockMessage as unknown as DeserialisedMessage
                });
                mockedQueueClassInstance.isEmpty.mockReturnValueOnce(false);
                mockedQueueClassInstance.front.mockReturnValueOnce({
                    message: mockMessage as unknown as DeserialisedMessage
                });
                mockedQueueClassInstance.getLength.mockReturnValueOnce(2);
                mockedQueueClassInstance.getLength.mockReturnValueOnce(1);
                mockedQueueClassInstance.getLength.mockReturnValueOnce(0);
                mockedQueueClassInstance.getLength.mockReturnValueOnce(0);

                let messageCount = 0;
                consumerWithCustomConfig.start({
                    next: async () => {
                        messageCount++;
                        if (messageCount > 1) {
                            expect(mockedKafkaConsumer.mock.instances[1].resume).toBeCalled();
                            done();
                        }
                    },
                    error: observer.next,
                    closed: observer.closed
                }).then(
                    async () => {
                        const callback = (
                            mockedKafkaConsumer.mock.instances[1].on as jest.MockedFunction<KafkaConsumer["on"]>
                        ).mock.calls[1][1];

                        //@ts-ignore
                        callback(mockMessage);
                        //@ts-ignore
                        callback(mockMessage);
                    }
                );
            }
        );
    });
});
