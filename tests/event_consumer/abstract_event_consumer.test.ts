import { AbstractEventConsumer } from "../../dist/internal/event_consumer/abstract_event_consumer";
import { DeserialisedMessage } from "../../dist/internal/interfaces/deserialised_kafka_message";
import { SynchronousConsumer } from "../../dist/internal/kafka/consumer/synchronous_consumer";
import { EventConsumerError } from "../../dist/internal/errors/event_consumer_error";
import { Logger } from "../../dist/internal/logger/logger";
import { BaseError } from "../../dist/internal/errors/base_error";

jest.mock("../../dist/internal/kafka/consumer/synchronous_consumer");
jest.mock("../../dist/internal/errors/event_consumer_error");
jest.mock("../../dist/internal/logger/logger");

describe("Abstract Event Consumer", () => {
  class EventConsumer extends AbstractEventConsumer {
    public onEvent = jest.fn()
  }

  let mockedEventConsumerError: jest.MockedClass<typeof EventConsumerError>,
    mockedConsumerClass: jest.MockedClass<typeof SynchronousConsumer>,
    mockedLogger: jest.MockedClass<typeof Logger>,
    mockedConsumerObject: jest.MockedObject<SynchronousConsumer>,
    eventConsumer: EventConsumer;

  beforeEach(() => {
    mockedEventConsumerError = EventConsumerError as jest.MockedClass<typeof EventConsumerError>;
    mockedConsumerClass = SynchronousConsumer as jest.MockedClass<typeof SynchronousConsumer>;
    mockedLogger = Logger as jest.MockedClass<typeof Logger>;

    eventConsumer = new EventConsumer(
      ["mock_topic"],
      {},
      {}
    );
    mockedConsumerObject = mockedConsumerClass.mock.instances[0] as jest.MockedObject<SynchronousConsumer>;
  });

  test("must call start on consumer with observer object", async () => {
    await eventConsumer.execute();

    expect(mockedConsumerObject.start).toBeCalledWith({
      next: expect.anything(),
      error: expect.anything(),
      closed: expect.anything()
    })
  });

  test("on next, must call onEvent method.", async () => {
    await eventConsumer.execute();
    await mockedConsumerObject.start.mock.calls[0][0].next({} as DeserialisedMessage);

    expect(eventConsumer.onEvent).toBeCalledWith({});
  });

  test("If onEvent rejects, EventConsumerError must be thrown", async () => {
    //@ts-ignore
    mockedEventConsumerError.createUnknown.mockReturnValueOnce({ message: "mock" });
    eventConsumer.onEvent.mockRejectedValueOnce(new Error("mock"));

    await eventConsumer.execute();
    await expect(
      mockedConsumerObject.start.mock.calls[0][0].next({} as DeserialisedMessage)
    ).rejects.toEqual({ message: "mock" });
  });

  test("on error, must be logged on logger", async () => {
    await eventConsumer.execute();
    mockedConsumerObject.start.mock.calls[0][0].error({} as BaseError);

    expect(mockedLogger.error).toBeCalledWith({});
  });

  test("on closed, must be logged on logger", async () => {
    //@ts-ignore
    eventConsumer.topics = ["mock_topic"]; // Small hack to be able to test this also if the abstract class is mocked.

    await eventConsumer.execute();
    mockedConsumerObject.start.mock.calls[0][0].closed();

    expect(mockedLogger.info).toBeCalledWith(`Consumer stopped for topics ${["mock_topic"]}`);
  });
});
