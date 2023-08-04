jest.mock("../../../dist/internal/kafka/producer/abstract_producer");
import { AsynchronousProducer } from "../../../dist/internal/kafka/producer/asynchronous_producer";
import disconnectedError from "../../mock_data/disconnected_error.json";
import { ICoder } from "../../../dist/internal/interfaces/coder";
import { DeliveryReport } from "node-rdkafka";

describe("Kafka - Asynchronous Producer", () => {
    let producer: jest.Mocked<AsynchronousProducer>;

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
        producer = new AsynchronousProducer({} as unknown as ICoder, { topic: "" }) as jest.Mocked<AsynchronousProducer>;

        producer.sendToInternalProducer.mockResolvedValue(true);
        producer.on.mockReturnThis();
        producer.listenerCount.mockReturnValue(0);
    });

    describe("produceEvent", () => {
        test("produceEvent should not wait for delivery report before resolving to true.",
            async () => {
                expect.assertions(2);
                await expect(
                    producer.produceEvent(
                        "demo key",
                        { message: "demo message" },
                        "demo"
                    )
                ).resolves.toBe(true);
                
                expect(producer.sendToInternalProducer).toHaveBeenNthCalledWith(
                    1,
                    "demo key",
                    { message: "demo message" },
                    "demo",
                    undefined,
                    undefined,
                    undefined
                );
            }
        );

        test("produceEvent adds listener for delivery-report if not already added.",
            async () => {
                expect.assertions(1);
                await producer.produceEvent(
                    "demo key",
                    { message: "demo message" },
                    "demo"
                );

                expect(producer.on).toBeCalledWith(
                    "delivery-report",
                    expect.anything()
                );
            }
        );

        test("produceEvent does not add listener if delivery-report listener exists.",
            async () => {
                expect.assertions(2);
                //@ts-ignore
                producer.listenerCount.mockReturnValueOnce(1);
                await producer.produceEvent(
                    "demo key",
                    { message: "demo message" },
                    "demo"
                );

                expect(producer.on).not.toHaveBeenCalledWith(
                    "delivery-report", expect.anything()
                );
                expect(producer.on).not.toHaveBeenCalledWith();
            }
        );

        test("onDeliveryReport, delivered event must be emitted",
            async () => {
                expect.assertions(1);
                await producer.produceEvent(
                    "demo key",
                    { message: "demo message" },
                    "demo"
                );

                //@ts-ignore
                producer.on.mock.calls[0][1](undefined, mockDeliveryReport);
                expect(producer.emit).toHaveBeenLastCalledWith(
                    "delivered",
                    mockDeliveryReport
                );
            }
        );

        test("onDeliveryReport error, delivered event must not be emitted",
            async () => {
                expect.assertions(1);
                await producer.produceEvent(
                    "demo key",
                    { message: "demo message" },
                    "demo"
                );
                //@ts-ignore
                producer.on.mock.calls[0][1](disconnectedError, null);
                expect(producer.emit).not.toBeCalledWith("delivered", expect.anything());
            }
        );
    });
});
