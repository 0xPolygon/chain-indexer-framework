jest.mock("../../../dist/internal/kafka/producer/abstract_producer");
import { SynchronousProducer } from "../../../dist/internal/kafka/producer/synchronous_producer";
import { Metadata, ClientMetrics, DeliveryReport } from "node-rdkafka";
import disconnectedError from "../../mock_data/disconnected_error.json";
import { KafkaError } from "../../../dist/internal/errors/kafka_error";
import { ICoder } from "../../../dist/internal/interfaces/coder";
import { jest } from "@jest/globals";


describe("Kafka - Synchronous Producer", () => {
    let producer: jest.Mocked<SynchronousProducer>;
    const mockDeliveryReport: DeliveryReport = {
        value: Buffer.from("Demo"),
        size: 1,
        key: Buffer.from("1"),
        timestamp: 123,
        offset: 0,
        topic: "demo",
        partition: 0
    };

    beforeEach(() => {
        producer = new SynchronousProducer({} as unknown as ICoder, { deliveryTimeout: 500, topic: "" }) as jest.Mocked<SynchronousProducer>;
        producer.sendToInternalProducer.mockResolvedValue(true);
    });

    describe("produceEvent", () => {
        test("produceEvent should reject with error, if delivery report is not available before deliveryTimeout",
            async () => {
                await expect(
                    producer.produceEvent(
                        "demo key",
                        { message: "demo message" },
                        "demo"
                    )
                ).rejects.toEqual(
                    new KafkaError(
                        "Kafka producer error",
                        KafkaError.codes.DELIVERY_TIMED_OUT,
                        false,
                        "Could not receive delivery confirmation before 500 ms",
                        "remote"
                    )
                );
            }
        );

        test("produceEvent should wait for delivery report before resolving with the report.",
            async () => {
                producer.sendToInternalProducer.mockImplementationOnce(
                    async () => {
                        mockDeliveryReport.opaque = producer.sendToInternalProducer.mock.calls[0][5];
                        producer.on.mock.calls[0][1](null, mockDeliveryReport as DeliveryReport & Metadata & ClientMetrics);
                        return true;
                    }
                );
                await expect(
                    producer.produceEvent(
                        "demo key",
                        { message: "demo message" },
                        "demo"
                    )
                ).resolves.toBe(mockDeliveryReport);
            }
        );

        test("If delivery report reports an error, Kafka error must be thrown.",
            async () => {
                producer.sendToInternalProducer.mockImplementationOnce(
                    async () => {
                        mockDeliveryReport.opaque = producer.sendToInternalProducer.mock.calls[0][5];
                        // To make the process async and allow poll to be called before test completes.
                        // TODO - remove setTimeout to avoid complexity.
                        setTimeout(() => {
                            producer.on.mock.calls[0][1](
                                disconnectedError,
                                mockDeliveryReport as DeliveryReport & Metadata & ClientMetrics
                            );
                        }, 150);

                        return true;
                    }
                );

                await expect(
                    producer.produceEvent(
                        "demo key",
                        { message: "demo message" },
                        "demo"
                    )
                ).rejects.toEqual(
                    KafkaError.convertLibError(disconnectedError)
                );
            }
        );
    });
});
