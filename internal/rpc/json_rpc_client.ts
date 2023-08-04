import { IRPCPayload } from "../interfaces/rpc_payload.js";
import axios from "axios";

/**
 * A utility class to make RPC calls to the given node URL.
 */
export class JSONRPCClient {

    /**
     * @constructor
     * 
     * @param {string} url - The url of the node to make RPC call.
     */
    constructor(
        private url: string
    ) {}

    /**
     * Method to make an rpc call
     * 
     * @param {IRPCPayload} payload
     * 
     * @returns {Promise<any>}
     */
    public async call<T>(payload: IRPCPayload): Promise<T> {
        const response = await axios.post(
            this.url,
            {
                jsonrpc: "2.0",
                id: new Date().getTime(),
                method: payload.method,
                params: payload.params ?? []
            }
        );

        return response.data.result;
    }
}
