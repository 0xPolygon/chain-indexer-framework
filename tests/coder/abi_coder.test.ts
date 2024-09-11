import { ABICoder } from "../../dist/internal/coder/abi_coder";
import {
    decodeParameter as decodeSingleParam,
    decodeParameters as decodeMultipleParams,
    decodeLog as decodeSingleLog,
    encodeParameters as encodeMultipleParams
} from "web3-eth-abi";

jest.mock("web3-eth-abi");

describe("abi_coder", () => {

    describe("ABICoder", () => {
        test("decodeParameter", () => {
            //@ts-ignore
            decodeSingleParam.mockReturnValueOnce("mocked_result")
            expect(
                ABICoder.decodeParameter(
                    "mocked_type",
                    "mocked_input"
                )
            ).toEqual("mocked_result")
        });

        test("decodeParameters", () => {
            //@ts-ignore
            decodeMultipleParams.mockReturnValueOnce(["mocked_result"])
            expect(
                ABICoder.decodeParameters(
                    ["mocked_type"],
                    "mocked_input"
                )
            ).toEqual(["mocked_result"])
        });

        test("encodeParameters", () => {
            //@ts-ignore
            encodeMultipleParams.mockReturnValueOnce("mocked_result")
            expect(
                ABICoder.encodeParameters(
                    ["mocked_type"],
                    ["mocked_value"]
                )
            ).toEqual("mocked_result")
        });

        test("decodeLog", () => {
            //@ts-ignore
            decodeSingleLog.mockReturnValueOnce(["mocked_result"])
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
            decodeMultipleParams.mockReturnValueOnce(["mocked_result"])
            expect(
                ABICoder.decodeMethod(
                    ['bytes'],
                    "mocked_input_data"
                )
            ).toEqual(["mocked_result"])
        });
    });
});
