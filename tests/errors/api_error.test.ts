import { createErrorObject } from "../../dist/internal/errors/create_error_object";
import { isBaseError } from "../../dist/internal/errors/is_base_error";
import { BaseError } from "../../dist/internal/errors/base_error";
import { ApiError } from "../../dist/internal/errors/api_error";

jest.mock("../../dist/internal/errors/base_error");
jest.mock("../../dist/internal/errors/is_base_error");
jest.mock("../../dist/internal/errors/create_error_object");

describe("ApiError", () => {
    let apiError: ApiError,
    mockedBaseErrorInstance: jest.MockedObject<BaseError>,
    mockedBaseErrorClass: jest.MockedClass<typeof BaseError>,
    mockedIsBaseError: jest.MockedFunction<typeof isBaseError>,
    mockedCreateErrorObject: jest.MockedFunction<typeof createErrorObject>;

    beforeEach(() => {
        apiError = new ApiError();
        mockedBaseErrorClass = BaseError as jest.MockedClass<typeof BaseError>;
        mockedIsBaseError = isBaseError as jest.MockedFunction<typeof isBaseError>;
        mockedCreateErrorObject = createErrorObject as jest.MockedFunction<typeof createErrorObject>;
        mockedBaseErrorInstance = mockedBaseErrorClass.mock.instances[0] as jest.MockedObject<BaseError>;
    });

    describe("Api error class", () => {
        test("Api error object by default must have 'Api error' as name set via super()",
            () => {
                expect(mockedBaseErrorClass).toBeCalledWith(
                    "Internal server error",
                    expect.anything(),
                    expect.anything(),
                    undefined,
                    "local",
                    undefined
                );
            }
        );

        test("Api error object by default must have 500 as error code set via super()",
            () => {
                expect(mockedBaseErrorClass).toBeCalledWith(
                    expect.anything(),
                    500,
                    expect.anything(),
                    undefined,
                    expect.anything(),
                    undefined
                );
            }
        );

        test("Api error class must have a static property codes which is an object of all block producer codes",
            () => {
                expect(ApiError.codes).toEqual({
                    BASE_ERROR: 100,
                    BAD_REQUEST: 400,
                    NOT_FOUND: 404,
                    SERVER_ERROR: 500
                });
            }
        );
    });

    describe("createUnknown", () => {
        test("static method must return error as is, if an instance of base error",
            () => {
                mockedIsBaseError.mockReturnValue(true);

                expect(ApiError.createUnknown(apiError)).toBe(apiError);
            }
        );

        test("static method must convert any unknown error type to error object by calling createErrorObject",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));

                expect(ApiError.createUnknown("mock")).toBeInstanceOf(ApiError);
                expect(mockedCreateErrorObject).toHaveBeenCalledWith("mock");
            }
        );

        test("static method must set error message to be message of the created error object from unknown",
            () => {
                mockedIsBaseError.mockReturnValueOnce(false);
                mockedCreateErrorObject.mockReturnValueOnce(new Error("mock"));
                ApiError.createUnknown("mock");

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
                ApiError.createUnknown(new Error("mock"), true);

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
                ApiError.createUnknown(new Error("mock"), false);

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
