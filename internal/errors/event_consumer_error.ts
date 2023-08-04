import { createErrorObject } from "./create_error_object.js";
import { isBaseError } from "./is_base_error.js";
import { BaseError } from "./base_error.js";
import { codes } from "./error_codes.js";

/**
 * Error type specific to event consumer errors
 */
export class EventConsumerError extends BaseError {
    public static codes = {
        ...BaseError.codes,
        ...codes.eventConsumer
    };

    /**
     * @param name {string} - The error name
     * @param code {number} - The error code
     * @param isFatal {boolean} - Flag to know if it is a fatal error
     * @param message {string} - The actual error message
     * @param origin {string} - The point this error originated
     * @param stack {string} - The stack trace
     */
    constructor(
        name: string = "Event Consumer Error",
        code: number = EventConsumerError.codes.UNKNOWN_ERR,
        isFatal: boolean = false,
        message?: string,
        origin: string = "local",
        stack?: string
    ) {
        super(name, code, isFatal, message, origin, stack);
    }

    /**
 * Static method that converts any error that is not an instance of BaseError into BlockProducerError
 * 
 * @param {any} error - Error that needs to be checked and converted.
 * 
 * @returns {BlockProducerError|BaseError} - Returns either BlockProducer or any instance of BaseError
 */
    public static createUnknown(error: any, isLocal: boolean = true): EventConsumerError | BaseError {
        if (!isBaseError(error)) {
            const errorObject = createErrorObject(error);

            return new EventConsumerError(
                "Event Consumer Error",
                EventConsumerError.codes.UNKNOWN_ERR,
                true,
                errorObject.message,
                isLocal ? "local" : "remote",
                errorObject.stack
            );
        }

        return error;
    }
}
