/**
 * Small helper we have added for now.
 * 
 * @param error {unknown}
 * 
 * @returns {Error|TypeError}
 */
export function createErrorObject(error: unknown): Error|TypeError {
   if (error instanceof Error || error instanceof TypeError) {
       return error;
   }

   return new Error(String(error));
}
