import { BaseError } from "./base_error.js";

/**
 * Check if the given error is BaseError. Small helper we might will remove later on.
 * 
 * @param error {unknown} 
 * 
 * @returns {boolean}
 */
export function isBaseError(error: unknown): boolean {
    return (
        //@ts-ignore
        typeof error === "object" && error !== null &&  "identifier" in error && error.identifier === BaseError.codes.BASE_ERROR
    );
}
