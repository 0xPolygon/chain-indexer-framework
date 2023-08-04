import { BlockPoller } from "../../dist/internal/block_subscription/block_polling";
import { BlockGetter } from "../../dist/internal/block_getters/block_getter";
//@ts-ignore
import { blockData } from "../mock_data/zkevm_block";
import { BlockProducerError } from "../../dist/internal/errors/block_producer_error";
import { Eth } from "web3-eth";

jest.mock("web3-eth");
jest.mock("../../dist/internal/block_getters/block_getter");
jest.useFakeTimers();

let blockPoller: BlockPoller,
    blockGetter: jest.Mocked<BlockGetter>;

const observer = {
    next: jest.fn().mockReturnThis(),
    error: jest.fn().mockReturnThis(),
    closed: jest.fn().mockReturnThis()
};

describe("Block Polling when latest block is more than start block", () => {
    const startBlock = 59;

    beforeEach(() => {
        blockGetter = new BlockGetter({} as string) as jest.Mocked<BlockGetter>;
    });

    test("test the subscribe method", async () => {
        blockGetter.getBlock.mockResolvedValue(blockData);
        blockGetter.getLatestBlockNumber.mockResolvedValue(60);

        blockPoller = new BlockPoller(
            blockGetter,
            2000
        );

        let counter = 0;
        observer.next = jest.fn((data) => {
            if (counter == 0) {
                expect(blockData).toEqual(data);
                expect(blockGetter.getLatestBlockNumber).toHaveBeenCalledTimes(1);
                expect(blockGetter.getBlock).toHaveBeenCalledTimes(1);
                expect(blockGetter.getBlock).toHaveBeenNthCalledWith(1, 59);
            }

            if (counter == 1) {
                expect(blockData).toEqual(data);

                expect(blockGetter.getBlock).toHaveBeenCalledTimes(2);
                expect(blockGetter.getBlock).toHaveBeenNthCalledWith(2, 60);

                blockPoller.unsubscribe();
            }

            if (counter == 2) {
                throw new Error("Invalid execution flow!");
            }

            counter++;
        });

        await blockPoller.subscribe(observer, startBlock);
    });

    test("test if the error is being thrown", async () => {
        jest.useRealTimers();

        blockGetter.getLatestBlockNumber.mockRejectedValue(new BlockProducerError("error while getting the latest block"));
        blockPoller = new BlockPoller(
            blockGetter,
            2000
        );
        
        await blockPoller.subscribe(observer, 0);
        await new Promise(resolve => setImmediate(resolve));
        await blockPoller.unsubscribe();
        
        expect(observer.error).toHaveBeenCalledWith(
            new BlockProducerError("error while getting the latest block")
        );
    });

});

describe("Block Polling when latest block is less than start block", () => {
    const startBlock = 61;

    beforeEach(() => {
        blockGetter = new BlockGetter({} as string) as jest.Mocked<BlockGetter>;
        blockGetter.getBlock.mockResolvedValueOnce(blockData);
        blockGetter.getLatestBlockNumber.mockResolvedValueOnce(60);

        blockPoller = new BlockPoller(
            blockGetter,
            2000
        );
    });

    test("test the start method", async () => {
        blockPoller.subscribe(observer, startBlock);

        expect(blockGetter.getLatestBlockNumber).toHaveBeenCalledTimes(1);
        blockPoller.unsubscribe();

    });

    test("test the stop method", async () => {
        blockPoller.subscribe(observer, startBlock);
        blockPoller.unsubscribe();
        expect(blockGetter.getLatestBlockNumber).toHaveBeenCalledTimes(1);
    });
});
