jest.mock("../../../dist/internal/kafka/consumer/abstract_consumer");
import { IConsumerQueueObject } from "../../../dist/internal/interfaces/consumer_queue_object";
import { DeserialisedMessage } from "../../../dist/internal/interfaces/deserialised_kafka_message";
import { SynchronousConsumer } from "../../../dist/internal/kafka/consumer/synchronous_consumer";
import { Coder } from "../../../dist/internal/coder/protobuf_coder";
import mockMessage from "../../mock_data/mock_message.json";
//@ts-ignore
import { observer } from "../../__mocks__/observer";
//@ts-ignore
import { coder } from "../../__mocks__/coder";

jest.mock("node-rdkafka");


describe("Kafka - Synchronous Consumer", () => {
    class MockClass extends SynchronousConsumer {
        public enqueueMock(message: DeserialisedMessage): IConsumerQueueObject<DeserialisedMessage> {
             this.observer = observer;
            return this.enqueue(message);
        }
    }

    let consumer: MockClass;

    beforeEach(() => {
        consumer = new MockClass("chainId-137", {"chainId-137": coder as unknown as Coder});
    });

    test("Enqueue method must return ConsumerQueueObject without promise", () => {
        expect(
            consumer.enqueueMock(
                mockMessage as unknown as DeserialisedMessage
            ).promise
        ).toBeFalsy();
    });

    test("Enqueue method must return ConsumerQueueObject without modifying kafka message", () => {
        expect(
            consumer.enqueueMock(
                mockMessage as unknown as DeserialisedMessage
            ).message
        ).toBe(mockMessage);
    });

    test("On enqueue observer.next must not be called", async () => {
        consumer.enqueueMock(
            mockMessage as unknown as DeserialisedMessage
        );
        
        expect(observer.next).not.toBeCalled();
    });
});
