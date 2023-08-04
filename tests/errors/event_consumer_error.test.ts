import { EventConsumerError } from "../../dist/internal/errors/event_consumer_error";
import { createErrorObject } from "../../dist/internal/errors/create_error_object";
import { isBaseError } from "../../dist/internal/errors/is_base_error";
import { BaseError } from "../../dist/internal/errors/base_error";

jest.mock("../../dist/internal/errors/base_error");
jest.mock("../../dist/internal/errors/is_base_error");
jest.mock("../../dist/internal/errors/create_error_object");

describe("Event Consumer Error", () => {
    let eventConsumerError: EventConsumerError;
    let mockedBaseErrorInstance: jest.MockedObject<BaseError>;
    let mockedBaseErrorClass: jest.MockedClass<typeof BaseError>;
    let mockedIsBaseError: jest.MockedFunction<typeof isBaseError>;
    let mockedCreateErrorObject: jest.MockedFunction<typeof createErrorObject>;
    

    beforeEach(() => {
        eventConsumerError = new EventConsumerError();
        mockedBaseErrorClass = BaseError as jest.MockedClass<typeof BaseError>;
        mockedIsBaseError = isBaseError as jest.MockedFunction<typeof isBaseError>;
        mockedCreateErrorObject = createErrorObject as jest.MockedFunction<typeof createErrorObject>;
        mockedBaseErrorInstance = mockedBaseErrorClass.mock.instances[0] as jest.MockedObject<BaseError>;
    });

    describe("Event Consumer Error class", () => {
        test("Event Consumer Error object by default must have 'Event Consumer Error' as name set via super()",
            () => {
                expect(mockedBaseErrorClass).toBeCalledWith(
                    "Event Consumer Error",
                    expect.anything(),
                    expect.anything(),
                    undefined,
                    "local",
                    undefined
                );
            }
        );

        test("Event Consumer Error object by default must have 5000 as error code set via super()",
            () => {
                expect(mockedBaseErrorClass).toBeCalledWith(
                    expect.anything(),
                    5000,
                    expect.anything(),
                    undefined,
                    expect.anything(),
                    undefined
                );
            }
        );

        test("Event Consumer Error class must have a static property codes which is an object of all block producer codes",
            () => {
                expect(EventConsumerError.codes).toEqual({
                    BASE_ERROR: 100,
                    UNKNOWN_ERR: 5000,
                    SAVE_EXECUTE_ERROR: 5001,
                    MAPPING_ERROR: 5002,
                    COMMAND_EXECUTE_ERROR: 5003,
                    INVALID_PARAMS_VALIDATION: 5004
                });
            }
        );
    });

    describe("createUnknown", () => {
        test("static method must return error as is, if an instance of base error",
            () => {
                mockedIsBaseError.mockReturnValue(true);

                expect(EventConsumerError.createUnknown(eventConsumerError)).toBe(eventConsumerError);
            }
        );

        test("static method must convert any unknown error type to error object by calling createErrorObject",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));

                expect(EventConsumerError.createUnknown("mock")).toBeInstanceOf(EventConsumerError);
                expect(mockedCreateErrorObject).toHaveBeenCalledWith("mock");
            }
        );

        test("static method must set error message to be message of the created error object from unknown",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                EventConsumerError.createUnknown("mock");
                
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

        test("static method must set origin to 'local' if isLocal is true",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                EventConsumerError.createUnknown(new Error("mock"), true);

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

        test("static method must set origin to 'remote' if isLocal is false",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                EventConsumerError.createUnknown(new Error("mock"), false);

                expect(mockedBaseErrorClass).toHaveBeenNthCalledWith(
                2,
                expect.anything(),
                expect.anything(),
                expect.anything(),
                expect.anything(),
                "remote",
                expect.anything()
                );
            }
        );
    });
});
