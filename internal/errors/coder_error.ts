import { BaseError } from "./base_error.js";
import { codes } from "./error_codes.js";

/**
 * Error type specific to coder errors
 */
export class CoderError extends BaseError {
    public static codes = {
        ...BaseError.codes,
        ...codes.coder
    };

    /**
     * @param name {string} - The error name
     * @param code {number} - The error code
     * @param isFatal {boolean} - Flag to know if it is a fatal error
     * @param message {string} - The actual error message
     * @param stack {string} - The stack trace
     */
    constructor(
        name: string = "Coder Error",
        code: number = CoderError.codes.UNKNOWN_CODER_ERR,
        isFatal: boolean = false,
        message?: string,
        stack?: string
    ) {
        super(name, code, isFatal, message, "local", stack);
    }
}