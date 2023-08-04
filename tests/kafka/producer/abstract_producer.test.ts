import { Producer, LibrdKafkaError, Metadata, ClientMetrics, MetadataOptions, NumberNullUndefined } from "node-rdkafka";
import { AbstractProducer } from "../../../dist/internal/kafka/producer/abstract_producer";
import disconnectedError from "../../mock_data/disconnected_error.json";
import { KafkaError } from "../../../dist/internal/errors/kafka_error";
import { CoderError } from "../../../dist/internal/errors/coder_error";
import connectError from "../../mock_data/connect_error.json";
import metadataMock from "../../mock_data/metadata_mock.json";
//@ts-ignore
import { coder } from "../../__mocks__/coder";
import { jest } from "@jest/globals";

jest.mock("node-rdkafka");
describe("Kafka - Producer", () => {
    class Subclass extends AbstractProducer {
        async produceEvent() { }
    }

    let mockedProducer = Producer as jest.MockedClass<typeof Producer>,
        producer: Subclass,
        mockedProducerInstance: jest.MockedObject<Producer>;

    beforeEach(() => {
        producer = new Subclass(coder, { topic: "apps.5.pos.bridge.block" });
        mockedProducerInstance = mockedProducer.mock.instances[0];

        mockedProducerInstance.produce.mockResolvedValue(true);
        mockedProducerInstance.flush.mockReturnThis();
        mockedProducerInstance.connect.mockImplementation(
            (
                metadataOptions?: MetadataOptions | undefined,
                cb?: (err: LibrdKafkaError, data: Metadata) => void
            ): Producer => {
                //@ts-ignore
                if (cb) cb(null, metadataMock);
                return new Producer({});
            }
        );
        //@ts-ignore
        mockedProducerInstance.on = jest.fn().mockReturnThis();
    });

    describe("start() - successful", () => {
        test("Should return broker metadata on connection", async () => {
            const metadata = await producer.start();
            expect(metadata).toStrictEqual(metadataMock);
        });

        test("Default connection timeout must be used if not set via constructor.", async () => {
            await producer.start();
            expect(mockedProducerInstance.connect.mock.calls[0][0]).toEqual({ timeout: 10000 });
        });

        test("If connection timeout is passed to constructor, the passed value must be used to connect to kafka instead of default.", async () => {
            const producerWithConnectionTimeout = new Subclass(coder, { connectionTimeout: 100 });
            const secondMockedProducerInstance = mockedProducer.mock.instances[1] as jest.MockedObject<Producer>;
            //@ts-ignore
            secondMockedProducerInstance.on = jest.fn().mockReturnThis();

            await producerWithConnectionTimeout.start();
            expect(secondMockedProducerInstance.connect).toBeCalledWith({ timeout: 100 }, expect.anything());
        });

        test("Should wait for first internal connect call, even if startConnection is called twice.", async () => {
            //Setting timeout to make connect call asynchronous.
            mockedProducerInstance.connect.mockImplementationOnce(
                (
                    metadataOptions?: MetadataOptions | undefined,
                    cb?: (err: LibrdKafkaError, data: Metadata
                    ) => void
                ): Producer => {
                    setTimeout(() => {
                        //@ts-ignore
                        if (cb) cb(null, metadataMock);
                    }, 100);
                    return new Producer({});
                }
            );

            producer.start();
            const metadata = await producer.start();

            expect(mockedProducerInstance.connect).toBeCalledTimes(1);
            expect(metadata).toBe(metadataMock);
        });

        test("If producer already connected connect(), function must not be called.", async () => {
            await producer.start();
            const metadata = await producer.start();

            expect(mockedProducerInstance.connect).toBeCalledTimes(1);
            expect(metadata).toBe(metadataMock);
        });
    });

    describe("start() - errors", () => {
        test("Should return LibRdKafkaError on connection failure", async () => {
            mockedProducerInstance.connect.mockImplementationOnce(
                (
                    metadataOptions?: MetadataOptions | undefined,
                    cb?: (err: LibrdKafkaError, data: Metadata) => void
                ): Producer => {
                    //@ts-ignore
                    if (cb) cb(connectError, null);

                    return new Producer({});
                }
            );

            await expect(producer.start()).rejects.toEqual(
                new KafkaError(
                    "Kafka consumer error",
                    connectError.code,
                    connectError.isFatal,
                    connectError.message,
                    connectError.origin,
                    connectError.stack
                )
            );
        });
    });

    describe("sendToInternalProducer()", () => {
        test("Should call connect if client is not connected or skip otherwise",
            async () => {
                await producer.sendToInternalProducer(
                    "demo key",
                    { message: "demo message" },
                    "demo"
                );
                await producer.sendToInternalProducer(
                    "demo key2",
                    { message: "demo message" },
                    "demo"
                );

                expect(mockedProducerInstance.connect).toHaveBeenCalledTimes(1);
            }
        );

        test("Should return true if successfully produced.",
            async () => {
                expect(
                    await producer.sendToInternalProducer(
                        "demo key",
                        { message: "demo message" },
                        "demo"
                    )
                )
                    .toBe(true);
            }
        );

        test("Should throw kafka error if produce returns an error",
            async () => {
                mockedProducerInstance.produce.mockResolvedValueOnce("demo error string");

                expect(
                    producer.sendToInternalProducer(
                        "demo key",
                        { message: "demo message" },
                        "demo"
                    )
                ).rejects.toEqual(
                    KafkaError.createUnknown("demo error string", true)
                );

            }
        );

        test("Should throw coder error if serialising fails",
            async () => {
                const mockCoderError = new CoderError(
                    "Invalid proto file path",
                    CoderError.codes.INVALID_PATH_PROTO,
                    true,
                    "demo message");
                coder.serialize.mockRejectedValueOnce(mockCoderError);

                await expect(
                    producer.sendToInternalProducer(
                        "demo key",
                        { message: "demo message" },
                        "demo"
                    )
                ).rejects.toEqual(mockCoderError);
            }
        );

        test("On error emitted by Producer client, the error should be emitted to producer.error",
            async () => {
                await producer.sendToInternalProducer(
                    "demo key",
                    { message: "demo message" },
                );
                //@ts-ignore
                mockedProducerInstance.on.mock.calls[0][1](connectError, metadataMock);

                expect(mockedProducerInstance.emit).toHaveBeenCalledWith(
                    "producer.error",
                    expect.objectContaining(
                        KafkaError.createUnknown(connectError, true)
                    )
                );
            }
        );
    });

    describe("stop()", () => {
        test("Should resolve to boolean true if disconnected successfully",
            async () => {
                mockedProducerInstance.disconnect.mockImplementationOnce(
                    //@ts-ignore
                    (   
                        timeout: number,
                        cb?: (err: LibrdKafkaError, data: ClientMetrics) => void
                    ) => {
                        //@ts-ignore
                        if (cb) cb(undefined, { connectionOpened: 123 });
                        return new Producer({});
                    }
                );

                await producer.start();

                expect(await producer.stop()).toEqual(true);
                expect(mockedProducerInstance.disconnect).toBeCalled();
            }
        );

        test("On disconnect error if any, kafka error must be thrown",
            async () => {
                mockedProducerInstance.disconnect.mockImplementationOnce(
                    (
                        timeout: number,
                        cb?: (err: LibrdKafkaError, data: ClientMetrics) => void
                    ) => {
                        if (cb) cb(disconnectedError, { connectionOpened: 123 });
                        return new Producer({});
                    }
                );

                mockedProducerInstance.flush.mockImplementationOnce(
                    (
                        timeout: NumberNullUndefined,
                        cb?: (err: LibrdKafkaError, data: ClientMetrics) => void
                    ) => {
                        //@ts-ignore
                        if (cb) cb(undefined, { connectionOpened: 123 });
                        return new Producer({});
                    }
                );

                await expect(
                    producer.stop()
                ).rejects.toEqual(
                    KafkaError.convertLibError(disconnectedError as unknown as LibrdKafkaError)
                );
            }
        );

        test("Whenever disconnected, producer.disconnected event must be emitted.",
            async () => {
                await producer.start();

                //@ts-ignore
                mockedProducerInstance.on.mock.calls[1][1]();
                expect(mockedProducerInstance.emit).toHaveBeenCalledWith(
                    "producer.disconnected"
                );
            },
            3000
        );

        test("On disconnected, all listeners must be removed",
            async () => {
                await producer.start();
                //@ts-ignore
                mockedProducerInstance.on.mock.calls[1][1]();

                expect(mockedProducerInstance.removeAllListeners).toBeCalled();
            }
        );
    });
});
