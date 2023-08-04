import { KafkaError } from "../../dist/internal/errors/kafka_error";
import { createErrorObject } from "../../dist/internal/errors/create_error_object";
import { isBaseError } from "../../dist/internal/errors/is_base_error";
import { BaseError } from "../../dist/internal/errors/base_error";
//@ts-ignore
import connectError from "../mock_data/connect_error.json";
jest.mock("../../dist/internal/errors/base_error");
jest.mock("../../dist/internal/errors/is_base_error");
jest.mock("../../dist/internal/errors/create_error_object");

describe("Kafka Error", () => {
    let kafkaError: KafkaError;
    let mockedBaseErrorInstance: jest.MockedObject<BaseError>;
    let mockedBaseErrorClass: jest.MockedClass<typeof BaseError>;
    let mockedIsBaseError: jest.MockedFunction<typeof isBaseError>;
    let mockedCreateErrorObject: jest.MockedFunction<typeof createErrorObject>;


    beforeEach(() => {
        kafkaError = new KafkaError(undefined, 123);
        mockedBaseErrorClass = BaseError as jest.MockedClass<typeof BaseError>;
        mockedIsBaseError = isBaseError as jest.MockedFunction<typeof isBaseError>;
        mockedCreateErrorObject = createErrorObject as jest.MockedFunction<typeof createErrorObject>;
        mockedBaseErrorInstance = mockedBaseErrorClass.mock.instances[0] as jest.MockedObject<BaseError>;
    });

    describe("Block producer error class", () => {
        test("Block producer error object by default must have 'Kafka Error' as name set via super()",
            () => {
                expect(mockedBaseErrorClass).toBeCalledWith(
                    "Kafka Error",
                    expect.anything(),
                    expect.anything(),
                    undefined,
                    "local",
                    undefined
                );
            }
        );

        test("Block producer error class must have a static property codes which is an object of all block producer codes",
            () => {
                expect(KafkaError.codes).toEqual({
                    BASE_ERROR: 100,
                    UNKNOWN_CONSUMER_ERR: 2000,
                    CONSUMER_OBSERVER_INVALID: 2001,
                    INVALID_CODER_CONFIG: 2002,
                    UNKNOWN_PRODUCER_ERR: 3000,
                    DELIVERY_TIMED_OUT: 3001
                });
            }
        );
    });

    describe("createUnknown", () => {
        test("static method must return error as is, if an instance of base error",
            () => {
                mockedIsBaseError.mockReturnValue(true);

                expect(KafkaError.createUnknown(kafkaError)).toBe(kafkaError);
            }
        );

        test("If passed variable is an instance of LibrdKafkaError, createErrorObject must not be called",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                KafkaError.createUnknown(connectError);

                expect(mockedCreateErrorObject).not.toHaveBeenCalled();
                expect(BaseError).toHaveBeenCalledTimes(2);
            }
        );

        test("static method must convert any unknown error type to error object by calling createErrorObject",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));

                expect(KafkaError.createUnknown("mock")).toBeInstanceOf(KafkaError);
                expect(mockedCreateErrorObject).toHaveBeenCalledWith("mock");
            }
        );

        test("static method must set error message to be message of the created error object from unknown",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                KafkaError.createUnknown("mock");

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    "mock",
                    expect.anything(),
                    expect.anything()
                );
            }
        );

        test("static method must set origin to 'local' as unknown errors would be thrown locally",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                KafkaError.createUnknown(new Error("mock"), true);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    "local",
                    expect.anything()
                );
            }
        );

        test("static method must error name to 'Kafka consumer error' by default",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                KafkaError.createUnknown(new Error("mock"));

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    "Kafka consumer error",
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        );

        test("static method must error name to 'Kafka producer error' if by default isProducer is set to true",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                KafkaError.createUnknown(new Error("mock"), true);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    "Kafka producer error",
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        );

        test("static method must error code to 2000 by default",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                KafkaError.createUnknown(new Error("mock"));

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    2000,
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        );

        test("static method must error code to 3000 by default if isProducer is set to true",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                KafkaError.createUnknown(new Error("mock"), true);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    3000,
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        );
    });

    describe("convertLibError", () => {
        test("static method must convert passed LibrdKafkaError to Kafka Error without modifying the fields except name",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                KafkaError.convertLibError(connectError);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    -195,
                    true,
                    "Local: Broker transport failure",
                    "kafka",
                    "mock stack string"
                );
            }
        );

        test("static method must error name to 'Kafka consumer error' by default",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                KafkaError.convertLibError(connectError);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    "Kafka consumer error",
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        );

        test("static method must error name to 'Kafka producer error' if by default isProducer is set to true",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                KafkaError.convertLibError(connectError, true);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    "Kafka producer error",
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        );

        test("When LibrdKafkaError.code is not available, code must be set to 2000 default",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                const connectErrorCopy = Object.assign({}, connectError);
                //@ts-ignore
                delete connectErrorCopy.code;
                KafkaError.convertLibError(connectErrorCopy);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    2000,
                    true,
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        );

        test("When LibrdKafkaError.code is not available, code must be set to 3000 if isProducer is true",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                const connectErrorCopy = Object.assign({}, connectError);
                //@ts-ignore
                delete connectErrorCopy.code;
                KafkaError.convertLibError(connectErrorCopy, true);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    3000,
                    expect.anything(),
                    expect.anything(),
                    expect.anything(),
                    expect.anything()
                );
            }
        );
    });
});
