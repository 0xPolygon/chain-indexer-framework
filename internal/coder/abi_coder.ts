import {
    decodeParameter,
    decodeParameters,
    decodeLog,
    encodeParameters
} from "web3-eth-abi";

/**
 * web3 helper class to access any web3 js related functionalities, use this to define any web3 helper functions
 */
export class ABICoder {
    /**
     * @param type {any} - RLP type as eg address
     * @param hex {string} - The bytes string given
     * 
     * @returns {any} - Can return arrays, numbers, objects, etc. depends on the RLP type
     */
    public static decodeParameter(type: any, hex: string): any {
        return decodeParameter(type, hex);
    }

    /**
     * @param types {any[]} - RLP types
     * @param hex {string} - The bytes string given
     * 
     * @returns {any} - Can return an object of arrays, numbers, objects, etc. depends on the RLP type
     */
    public static decodeParameters(types: any[], hex: string): { [key: string]: any } {
        return decodeParameters(types, hex);
    }

    /**
     * @param types {any[]} - RLP types
     * @param values {string[]} - The array of values
     * 
     * @returns {any} - return hex string
     */
    public static encodeParameters(types: any[], values: string[]): string {
        return encodeParameters(types, values);
    }

    /**
     * // TODO: Overtake private type from web3.js or submit PR
     * 
     * @param inputs {AbiInput[]} - ABI objects
     * @param hex {string} - bytes given from log.data
     * @param topics {string[]} - Indexed topics
     * 
     * @returns 
     */
    public static decodeLog(inputs: any[], hex: string, topics: string[]): { [key: string]: string } {
        return decodeLog(inputs, hex, topics) as unknown as { [key: string]: string };
    }

    /**
     * decode method
     * 
     * @param {any[]} types - function name
     * @param {string} data - input Data
     * 
     * @returns {{ [key: string]: any }}
     */
    public static decodeMethod(types: any[], data: string): { [key: string]: any } {
        return decodeParameters(types, "0x" + data.slice(10));
    }
}
