import { BaseError } from "../../dist/internal/errors/base_error";

describe("BaseError", () => {
    let baseErrorCodes: { BASE_ERROR: number};

    beforeEach(() => {
        baseErrorCodes = { BASE_ERROR: 100 };
    });

    test("BaseError.message must be name of the error if the message is not passed.",
        () => {
            expect(new BaseError("mock", 123).message).toBe("mock");
        }
    );

    test("BaseError must have static property codes with error codes related to BaseError",
        () => {
            expect(BaseError.codes).toEqual(baseErrorCodes);
        }
    );

    test("BaseError must have unique identifier to identify all base errors",
        () => {
            expect(new BaseError("mock", 123).identifier).toEqual(baseErrorCodes.BASE_ERROR);
        }
    );

    test("BaseError.message must be message passed to constructor",
        () => {
            expect(new BaseError("mock", 123, false, "mock message").message).toBe("mock message");
        }
    );

    test("Base error stack must be the stack passed to the constructor if passed",
        () => {
            expect(
                new BaseError(
                    "mock",
                    123,
                    false,
                    "mock message",
                    "local",
                    "mock error stack"
                ).stack
            ).toBe("mock error stack");
        }
    );
});
