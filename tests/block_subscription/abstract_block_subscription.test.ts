import { AbstractBlockSubscription } from "../../dist/internal/block_subscription/abstract_block_subscription";
import { BlockProducerError } from "../../dist/internal/errors/block_producer_error";
import fullEthereumBlock from "../mock_data/ethereum_full_block.json";
import { IBlock } from "../../dist/internal/interfaces/block";
import { Subscription } from "web3-core-subscriptions";
import { Eth, BlockTransactionObject } from "web3-eth";
//@ts-ignore 
import { observer } from "../__mocks__/observer";
import mockLog from "../mock_data/log.json";
import { Log } from "web3-core";
// @ts-ignore
import Long, * as LongClass from "long";

jest.mock("mongoose");
jest.mock("long");

class BlockSubscription extends AbstractBlockSubscription {
    public backFillBlocks = jest.fn()
    public getBlockFromWorker = jest.fn()
}


describe("Abstract Block Subscription", () => {
    let mockedEthObject: jest.MockedObject<Eth>,
        mockedLongClass: jest.MockedClass<typeof LongClass>,
        mockNumber: jest.MockedObject<Long>,
        subscriber: BlockSubscription;


    const on = jest.fn().mockReturnThis();
    const unsubscribe = jest.fn().mockImplementation(
        (cb: (error: Error | null, success: boolean) => void) => {
            cb(null, true);
        }
    );

    beforeEach(() => {
        mockedLongClass = Long;
        mockedEthObject = {
            subscribe: jest.fn().mockReturnValue({
                on,
                unsubscribe
            } as unknown as Subscription<Log>),
            getBlock: jest.fn()
        } as jest.MockedObject<Eth>;

        mockNumber = {
            toNumber: jest.fn().mockReturnValue(0)
        };

        subscriber = new BlockSubscription(
            mockedEthObject,
            60000
        );

        //@ts-ignore
        mockedLongClass.fromValue.mockReturnValue(mockNumber);
    });

    describe("subscribe", () => {
        afterEach(() => {
            subscriber.unsubscribe();
        });

        test("Must call get block(finalized) to determine if backfilling is required", async () => {
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            expect(
                await subscriber.subscribe(observer, 0)
            ).toEqual(undefined);

            expect(mockedEthObject.getBlock).toBeCalledWith("finalized");
        });

        test("Must call get block(latest) to determine if backfilling is required and if block delay is greater than 0", async () => {
            subscriber = new BlockSubscription(
                mockedEthObject,
                60000,
                256
            );
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            expect(
                await subscriber.subscribe(observer, 0)
            ).toEqual(undefined);

            expect(mockedEthObject.getBlock).toBeCalledWith("latest");
        });

        test("If the difference between last block and finalized block is more than 50, log subscription must not be called but backfill", async () => {
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 51 } as BlockTransactionObject);
            expect(
                await subscriber.subscribe(observer, 0)
            ).toEqual(undefined);

            expect(mockedEthObject.subscribe).not.toBeCalled();
            expect(subscriber.backFillBlocks).toBeCalled();
        });

        test("must subscribe to logs when on eth class and return void if difference between finalized block and start block is less than 50", async () => {
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            expect(
                await subscriber.subscribe(observer, 0)
            ).toEqual(undefined);

            expect(mockedEthObject.subscribe).toBeCalled();
        });

        test("subscribe must subscribe to data and error events of log subscription", async () => {
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            await subscriber.subscribe(observer, 0);

            expect(on).toHaveBeenNthCalledWith(1, "data", expect.anything());
            expect(on).toHaveBeenNthCalledWith(2, "error", expect.anything());
            expect(on).toHaveBeenCalledTimes(2);
        });

        test("Subscription must start from start block set if difference to finalized block is less than 50", async () => {
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            await subscriber.subscribe(observer, 0);

            expect(mockedEthObject.subscribe)
                .toBeCalledWith(
                    "logs",
                    { "fromBlock": 0 }
                );
        });

        test("On new log, getBlockFromWorker must be called with block number", (done) => {
            expect.assertions(1);

            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: fullEthereumBlock as unknown as IBlock }
            );

            subscriber.subscribe({
                next: async () => {
                    expect(subscriber.getBlockFromWorker).toBeCalledWith(mockLog.blockNumber);

                    done();
                },
                error: observer.error,
                closed: observer.closed
            },
                0
            ).then(() => {
                on.mock.calls[0][1](mockLog);
            });
        });

        test("If there has been no new block for more than the timeout set, subscribe must be called again.", async () => {
            expect.assertions(3);
            jest.useFakeTimers();
            jest.spyOn(subscriber, "unsubscribe");
            jest.spyOn(subscriber, "subscribe");

            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: fullEthereumBlock as unknown as IBlock }
            );

            await subscriber.subscribe(observer, 0);

            jest.runAllTimers();

            jest.useRealTimers();

            //Adding below to allow async calls to be completed before checking.
            await new Promise((res) => setImmediate(res));

            expect(subscriber.unsubscribe).toBeCalled();
            expect(subscriber.subscribe).toBeCalledTimes(2);
            expect(subscriber.subscribe).toHaveBeenNthCalledWith(
                2,
                observer,
                0
            );
        });

        test("On new log, next must be called with full block data returned by worker", (done) => {
            expect.assertions(1);

            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: fullEthereumBlock as unknown as IBlock }
            );

            subscriber.subscribe({
                next: async (block: IBlock) => {
                    expect(block).toEqual(fullEthereumBlock);
                    done();
                },
                error: observer.error,
                closed: observer.closed
            },
                0
            ).then(() => {
                on.mock.calls[0][1](mockLog);
            });
        });

        test("On new log, if a block is skipped, the skipped block must be enqueued.", (done) => {
            expect.assertions(4);

            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: { ...fullEthereumBlock, number: mockNumber } as unknown as IBlock }
            );
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: { ...fullEthereumBlock, number: mockNumber } as unknown as IBlock }
            );
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: { ...fullEthereumBlock, number: mockNumber } as unknown as IBlock }
            );

            mockNumber.toNumber.mockReturnValueOnce(0);
            mockNumber.toNumber.mockReturnValueOnce(1);
            mockNumber.toNumber.mockReturnValueOnce(2);

            subscriber.subscribe(observer,
                0
            ).then(() => {
                on.mock.calls[0][1]({
                    ...mockLog,
                    blockHash: "1",
                    blockNumber: 0
                });
                on.mock.calls[0][1]({
                    ...mockLog,
                    blockHash: "2",
                    blockNumber: 2
                });
            });

            //Settimeout is added to the assertion behind getblock in the event loop queue.
            setTimeout(() => {
                expect(subscriber.getBlockFromWorker).toBeCalledTimes(3);
                expect(subscriber.getBlockFromWorker).toHaveBeenNthCalledWith(
                    1,
                    0
                );
                expect(subscriber.getBlockFromWorker).toHaveBeenNthCalledWith(
                    2,
                    1
                );
                expect(subscriber.getBlockFromWorker).toHaveBeenNthCalledWith(
                    3,
                    2
                );
                done();
            }, 100);
        });

        test("On a re org being missed, subscription must call observer.error", (done) => {
            expect.assertions(1);

            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: { ...fullEthereumBlock, number: mockNumber, hash: "mockHash_1" } as unknown as IBlock }
            );
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: { ...fullEthereumBlock, number: mockNumber } as unknown as IBlock }
            );

            mockNumber.toNumber.mockReturnValueOnce(0);
            mockNumber.toNumber.mockReturnValueOnce(1);
            mockNumber.toNumber.mockReturnValueOnce(2);

            subscriber.subscribe({
                next: observer.next,
                error: async (error: BlockProducerError) => {
                    expect(error).toEqual(BlockProducerError.createUnknown(
                        new Error("Chain re org not handled.")
                    ));
                    done();
                },
                closed: observer.closed
            },
                0
            ).then(() => {
                on.mock.calls[0][1]({
                    ...mockLog,
                    blockHash: "1",
                    blockNumber: 0
                });
                on.mock.calls[0][1]({
                    ...mockLog,
                    blockHash: "2",
                    blockNumber: 1
                });
            });
        });

        test("Subscribe must call next only once per block.", (done) => {
            expect.assertions(1);

            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: fullEthereumBlock as unknown as IBlock }
            );
            subscriber.getBlockFromWorker.mockResolvedValueOnce(
                { block: fullEthereumBlock as unknown as IBlock }
            );

            subscriber.subscribe(observer, 0).then(() => {
                on.mock.calls[0][1](mockLog);
                on.mock.calls[0][1](mockLog);
            });

            //Settimeout is added to the assertion behind getblock in the event loop queue.
            setTimeout(() => {
                expect(observer.next).toBeCalledTimes(1);
                done();
            }, 100);
        });

        test("On error event thrown by block getter, observer.error must be called with BlockProducerError", (done) => {
            expect.assertions(2);
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
            subscriber.getBlockFromWorker.mockResolvedValueOnce({
                error: new Error("demo")
            });

            subscriber.subscribe(observer, 0).then(() => {
                on.mock.calls[0][1](mockLog);
            });

            setTimeout(() => {
                expect(observer.error).toBeCalledTimes(1);
                expect(observer.error).toBeCalledWith(
                    BlockProducerError.createUnknown(
                        new Error("demo")
                    )
                );

                done();
            }, 100);
        });

        test("On error event by node subscription, observer.error must be called with BlockProducerError", (done) => {
            expect.assertions(2);

            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);

            subscriber.subscribe(observer, 0).then(() => {
                on.mock.calls[1][1](
                    new Error("demo")
                );
            });

            setTimeout(() => {
                expect(observer.error).toBeCalledTimes(1);
                expect(observer.error).toBeCalledWith(
                    BlockProducerError.createUnknown(
                        new Error("demo")
                    )
                );

                done();
            }, 100);
        });

    });

    describe("unsubscribe", () => {
        test("Must resolve to true, when subscription.unsubcribe calls callback with success",
            async () => {
                mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);

                await subscriber.subscribe(observer, 0);

                await expect(
                    subscriber.unsubscribe()
                ).resolves.toBe(true);
            }
        );

        test("Must call clearTimeout",
            async () => {
                mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
                jest.spyOn(global, "clearTimeout");

                await subscriber.subscribe(observer, 0);
                await subscriber.unsubscribe();

                expect(
                    clearTimeout
                ).toBeCalled();
            }
        );

        test("Must throw BlockProducerError, when subscription.unsubscribe calls reports error",
            async () => {
                mockedEthObject.getBlock.mockResolvedValueOnce({ number: 0 } as BlockTransactionObject);
                unsubscribe.mockImplementationOnce(
                    (cb: (error: Error, success: boolean) => void) => {
                        cb(new Error("demo"), false);
                    }
                );

                await subscriber.subscribe(observer, 0);

                await expect(
                    subscriber.unsubscribe()
                ).rejects.toEqual(
                    BlockProducerError.createUnknown(new Error("demo"))
                );
            }
        );
    });
});
