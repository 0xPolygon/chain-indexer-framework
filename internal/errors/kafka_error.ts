import { isLibrdKafkaError } from "./is_librdkafka_error.js";
import { createErrorObject } from "./create_error_object.js";
import { isBaseError } from "./is_base_error.js";
import { LibrdKafkaError } from "node-rdkafka";
import { BaseError } from "./base_error.js";
import { codes } from "./error_codes.js";

/**
 * KafkaError object used within common.
 */
export class KafkaError extends BaseError {
    /**
     * @param name {string} - The error name
     * @param code {number} - The error code
     * @param isFatal {boolean} - Flag to know if it is a fatal error
     * @param message {string} - The actual error message
     * @param origin {string} - The point this error originated
     * @param stack {string} - The stack trace
     */
    constructor(
        name: string = "Kafka Error",
        code: number,
        isFatal: boolean = false,
        message?: string,
        origin: string = "local",
        stack?: string,
    ) {
        super(name, code, isFatal, message, origin, stack);
    }

    public static codes = {
        ...BaseError.codes,
        ...codes.kafkaclient
    };

    /**
     * Internal method to convert LibKafkaError to KafkaError
     * 
     * @param {LibrdKafkaError} error - The error object to be converted.
     * 
     * @returns {KafkaError} - Returns the kafka error created from the error passed.
     */
    public static convertLibError(error: LibrdKafkaError, isProducer: boolean = false): KafkaError {
       return new KafkaError(
            isProducer ? "Kafka producer error" : "Kafka consumer error",
            error.code || (isProducer ? KafkaError.codes.UNKNOWN_PRODUCER_ERR : KafkaError.codes.UNKNOWN_CONSUMER_ERR),
            error.isFatal,
            error.message,
            error.origin,
            error.stack
        );
    }

    /**
     * Static method that converts any error that is not an instance of BaseError into KafkaError
     * 
     * @param {any} error - Error that needs to be checked and converted.
     * 
     * @returns {KafkaError|BaseError} - Returns either KafkaError or any instance of BaseError
     */
    public static createUnknown(error: any, isProducer: boolean = false): KafkaError | BaseError {
        if (!isBaseError(error)) {
            if (isLibrdKafkaError(error)) {
                return KafkaError.convertLibError(error, isProducer);
            }

            const errorObject = createErrorObject(error);
            return new KafkaError(
                isProducer ? "Kafka producer error" : "Kafka consumer error",
                isProducer ? KafkaError.codes.UNKNOWN_PRODUCER_ERR : KafkaError.codes.UNKNOWN_CONSUMER_ERR,
                true,
                errorObject.message,
                "local",
                errorObject.stack
            );
        }

        return error as KafkaError | BaseError;
    }
}
