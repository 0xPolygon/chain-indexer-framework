import { codes } from "./error_codes.js";

/**
 * BaseError used within the micro services that guarantees we don't loose the stack trace.
 */
export class BaseError extends Error {
    /**
     * @param name {string} - The error name
     * @param code {number} - The error code
     * @param isFatal {boolean} - Flag to know if it is a fatal error
     * @param message {string} - The actual error message
     * @param origin {string} - The point this error originated
     * @param stack {string} - The stack trace
     */
    constructor(
        public name: string,
        public code: number,
        public isFatal: boolean = false,
        message?: string,
        public origin?: string,
        public stack?: string,
    ) {
        super(message || name);
        
        if (stack) {
            this.stack = stack;
        }
    }

    public static codes = codes.base;
    public identifier: number = BaseError.codes.BASE_ERROR;
}
