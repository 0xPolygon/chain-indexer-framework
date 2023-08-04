import { BlockGetter } from "../../dist/internal/block_getters/block_getter";
import fullEthereumBlock from "../mock_data/ethereum_full_block.json";
import { IBlock } from "../../dist/internal/interfaces/block";
import { parentPort } from "worker_threads";
import EthClass, { Eth } from "web3-eth";

jest.mock("../../dist/internal/block_getters/block_getter");
jest.mock("web3-eth");
jest.mock("worker_threads", () => {
    return {
        parentPort: {
            on: jest.fn(),
            postMessage: jest.fn()
        },
        workerData: {
            endpoint: "mock_endpoint",
            maxRetries: 5
        },

        threadId: 1
    }
});

describe("Block getter worker", () => {
    let mockedBlockGetterClass: jest.MockedClass<typeof BlockGetter>,
        mockedParentPort: jest.Mocked<typeof parentPort>,
        mockedEthClass: jest.MockedClass<typeof Eth>,
        mockedEthObject: jest.MockedObject<Eth>;

    let mockedBlockGetterObject: jest.MockedObject<BlockGetter> = {
        getBlockWithTransactionReceipts: jest.fn()
    } as jest.MockedObject<BlockGetter>;

    describe("with worker data and parent port", () => {
        beforeEach(async () => {
            jest.resetModules();

            mockedBlockGetterClass = (
                await import("../../dist/internal/block_getters/block_getter")
            ).BlockGetter as jest.MockedClass<typeof BlockGetter>;
            mockedParentPort = (
                await import("worker_threads")
            ).parentPort as jest.Mocked<typeof parentPort>;
            mockedEthClass = EthClass as unknown as jest.MockedClass<typeof Eth>;
            mockedEthObject = {
                getBlock: jest.fn(),
                getTransactionReceipt: jest.fn(),
                getBlockNumber: jest.fn()
            } as jest.MockedObject<Eth>;
            

            //@ts-ignore
            mockedEthClass.mockReturnValue(mockedEthObject);
            mockedBlockGetterClass.mockReturnValue(mockedBlockGetterObject);

            //@ts-ignore
            await import("../../dist/internal/block_getters/block_getter_worker");
        });

        test("creates block getter class on import", () => {
            expect(mockedBlockGetterClass).toBeCalledWith({}, 5)
        });

        test("calls parentPort.on to register call handler", () => {
            expect(mockedParentPort?.on).toBeCalledWith("message", expect.anything());
        });

        test("on message, calls getBlockWithTransactionReceipts on block getter", () => {
            mockedParentPort?.on.mock.calls[0][1]({
                blockNumber: 123,
                callBackId: 1234
            });

            expect(mockedBlockGetterObject.getBlockWithTransactionReceipts).toBeCalledWith(123)
        });

        test("on error, sends error object to parent", async () => {
            mockedBlockGetterObject.getBlockWithTransactionReceipts.mockRejectedValueOnce(
                new Error("mock")
            )
            await mockedParentPort?.on.mock.calls[0][1]({
                blockNumber: 123,
                callBackId: 1234
            });

            expect(mockedParentPort?.postMessage).toBeCalledWith({
                callBackId: 1234,
                error: new Error("mock")
            })
        });

        test("Sends full block to parent on success", async () => {
            mockedBlockGetterObject.getBlockWithTransactionReceipts.mockResolvedValueOnce(fullEthereumBlock as unknown as IBlock);
            await mockedParentPort?.on.mock.calls[0][1]({
                blockNumber: 123,
                callBackId: 1234
            });

            expect(mockedParentPort?.postMessage).toBeCalledWith({
                block: fullEthereumBlock, 
                error: null,
                callBackId: 1234
            })
        });
    });

    describe("process.exit handling", () => {
        let mockedExit: jest.SpiedFunction<typeof process.exit>;

        beforeEach(async () => {
            jest.resetModules();
            jest.doMock("worker_threads", () => {
                return {
                    parentPort: undefined,
                    workerData: {
                        endpoint: "mock_endpoint",
                        maxRetries: 5
                    },

                    threadId: null
                }
            });

            mockedBlockGetterClass = (
                await import("../../dist/internal/block_getters/block_getter")
            ).BlockGetter as jest.MockedClass<typeof BlockGetter>;

            mockedParentPort = (
                await import("worker_threads")
            ).parentPort as jest.Mocked<typeof parentPort>;
            
            mockedExit = jest.spyOn(process, 'exit').mockImplementation(
                //@ts-ignore
                (code) => { } // Need to add tsignore as return type is 'never'
            );

            //@ts-ignore
            mockedBlockGetterClass.mockReturnValue(mockedBlockGetterObject);
            
            //Try catch added to ignore the uncaught error of process not ending as it is mocked.
            try {
            //@ts-ignore
            await import("../../dist/internal/block_getters/block_getter_worker");
            } catch { }
        });

        test("must call process.exits", () => {
            expect(mockedExit).toBeCalledWith(1);
        });
    });
});
