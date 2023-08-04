/**
 * Smaller helper we have added for now.
 * 
 * @param error {unkown}
 * 
 * @returns {String}
 */
export function getErrorMessage(error: unknown): string {
    if (!error) {
        return "Unknown error";
    }

    if (error instanceof Error) return error.message;
    return typeof error === "object" ? JSON.stringify(error) : String(error);
}
