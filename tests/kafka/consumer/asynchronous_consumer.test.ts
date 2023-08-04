jest.mock("../../../dist/internal/errors/kafka_error");
jest.mock("../../../dist/internal/kafka/consumer/abstract_consumer");
import { DeserialisedMessage } from "../../../dist/internal/interfaces/deserialised_kafka_message";
import { AsynchronousConsumer } from "../../../dist/internal/kafka/consumer/asynchronous_consumer";
import { IConsumerQueueObject } from "../../../dist/internal/interfaces/consumer_queue_object";
import { IConsumerConfig } from "../../../dist/internal/interfaces/consumer_config";
import { IKafkaCoderConfig } from "../../../dist/internal/interfaces/kafka_coder_config";
import { KafkaError } from "../../../dist/internal/errors/kafka_error";
import { BaseError } from "../../../dist/internal/errors/base_error";
import { Coder } from "../../../dist/internal/coder/protobuf_coder";
import mockMessage from "../../mock_data/mock_message.json";
//@ts-ignore
import { observer } from "../../__mocks__/observer";
//@ts-ignore
import { coder } from "../../__mocks__/coder";

describe("Kafka - Asynchronous Consumer", () => {
    class MockClass extends AsynchronousConsumer {
        constructor(
            topic: string,
            coders: IKafkaCoderConfig,
            config: IConsumerConfig = {},
        ) {
            super(topic, coders, config);
             this.maxRetries = config.maxRetries || config.maxRetries === 0 ? config.maxRetries : 10;
        }
        public enqueueMock(message: DeserialisedMessage): IConsumerQueueObject<DeserialisedMessage> {
             this.observer = observer;
            return this.enqueue(message);
        }
    }

    let consumer: jest.MockedObject<MockClass>,
    mockedKafkaError: jest.MockedClass<typeof KafkaError>;

    beforeEach(() => {
        consumer = new MockClass(
            "chainId-137",
            {"chainId-137": coder as unknown as Coder},
            { maxRetries: 0 }
        ) as jest.MockedObject<MockClass>;
        mockedKafkaError = KafkaError as jest.MockedClass<typeof KafkaError>;
    });

    test("Enqueue method must return ConsumerQueueObject with promise", () => {
        const object = consumer.enqueueMock(
            mockMessage as unknown as DeserialisedMessage
        ).promise;
        expect(object).toBeInstanceOf(Promise);
    });

    test("On enqueue observer.next must be called with message", async () => {
        consumer.enqueueMock(
            mockMessage as unknown as DeserialisedMessage
        );

        expect(observer.next).toBeCalledWith(mockMessage);
    });

    test("On observer.next promise reject, promise must throw a converted KafkaError",
        async () => {
            expect.assertions(2);
            //@ts-ignore
            mockedKafkaError.createUnknown.mockReturnValue("demo");
            const error = new Error("Demo error");
            observer.next.mockImplementationOnce(async () => {
                throw error;
            });
            const queueObject = consumer.enqueueMock(
                mockMessage as unknown as DeserialisedMessage
            );

            await expect(queueObject.promise).rejects.toBe("demo");
            expect(mockedKafkaError.createUnknown).toHaveBeenCalledWith(error);
        }
    );

    test("On observer.next promise reject, promise must be tried upto maxRetry times if not fatal error",
        async () => {
            expect.assertions(2);
            const maxRetries = 5;
            for (let i = 0; i <= maxRetries; i++) {
                observer.next.mockImplementationOnce(async () => {
                    throw new Error("Demo");
                });
            }
            //@ts-ignore
            mockedKafkaError.createUnknown.mockReturnValueOnce("demo");

            const consumerWithMaxRetries = new MockClass(
                "chainId-137",
                {"chainId-137": coder as unknown as Coder},
                { maxRetries }
            );

            const queueObject = consumerWithMaxRetries.enqueueMock(
                mockMessage as unknown as DeserialisedMessage
            );

            await expect(
                queueObject.promise
            ).rejects.toEqual("demo");
            expect(observer.next).toBeCalledTimes(maxRetries + 1);
        }
    );

    test("On the next promise throwing a fatal error, it must not be retried",
        async () => {
            expect.assertions(2);
            const maxRetries = 5;
            observer.next.mockImplementationOnce(async () => {
                throw new BaseError("demo", 123, true);
            });
            const consumerWithMaxRetries = new MockClass(
                "chainId-137",
                {"chainId-137": coder as unknown as Coder},
                { maxRetries }
            );
            //@ts-ignore
            mockedKafkaError.createUnknown.mockReturnValueOnce("demo");

            const queueObject = consumerWithMaxRetries.enqueueMock(
                mockMessage as unknown as DeserialisedMessage
            );
            await expect(
                queueObject.promise
            ).rejects.toEqual("demo");
            expect(observer.next).toBeCalledTimes(1);
        }
    );
});
