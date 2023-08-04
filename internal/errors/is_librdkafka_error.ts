
/**
 * Checks if given error is a LibrdKafkaError. Small helper we might will remove later on.
 * 
 * @param error {unknown}
 * 
 * @returns {boolean}
 */
export function isLibrdKafkaError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        "code" in error &&
        "isFatal" in error &&
        "origin" in error &&
        "stack" in error
    );
}
