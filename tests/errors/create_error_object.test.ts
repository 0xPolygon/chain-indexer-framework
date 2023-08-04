import { createErrorObject } from "../../dist/internal/errors/create_error_object";

describe("Errors - create error object", () => {
    const tests = [
        0,
        "string",
        {
            string: "string",
            number: 0
        }
    ];

    test("Must return object without modification, if an instance of Error class",
        () => {
            const error: Error = new Error("demo");
            expect(createErrorObject(error)).toBe(error);
        }
    );

    test("Must return object without modification, if an instance of TypeError class",
        () => {
            const error: TypeError = new TypeError("demo");
            expect(createErrorObject(error)).toBe(error);
        }
    );

    tests.forEach((item) => test("Must return error object", () => {
        expect(createErrorObject(item)).toBeInstanceOf(Error);
    }));
});
