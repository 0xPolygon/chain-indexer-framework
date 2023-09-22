import { CoderError } from "../../dist/internal/errors/coder_error";
import { Coder } from "../../dist/internal/coder/protobuf_coder";
import Long from "long";
import protobufjs, { Type, Root, Writer, Message } from "protobufjs";

jest.mock("protobufjs");


describe("Protobuf Coder", () => {
    let coder: Coder,
    protobuf: jest.Mocked<typeof protobufjs>,
    protobufType: jest.Mocked<Type>,
    protobufRoot: jest.Mocked<Root>,
    protobufWriter: jest.Mocked<Writer>;

    const mockBuffer: Buffer = Buffer.from(
        [0x08, 0xbb, 0xaa, 0x8e, 0x88, 0xe8, 0x9e, 0x84, 0x91, 0x11, 0x12, 0x04, 0x64, 0x65, 0x6d, 0x6f]
    );
    const mockMessageObject = {
        number: Long.fromValue("1234567898765432123", true),
        string: "demo"
    };

    beforeEach(() => {
        protobuf = protobufjs as jest.Mocked<typeof protobufjs>;
        protobufType = new Type("Block") as jest.Mocked<Type>;
        protobufRoot = new Root() as jest.Mocked<Root>;
        protobufWriter = new Writer() as jest.Mocked<Writer>;
        coder = new Coder("test", "testpackage", "Test");

        protobuf.load.mockResolvedValue(protobufRoot);
        protobufRoot.lookupType.mockReturnValue(protobufType);
    });

    describe("serialize()", () => {
        test("Must return serialised buffer", async () => {
            protobufType.encode.mockReturnValueOnce(protobufWriter);
            protobufWriter.finish.mockReturnValueOnce(mockBuffer);

            await expect(
                coder.serialize(mockMessageObject)
            ).resolves.toEqual(mockBuffer);
            expect(protobufType.verify).toBeCalledWith(mockMessageObject);
            expect(protobufType.encode).toBeCalledWith(mockMessageObject);
            expect(protobufWriter.finish).toBeCalled();
        });

        test("On failure to find schema coder error must be thrown", async () => {
            protobuf.load.mockRejectedValueOnce(
                new Error(
                    "no such type: wrongpackage.Test"
                )
            );

            await expect(
                coder.serialize(mockMessageObject)
            ).rejects.toEqual(
                new CoderError(
                    "Coder error",
                    CoderError.codes.INVALID_PATH_PROTO,
                    true,
                    "no such type: wrongpackage.Test"
                )
            );
        });

        test("On failure to verify message as per schema, verification error must be thrown",
            async () => {
                protobufType.verify.mockReturnValueOnce(
                    "string: string expected"
                );

                await expect(coder.serialize({
                    number: 123,
                    wrongField: "demo"
                })).rejects.toEqual(
                    new CoderError(
                        "Message verification failed",
                        CoderError.codes.ENCODING_VERIFICATION_FAILED,
                        false,
                        "string: string expected"
                    ));
            });
    });

    describe("deserialize()", () => {
        test("Must return deserialised object", async () => {
            protobufType.decode.mockReturnValueOnce(
                mockMessageObject as unknown as Message
            );

            await expect(
                coder.deserialize(mockBuffer)
            ).resolves.toEqual(mockMessageObject);
            expect(protobufType.decode).toBeCalledWith(mockBuffer);
        });

        test("On failure to find schema coder error must be thrown", async () => {
            protobuf.load.mockRejectedValueOnce(
                new Error(
                    "no such type: wrongpackage.Test"
                )
            );

            await expect(
                coder.deserialize(mockBuffer)
            ).rejects.toEqual(
                new CoderError(
                    "Coder error",
                    CoderError.codes.INVALID_PATH_PROTO,
                    true,
                    "no such type: wrongpackage.Test"
                )
            );
        });

        test("On failure to deserialise message as per schema, decoding error must be thrown",
            async () => {
                protobufType.decode.mockImplementationOnce(() => {
                    throw new Error("invalid wire type 4 at offset 4");
                });

                await expect(
                    coder.deserialize(Buffer.from(
                        [0x09, 0x8b, 0x12, 0x04, 0x64, 0x65, 0x6d, 0x6f]
                    ))
                ).rejects.toEqual(
                    new CoderError(
                        "Decoding error",
                        CoderError.codes.DECODING_ERROR,
                        true,
                        "invalid wire type 4 at offset 4"
                    )
                );
            });
    });

    describe("custom loadType: schemaPath", () => {
        test("Must accept custom schemaPath", async () => {

            const customCoder = new Coder("test", "testpackage", "Test", "@maticnetwork/chain-indexer-framework/schemas")

            protobufType.decode.mockReturnValueOnce(
                mockMessageObject as unknown as Message
            );

            await expect(
                customCoder.deserialize(mockBuffer)
            ).resolves.toEqual(mockMessageObject);
            expect(protobufType.decode).toBeCalledWith(mockBuffer);
        });
    });
});
