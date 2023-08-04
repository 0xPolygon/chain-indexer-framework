export interface ICoder {
    deserialize: (
        buffer: Buffer,
        messageType?: string,
        packageName?: string
    ) => Promise<object | Error>,
    serialize: (
        messageObject: object,
        messageType?: string,
        packageName?: string
    ) => Promise<Uint8Array | Error>
}
