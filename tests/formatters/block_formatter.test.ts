import { formatters } from "web3-core-helpers";
// @ts-ignore
import LongImport, * as LongClass from "long";
import transactionReceiptArray from "../mock_data/ethereum_transaction_receipts_array.json";
import ethereumBlock from "../mock_data/ethereum_block.json";
import ethereumFullBlock from "../mock_data/ethereum_full_block.json";
import { BlockFormatter } from "../../dist/internal/formatters/block_formatter";
import { TransactionReceipt } from "web3-core";
import { ITransactionReceipt } from "../../dist/internal/interfaces/transaction_receipt";
import { IWeb3Transaction } from "../../dist/internal/interfaces/web3_transaction";
import { ITransaction } from "../../dist/internal/interfaces/transaction";
import { BlockTransactionObject } from "web3-eth";
import { IRawReceipt } from "../../dist/internal/interfaces/raw_receipt";
import { IRawTransaction } from "../../dist/internal/interfaces/raw_transaction";
import { IRawBlock } from "../../dist/internal/interfaces/raw_block";
import * as utils from "web3-utils";

jest.mock("web3-core-helpers");
jest.mock("web3-utils");
jest.mock("long");

class ExtendBlockFormatter extends BlockFormatter {
    public formatRawReceipt(receipt?: IRawReceipt) {
        return super.formatRawReceipt(receipt);
    }
    public formatRawTransactionObject(transaction: IRawTransaction, receipt: ITransactionReceipt) {
        return super.formatRawTransactionObject(transaction, receipt);
    }
    public formatRawBlock(block: IRawBlock, transactions: ITransaction[]) {
        return super.formatRawBlock(block, transactions);
    }
    public formatBlockWithTransactions(block: BlockTransactionObject, transactions: ITransaction[]) {
        return super.formatBlockWithTransactions(block, transactions);
    }
    public formatTransactionObject(transactionObject: IWeb3Transaction, receipt: ITransactionReceipt) {
        return super.formatTransactionObject(transactionObject, receipt);
    }
    public formatTransactionReceipt(transactionReceipt: TransactionReceipt) {
        return super.formatTransactionReceipt(transactionReceipt);
    }
}

describe("BlockFormatter", () => {
    let mockedFormattersObject: jest.MockedClass<typeof formatters>,
        mockedUtilsObject: jest.MockedObject<typeof utils>,
        mockedLong: jest.MockedClass<typeof LongClass>,
        blockFormatter: ExtendBlockFormatter;

    beforeEach(() => {
        mockedUtilsObject = utils as jest.MockedObject<typeof utils>;
        mockedLong = LongImport as jest.MockedClass<typeof LongClass>;
        mockedFormattersObject = formatters as jest.MockedClass<typeof formatters>;
        blockFormatter = new ExtendBlockFormatter();

        mockedUtilsObject.toHex.mockReturnValue("0x809aa8");
        //@ts-ignore
        mockedLong.fromValue.mockReturnValue({
            "high": 0,
            "low": 0,
            "unsigned": true
        })
    });

    describe("formatTransactionReceipt", () => {
        test("must convert to correct types", () => {
            expect(
                blockFormatter.formatTransactionReceipt(transactionReceiptArray[0] as unknown as TransactionReceipt)
            ).toEqual(ethereumFullBlock.transactions[0].receipt);
        });

        test("must not convert effectiveGasPrice if undefined", () => {
            expect(
                blockFormatter.formatTransactionReceipt(
                    {
                        ...(transactionReceiptArray[0]),
                        effectiveGasPrice: undefined
                    } as unknown as TransactionReceipt
                )
            ).toEqual(
                expect.objectContaining({
                    ...(ethereumFullBlock.transactions[0].receipt),
                    effectiveGasPrice: undefined
                })
            );
        });
    });

    describe("formatTransactionObject", () => {
        test("must convert to correct types", () => {
            expect(
                blockFormatter.formatTransactionObject(
                    ethereumBlock.transactions[0] as unknown as IWeb3Transaction,
                    ethereumFullBlock.transactions[0].receipt as unknown as ITransactionReceipt
                )
            ).toEqual(
                expect.objectContaining(
                    ethereumFullBlock.transactions[0]
                )
            );
        });

        test("must not convert transaction index if null", () => {
            expect(
                blockFormatter.formatTransactionObject(
                    {
                        ...(ethereumBlock.transactions[0]),
                        transactionIndex: null
                    } as unknown as IWeb3Transaction,
                    ethereumFullBlock.transactions[0].receipt as unknown as ITransactionReceipt
                )
            ).toEqual(
                expect.objectContaining({
                    ...(ethereumFullBlock.transactions[0]),
                    transactionIndex: null
                })
            );
        });

        test("must convert maxFeePerGas and maxPriorityFeePerGas if not null", () => {
            expect(
                blockFormatter.formatTransactionObject(
                    {
                        ...(ethereumBlock.transactions[0]),
                        maxFeePerGas: "0x809aa8",
                        maxPriorityFeePerGas: "0x809aa8"
                    } as unknown as IWeb3Transaction,
                    ethereumFullBlock.transactions[0].receipt as unknown as ITransactionReceipt
                )
            ).toEqual(
                expect.objectContaining({
                    ...(ethereumFullBlock.transactions[0]),
                    maxFeePerGas: "0x809aa8",
                    maxPriorityFeePerGas: "0x809aa8"
                })
            );
        });

        test("must not convert blockNumber if null", () => {
            expect(
                blockFormatter.formatTransactionObject(
                    {
                        ...(ethereumBlock.transactions[0]),
                        blockNumber: null
                    } as unknown as IWeb3Transaction,
                    ethereumFullBlock.transactions[0].receipt as unknown as ITransactionReceipt
                )
            ).toEqual(
                expect.objectContaining({
                    ...(ethereumFullBlock.transactions[0]),
                    blockNumber: null
                })
            );
        });
    });

    describe("formatBlockWithTransactions", () => {
        test("must convert to correct types", () => {
            mockedUtilsObject.hexToNumberString.mockReturnValueOnce("mock_number");

            expect(
                blockFormatter.formatBlockWithTransactions(
                    ethereumBlock as unknown as BlockTransactionObject,
                    ethereumFullBlock.transactions as unknown as ITransaction[]
                )
            ).toEqual(
                expect.objectContaining(
                    ethereumFullBlock
                )
            );
            expect(mockedLong.fromValue).toHaveBeenNthCalledWith(
                1,
                "mock_number",
                true
            );
        });

        test("must convert baseFeePerGas to undefined if value is undefined", () => {
            expect(
                blockFormatter.formatBlockWithTransactions(
                    {
                        ...ethereumBlock,
                        baseFeePerGas: undefined
                    } as unknown as BlockTransactionObject,
                    ethereumFullBlock.transactions as unknown as ITransaction[]
                )
            ).toEqual(
                expect.objectContaining(
                    {
                        ...ethereumFullBlock,
                        baseFeePerGas: undefined
                    }
                )
            );
        });
    });

    describe("formatRawReceipt", () => {
        test("must convert to correct types", () => {
            mockedUtilsObject.hexToNumber.mockReturnValueOnce(1234);
            mockedUtilsObject.hexToNumber.mockReturnValueOnce(0);
            mockedUtilsObject.hexToNumber.mockReturnValueOnce(1);
            mockedUtilsObject.hexToNumber.mockReturnValueOnce(1234);
            //@ts-ignore
            mockedFormattersObject.outputLogFormatter.mockReturnValueOnce(
                transactionReceiptArray[0].logs[0]
            )

            expect(
                blockFormatter.formatRawReceipt({
                    ...transactionReceiptArray[0], 
                    effectiveGasPrice: "0x809aa8", 
                    status: "0x1"
                } as unknown as IRawReceipt)
            ).toEqual(ethereumFullBlock.transactions[0].receipt);
            expect(utils.hexToNumber).toBeCalledTimes(4);
            expect(mockedFormattersObject.outputLogFormatter).toBeCalledTimes(1);
        });

        test("must return void if transaction receipt is undefined", () => {
            expect(
                blockFormatter.formatRawReceipt(undefined)
            ).toEqual(undefined);
        })
    });

    describe("formatRawTransactionObject", () => {
        test("must convert to correct types", () => {
            //@ts-ignore
            mockedFormattersObject.outputTransactionFormatter.mockReturnValueOnce(
                ethereumBlock.transactions[0]
            );

            expect(
                blockFormatter.formatRawTransactionObject(
                    {} as IRawTransaction,
                    ethereumFullBlock.transactions[0].receipt as unknown as ITransactionReceipt
                )
            ).toEqual(
                expect.objectContaining(
                    ethereumFullBlock.transactions[0]
                )
            );
        });
    });

    describe("formatRawBlock", () => {
        test("must convert to correct types", () => {
            //@ts-ignore
            mockedFormattersObject.outputBlockFormatter.mockReturnValueOnce(
                ethereumBlock
            );

            expect(
                blockFormatter.formatRawBlock(
                    {} as IRawBlock,
                    ethereumFullBlock.transactions as unknown as ITransaction[]
                )
            ).toEqual(
                expect.objectContaining(
                    ethereumFullBlock
                )
            );
        })
    });
});
