import { ABICoder } from "../../dist/internal/coder/abi_coder";
import {
    decodeParameter,
    decodeParameters,
    decodeLog,
    encodeParameters
} from "web3-eth-abi";

jest.mock("web3-eth-abi");

describe("abi_coder", () => {

    describe("ABICoder", () => {
        test("decodeParameter", () => {
            //@ts-ignore
            decodeParameter.mockReturnValueOnce("mocked_result")
            expect(
                ABICoder.decodeParameter(
                    "mocked_type",
                    "mocked_input"
                )
            ).toEqual("mocked_result")
        });

        test("decodeParameters", () => {
            //@ts-ignore
            decodeParameters.mockReturnValueOnce(["mocked_result"])
            expect(
                ABICoder.decodeParameters(
                    ["mocked_type"],
                    "mocked_input"
                )
            ).toEqual(["mocked_result"])
        });

        test("encodeParameters", () => {
            //@ts-ignore
            encodeParameters.mockReturnValueOnce("mocked_result")
            expect(
                ABICoder.encodeParameters(
                    ["mocked_type"],
                    ["mocked_value"]
                )
            ).toEqual("mocked_result")
        });

        test("decodeLog", () => {
            //@ts-ignore
            decodeLog.mockReturnValueOnce(["mocked_result"])
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
            decodeParameters.mockReturnValueOnce(["mocked_result"])
            expect(
                ABICoder.decodeMethod(
                    ['bytes'],
                    "mocked_input_data"
                )
            ).toEqual(["mocked_result"])
        });
    });
});
