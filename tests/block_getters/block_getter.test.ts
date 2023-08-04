import { BlockGetter } from "../../dist/internal/block_getters/block_getter";
import EthClass, { Eth, TransactionReceipt, BlockTransactionObject } from "web3-eth";
import ethereumBlock from "../mock_data/ethereum_block.json";
import ethereumFullBlock from "../mock_data/ethereum_full_block.json";
import transactionReceipts from "../mock_data/ethereum_transaction_receipts.json";
import { BlockProducerError } from "../../dist/internal/errors/block_producer_error";
import { BlockFormatter } from "../../dist/internal/formatters/block_formatter";

class MockedBlockFormatter {
    public formatRawReceipt = jest.fn();
    public formatRawTransactionObject = jest.fn();
    public formatRawBlock = jest.fn();
    public formatBlockWithTransactions = jest.fn();
    public formatTransactionObject = jest.fn();
    public formatTransactionReceipt = jest.fn();
}

jest.mock("long");
jest.mock("web3-eth");
jest.mock("../../dist/internal/formatters/block_formatter");

describe("block getter", () => {
    let mockedEthObject: jest.MockedObject<Eth>,
        blockGetter: BlockGetter,
        mockedEthClass: jest.MockedClass<typeof Eth>,
        mockedBlockFormatterClass: jest.MockedClass<typeof BlockFormatter>,
        mockedFormatterObject: MockedBlockFormatter;

    beforeEach(() => {
        mockedEthClass = EthClass as unknown as jest.MockedClass<typeof Eth>;
        mockedEthObject = {
            getBlock: jest.fn().mockReturnValue(ethereumBlock),
            getTransactionReceipt: jest.fn().mockReturnValue(null),
            getBlockNumber: jest.fn()
        } as jest.MockedObject<Eth>;
        mockedBlockFormatterClass = BlockFormatter as jest.MockedClass<typeof BlockFormatter>;
    });

    describe("getBlockWithTransactionReceipts", () => {
        beforeEach(() => {
            blockGetter = new BlockGetter(mockedEthObject, 4);
            mockedFormatterObject = mockedBlockFormatterClass.mock.instances[0] as unknown as MockedBlockFormatter;
        });

        test("getBlockWithTransactionReceipts must get transaction receipts for all transactions", async () => {
            mockedEthObject.getTransactionReceipt.mockResolvedValue(
                transactionReceipts["0x5dadfe7b3b857ec95ce34d56037abbf16da4c1add8a89a1989eb939a7affb150"] as unknown as TransactionReceipt
            );

            await blockGetter.getBlockWithTransactionReceipts(67);
            expect(mockedEthObject.getBlock).toBeCalledWith(67, true);
            expect(mockedEthObject.getTransactionReceipt).toBeCalledTimes(5);
            expect(mockedEthObject.getTransactionReceipt).toHaveBeenNthCalledWith(1, "0x5dadfe7b3b857ec95ce34d56037abbf16da4c1add8a89a1989eb939a7affb150");
            expect(mockedEthObject.getTransactionReceipt).toHaveBeenNthCalledWith(2, "0x05dd0a3761721e857b2a6d743efe4813b87f394dc0a3ad0e12eaea2259771ff1");
            expect(mockedEthObject.getTransactionReceipt).toHaveBeenNthCalledWith(3, "0x63f9daa1f6e5c6684ccd8f21057a76d230329bfdf4a7106d11263c735aa2a004");
            expect(mockedEthObject.getTransactionReceipt).toHaveBeenNthCalledWith(4, "0x9580999365c5c638615c13c22d91ffbead8f46464a0f6981dfd777c4d4b303c2");
            expect(mockedEthObject.getTransactionReceipt).toHaveBeenNthCalledWith(5, "0x188048c014f1c59103c2d7d75151f3df8cc4d6146f0740bec650a48586e931e9");
        });

        test("getBlockWithTransactionReceipts must return formatted block", async () => {
            mockedEthObject.getTransactionReceipt.mockResolvedValue(
                transactionReceipts["0x5dadfe7b3b857ec95ce34d56037abbf16da4c1add8a89a1989eb939a7affb150"] as unknown as TransactionReceipt
            );
            mockedFormatterObject.formatBlockWithTransactions.mockReturnValueOnce(ethereumFullBlock);

            await expect(
                blockGetter.getBlockWithTransactionReceipts(67)
            ).resolves.toEqual(ethereumFullBlock);
            expect(mockedFormatterObject.formatBlockWithTransactions).toBeCalledWith(
                ethereumBlock,
                []
            );
        });

    });

    test("if getTransactionReceipt fails, it retries for specified number of times", async () => {
        mockedEthObject.getTransactionReceipt.mockRejectedValueOnce(new Error())
            .mockRejectedValueOnce(new Error())
            .mockResolvedValue(
                transactionReceipts["0x5dadfe7b3b857ec95ce34d56037abbf16da4c1add8a89a1989eb939a7affb150"] as unknown as TransactionReceipt
            );

        blockGetter = new BlockGetter(mockedEthObject, 2);

        await blockGetter.getBlockWithTransactionReceipts(67);

        expect(mockedEthObject.getBlock).toBeCalledWith(67, true);
        expect(mockedEthObject.getTransactionReceipt).toBeCalledTimes(7);
        expect(mockedEthObject.getTransactionReceipt).toHaveBeenNthCalledWith(1, "0x5dadfe7b3b857ec95ce34d56037abbf16da4c1add8a89a1989eb939a7affb150");
        expect(mockedEthObject.getTransactionReceipt).toHaveBeenNthCalledWith(2, "0x5dadfe7b3b857ec95ce34d56037abbf16da4c1add8a89a1989eb939a7affb150");
        expect(mockedEthObject.getTransactionReceipt).toHaveBeenNthCalledWith(3, "0x5dadfe7b3b857ec95ce34d56037abbf16da4c1add8a89a1989eb939a7affb150");

    });

    test("throws an error if getTransactionReceipt always returns null", async () => {
        blockGetter = new BlockGetter(mockedEthObject, 2);

        await expect(async () => {
            await blockGetter.getBlockWithTransactionReceipts(67);
        }).rejects.toThrow(new BlockProducerError(
            "Block producer error",
            BlockProducerError.codes.RECEIPT_NOT_FOUND,
            false,
            `Transaction receipt not found for ${ethereumBlock.transactions[0].hash}.`,
            "remote"
        ));
    });

    test("get latest block number", async () => {
        blockGetter = new BlockGetter(mockedEthObject, 2);
        mockedEthObject.getBlockNumber.mockResolvedValueOnce(1);

        await expect(blockGetter.getLatestBlockNumber()).resolves.toEqual(1);
        expect(mockedEthObject.getBlockNumber).toBeCalledWith();
    });

    test("get block", async () => {
        blockGetter = new BlockGetter(mockedEthObject, 2);
        mockedEthObject.getBlock.mockResolvedValueOnce(
            ethereumBlock as unknown as BlockTransactionObject
        );

        await expect(blockGetter.getBlock(1)).resolves.toEqual(ethereumBlock);
        expect(mockedEthObject.getBlock).toBeCalledWith(1);
    });
});
