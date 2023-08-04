import { CoderError } from "../../dist/internal/errors/coder_error";
import { BaseError } from "../../dist/internal/errors/base_error";

jest.mock("../../dist/internal/errors/base_error");
jest.mock("../../dist/internal/errors/is_base_error");
jest.mock("../../dist/internal/errors/create_error_object");

describe("Coder Error", () => {
    let coderError: CoderError;
    let mockedBaseErrorClass: jest.MockedClass<typeof BaseError>;


    beforeEach(() => {
        coderError = new CoderError();
        mockedBaseErrorClass = BaseError as jest.MockedClass<typeof BaseError>;
    });

    test("coder error by default must have 'Coder Error' as name set via super()",
        () => {
            expect(mockedBaseErrorClass).toBeCalledWith(
                "Coder Error",
                expect.anything(),
                expect.anything(),
                undefined,
                "local",
                undefined
            );
        }
    );

    test("coder error by default must have 1000 as error code set via super()",
        () => {
            expect(mockedBaseErrorClass).toBeCalledWith(
                expect.anything(),
                1000,
                expect.anything(),
                undefined,
                expect.anything(),
                undefined
            );
        }
    );

    test("coder error must always set origin to 'local'",
        () => {
            expect(mockedBaseErrorClass).toBeCalledWith(
                expect.anything(),
                expect.anything(),
                expect.anything(),
                undefined,
                "local",
                undefined
            );
        }
    );

    test("Block producer must have a static property codes which is an object of all block producer codes",
        () => {
            expect(CoderError.codes).toEqual({
                BASE_ERROR: 100,
                UNKNOWN_CODER_ERR: 1000,
                INVALID_PATH_PROTO: 1001,
                INVALID_PATH_TYPE: 1002,
                DECODING_ERROR: 1003,
                ENCODING_VERIFICATION_FAILED: 1004
            });
        }
    );
});
