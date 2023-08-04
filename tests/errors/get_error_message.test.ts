import { getErrorMessage } from "../../dist/internal/errors/get_error_message";

describe("Errors - get error message", () => {
    test("Must return error message when error object is passed",
        () => {
            expect(getErrorMessage(new Error("demo"))).toBe("demo");
        }
    );

    test("Must return string as error message if passed variable is not instance of Error",
        () => {
            expect(getErrorMessage("error")).toBe("error");
            expect(getErrorMessage(123)).toBe("123");
            expect(getErrorMessage({
                code: 123
            })).toBe("{\"code\":123}");
        }
    );
});
