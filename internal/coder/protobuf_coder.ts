import { getErrorMessage } from "../errors/get_error_message.js";
import { CoderError } from "../errors/coder_error.js";
import protobuf, { Root, Type } from "protobufjs";
import { ICoder } from "../interfaces/coder.js";
import { createRequire } from "module";
const { load } = protobuf;

/**
 * The deserialiser class provides simple and straighforward methods to load and deserialise a buffer based on 
 * protobuf schemas.
 * 
 * @author - Vibhu Rajeev
 */
export class Coder implements ICoder {
    private protobufType?: Type;
    private loadPromise?: Promise<Type>;

    /**
     * @param {string} fileName - The file for finding the protobuf type.  
     * @param {string} packageName - The default package where the protobuf type is defined. 
     * @param {string} messageType - The default protobuf message type to be used for deserialising. 
     * @param {string} [fileDirectory] - Optional: The custom path for loading the protobuf type. 
     */
    constructor(
        private fileName: string,
        private packageName: string,
        private messageType: string,
        private fileDirectory: string = "@maticnetwork/chain-indexer-framework/schemas"
    ) { }

    /**
     * Public method to load the proto message type from file. 
     * This method must always be called before calling the deserialize or serialize method. 
     * 
     * @returns {Promise<Type>} - Returns "true" if the load was successfull.
     * 
     * @throws {CoderError} - Throws an error if the load failed. 
     */
    private async loadType(): Promise<Type> {
        try {
            if (!this.loadPromise) {
                this.loadPromise = load(
                    // https://nodejs.org/api/esm.html#no-requireresolve - Alternative for require.resolve
                    // @ts-ignore
                    createRequire(import.meta.url).resolve(`${this.fileDirectory}/${this.fileName}.proto`)
                ).then((root: Root) => {
                    return root.lookupType(`${this.packageName}.${this.messageType}`);
                });
            }

            return await this.loadPromise;
        } catch (error) {
            const message = getErrorMessage(error);
            throw new CoderError(
                "Coder error",
                CoderError.codes.INVALID_PATH_PROTO,
                true,
                message
            );
        }
    }

    /**
     * This is the main method of the class, to deserialise a given 
     * buffer value. If the package name and protobuf type is not passed, default values are used. 
     * 
     * @param {Buffer} buffer - Buffer to be deserialised. 
     * 
     * @returns {Promise<object>} - Decoded object of the buffer passed. 
     * 
     * @throws {CoderError} - Throws error on failure to find protobuf type definition at the path specified.
     */
    public async deserialize(buffer: Buffer): Promise<object> {
        if (!this.protobufType) {
            this.protobufType = await this.loadType();
        }

        try {
            return this.protobufType.decode(buffer);
        } catch (error) {
            throw new CoderError(
                "Decoding error",
                CoderError.codes.DECODING_ERROR,
                true,
                getErrorMessage(error)
            );
        }
    }

    /**
    * This is the main method of the class, to deserialise a given 
    * buffer value. If the package name and protobuf type is not passed, default values are used. 
    * 
    * @param {object} messageObject - Message object to be serialised. 
    * 
    * @returns {Promise<Uint8Array | CoderError>} - Serialised buffer of the passed object. 
    * 
    * @throws {CoderError} - Throws error object on verification failure or if failure in finding protobuf type definition.
    */
    public async serialize(messageObject: object): Promise<Uint8Array | CoderError> {
        if (!this.protobufType) {
            this.protobufType = await this.loadType();
        }

        const verificationError = this.protobufType.verify(messageObject);
        if (verificationError) {
            throw new CoderError(
                "Message verification failed",
                CoderError.codes.ENCODING_VERIFICATION_FAILED,
                false,
                verificationError
            );
        }

        return this.protobufType.encode(messageObject).finish();
    }
}
