import { ABICoder } from "../../dist/internal/coder/abi_coder";
import AbiCoder from "web3-eth-abi";

jest.mock("web3-eth-abi");

describe("abi_coder", () => {
    let abiCoderObject: jest.MockedObject<typeof AbiCoder>

    beforeEach(() => {
        abiCoderObject = AbiCoder as jest.MockedObject<typeof AbiCoder>;
    });

    describe("ABICoder", () => {
        test("decodeParameter", () => {
            //@ts-ignore
            abiCoderObject.decodeParameter.mockReturnValueOnce("mocked_result")
            expect(
                ABICoder.decodeParameter(
                    "mocked_type",
                    "mocked_input"
                )
            ).toEqual("mocked_result")
        });

        test("decodeParameters", () => {
            //@ts-ignore
            abiCoderObject.decodeParameters.mockReturnValueOnce(["mocked_result"])
            expect(
                ABICoder.decodeParameters(
                    ["mocked_type"],
                    "mocked_input"
                )
            ).toEqual(["mocked_result"])
        });

        test("encodeParameters", () => {
            //@ts-ignore
            abiCoderObject.encodeParameters.mockReturnValueOnce("mocked_result")
            expect(
                ABICoder.encodeParameters(
                    ["mocked_type"],
                    ["mocked_value"]
                )
            ).toEqual("mocked_result")
        });

        test("decodeLog", () => {
            //@ts-ignore
            abiCoderObject.decodeLog.mockReturnValueOnce(["mocked_result"])
            expect(
                ABICoder.decodeLog(
                    ["mocked_input"],
                    "mocked_hex",
                    ["mocked_topics"]
                )
            ).toEqual(["mocked_result"])
        });

        test("decodeMethod", () => {
            //@ts-ignore
            abiCoderObject.decodeParameters.mockReturnValueOnce(["mocked_result"])
            expect(
                ABICoder.decodeMethod(
                    ['bytes'],
                    "mocked_input_data"
                )
            ).toEqual(["mocked_result"])
        });
    });
});
