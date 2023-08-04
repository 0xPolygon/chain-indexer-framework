import { QuickNodeBlockGetter } from "../../dist/internal/block_getters/quicknode_block_getter";
import { BlockGetter } from "../../dist/internal/block_getters/block_getter";
import EthClass, { Eth } from "web3-eth";
import ethereumBlock from "../mock_data/ethereum_block.json";
import ethereumFullBlock from "../mock_data/ethereum_full_block.json";
import transactionReceipts from "../mock_data/ethereum_transaction_receipts_array.json";
import { WebsocketProvider } from "web3-core";
import { IBlock } from "../../dist/internal/interfaces/block";
import rawBlock from "../mock_data/raw_ethereum_block.json";
import utils from "web3-utils";

const mockedFormatterObject = {
    formatRawReceipt: jest.fn(),
    formatRawTransactionObject: jest.fn(),
    formatRawBlock: jest.fn()
}

//Manual mock required for protected eth object.
jest.mock("../../dist/internal/block_getters/block_getter", () => {
    return {
        BlockGetter: jest.fn().mockImplementation(function (ethObject, maxRetries) {
            //@ts-ignore
            this.eth = ethObject;

            //@ts-ignore
            this.maxRetries = maxRetries;

            //@ts-ignore
            this.formatTransactionObject = jest.fn();

            //@ts-ignore
            this.getTransactionReceipt = jest.fn();

            //@ts-ignore
            this.formatRawBlock = mockedFormatterObject.formatRawBlock;

            //@ts-ignore
            this.formatRawTransactionObject = mockedFormatterObject.formatRawTransactionObject;

            //@ts-ignore
            this.formatRawReceipt = mockedFormatterObject.formatRawReceipt;

            //@ts-ignore
            return this;
        })
    }
});
jest.mock("web3-core-helpers");
jest.mock("web3-eth");
jest.mock("long");
jest.mock("web3-utils");

describe("Quick node block getter", () => {
    jest.useFakeTimers();

    let qnBlockGetter: QuickNodeBlockGetter,
        mockedEthClass: jest.MockedClass<typeof Eth>,
        mockedBlockGetterClass: jest.MockedClass<typeof BlockGetter>,
        mockedEthObject: jest.MockedObject<Eth>,
        mockedBlockGetter: jest.MockedObject<BlockGetter>,
        mockedWeb3Utils: jest.MockedObject<typeof utils>,
        mockedBlockFormatterObject: jest.MockedObject<typeof mockedFormatterObject>;

    beforeEach(() => {
        mockedEthClass = EthClass as unknown as jest.MockedClass<typeof Eth>;
        mockedEthObject = {
            getBlock: jest.fn().mockReturnValue(ethereumBlock),
            getTransactionReceipt: jest.fn().mockReturnValue(null),
            getBlockNumber: jest.fn(),
            currentProvider: {
                send: jest.fn()
            }
        } as unknown as jest.MockedObject<Eth>;
    });

    describe("getBlockWithTransactionReceipts", () => {
        beforeEach(() => {
            mockedBlockGetterClass = BlockGetter as jest.MockedClass<typeof BlockGetter>;
            qnBlockGetter = new QuickNodeBlockGetter(mockedEthObject);

            mockedWeb3Utils = utils as jest.MockedObject<typeof utils>;
            mockedBlockGetter = mockedBlockGetterClass.mock.instances[0] as jest.MockedObject<BlockGetter>;
            mockedBlockFormatterObject = mockedFormatterObject;
        });

        test("getBlockWithTransactionReceipts must convert the received response", async () => {
            mockedWeb3Utils.numberToHex.mockReturnValueOnce("0x0");
            (mockedEthObject.currentProvider as jest.Mocked<WebsocketProvider>).send.mockImplementationOnce((event, handler) => {
                handler(
                    null,
                    {
                        result: {
                            block: rawBlock,
                            receipts: transactionReceipts
                        },
                        jsonrpc: "2.0",
                        id: "mock_id"
                    });

            });

            await qnBlockGetter.getBlockWithTransactionReceipts(67);

            expect(mockedWeb3Utils.numberToHex).toBeCalledWith(67);
            expect(mockedBlockFormatterObject.formatRawBlock).toBeCalledWith(rawBlock, []);
            //@ts-ignore
            expect(mockedBlockFormatterObject.formatRawTransactionObject).toBeCalledTimes(rawBlock.transactions.length);
            expect(mockedBlockFormatterObject.formatRawReceipt).toBeCalledTimes(rawBlock.transactions.length);

            expect(
                (mockedEthObject.currentProvider as jest.Mocked<WebsocketProvider>).send
            ).toBeCalledWith(
                {
                    id: expect.anything(),
                    method: "qn_getBlockWithReceipts",
                    params: ["0x0"],
                    jsonrpc: "2.0"
                },
                expect.anything()
            );
        });

        test("getBlockWithTransactionReceipts must return the right values", async () => {
            //@ts-ignore
            mockedBlockFormatterObject.formatRawBlock.mockReturnValueOnce(ethereumFullBlock);

            mockedWeb3Utils.numberToHex.mockReturnValueOnce("0x0");
            (mockedEthObject.currentProvider as jest.Mocked<WebsocketProvider>).send.mockImplementationOnce((event, handler) => {
                handler(null,
                    {
                        result: {
                            block: ethereumBlock,
                            receipts: transactionReceipts
                        },
                        jsonrpc: "2.0",
                        id: "mock_id"
                    });

            });

            await expect(qnBlockGetter.getBlockWithTransactionReceipts(67)).resolves.toEqual(
                ethereumFullBlock
            );
        });

        test("getBlockWithTransactionReceipts must reject with error if response takes more than 45 seconds", async () => {
            mockedWeb3Utils.numberToHex.mockReturnValueOnce("0x0");

            try {
                const promise: Promise<IBlock> = qnBlockGetter.getBlockWithTransactionReceipts(67);

                jest.runAllTimers();

                await promise;
            } catch (error) {
                expect(error).toEqual(
                    new Error(`Request timed out for block: 67`)
                );
            };
        });
    });

    describe("getBlockWithTransactionReceipts - retries", () => {
        beforeEach(() => {
            mockedBlockGetterClass = BlockGetter as jest.MockedClass<typeof BlockGetter>;
            qnBlockGetter = new QuickNodeBlockGetter(mockedEthObject, 5);

            //@ts-ignore
            mockedWeb3Utils = utils;
            mockedBlockGetter = mockedBlockGetterClass.mock.instances[0] as jest.MockedObject<BlockGetter>;
        });

        test("getBlockWithTransactionReceipts must retry upto max retry times on error", async () => {
            mockedWeb3Utils.numberToHex.mockReturnValueOnce("0x0");
            (mockedEthObject.currentProvider as jest.Mocked<WebsocketProvider>).send.mockImplementation((event, handler) => {
                handler(
                    new Error("mock_error"),
                    {
                        result: null,
                        jsonrpc: "2.0",
                        id: "mock_id"
                    }
                );
            });

            await expect(qnBlockGetter.getBlockWithTransactionReceipts(67)).rejects.toEqual(
                new Error("mock_error")
            );
            expect(
                (mockedEthObject.currentProvider as jest.Mocked<WebsocketProvider>).send
            ).toBeCalledTimes(6);
        });
    });
});
