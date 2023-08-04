import { BlockSubscription } from "../../dist/internal/block_subscription/block_subscription";
import { BlockProducerError } from "../../dist/internal/errors/block_producer_error";
import fullEthereumBlock from "../mock_data/ethereum_full_block.json";
import { IBlock } from "../../dist/internal/interfaces/block";
import { Subscription } from "web3-core-subscriptions";
import { Eth, BlockTransactionObject } from "web3-eth";
//@ts-ignore 
import { observer } from "../__mocks__/observer";
import { Worker } from "worker_threads";
import { Log } from "web3-core";

jest.mock("worker_threads");
jest.mock("mongoose");
jest.mock("long");

class ExtendedBlockSubscription extends BlockSubscription {
    public backFillBlocks() {
        return super.backFillBlocks();
    }

    public getBlockFromWorker(number: number, workerId: number) {
        return super.getBlockFromWorker(number, workerId);
    }
}

describe("Block Subscription", () => {
    let mockedEthObject: jest.MockedObject<Eth>,
        mockedWorkerClass: jest.MockedClass<typeof Worker>;

    const on = jest.fn().mockReturnThis();
    const unsubscribe = jest.fn().mockImplementation(
        (cb: (error: Error | null, success: boolean) => void) => {
            cb(null, true);
        }
    );

    beforeEach(() => {
        mockedWorkerClass = Worker as jest.MockedClass<typeof Worker>;
        mockedEthObject = {
            subscribe: jest.fn().mockReturnValue({
                on,
                unsubscribe,
            } as unknown as Subscription<Log>),
            getBlock: jest.fn()
        } as jest.MockedObject<Eth>;
    });

    describe("constructor", () => {
        let multiThreadedSubscriber: ExtendedBlockSubscription;

        test("must create as many workers as number of RPC urls passed", () => {
            multiThreadedSubscriber = new ExtendedBlockSubscription(
                mockedEthObject,
                ["mock_endpoint", "mock_endpoint", "mock_endpoint"],
                0,
                "block_getter"
            );
            expect(mockedWorkerClass).toBeCalledTimes(3);
        });

        test("must not create workers if no RPC passed.", () => {
            multiThreadedSubscriber = new ExtendedBlockSubscription(
                mockedEthObject,
                [],
                0,
                "block_getter"
            );
            expect(mockedWorkerClass).toBeCalledTimes(0);
        });

        test("if one of workers exit, new one must be created in their place.", () => {
            multiThreadedSubscriber = new ExtendedBlockSubscription(
                mockedEthObject,
                ["mock_endpoint"],
                0,
                "block_getter"
            );
            const mockedWorker: jest.MockedObject<Worker> = mockedWorkerClass.mock.instances[0] as jest.MockedObject<Worker>;
            mockedWorker.on.mock.calls[0][1]();

            expect(mockedWorkerClass).toBeCalledTimes(2);
        });

        test("Must create the worker with right default params", () => {
            multiThreadedSubscriber = new ExtendedBlockSubscription(
                mockedEthObject,
                ["mock_endpoint"],
                undefined,
                undefined
            );

            expect(mockedWorkerClass).toBeCalledWith(
                require.resolve("../../dist/internal/block_getters/block_getter_worker"),
                {
                    workerData: {
                        endpoint: "mock_endpoint",
                        maxRetries: 0
                    }
                }
            );
        });
    });

    describe("getBlockFromWorker", () => {
        let mockedFirstWorker: jest.MockedObject<Worker>,
            mockedThirdWorker: jest.MockedObject<Worker>,
            multiThreadedSubscriber: ExtendedBlockSubscription;

        beforeEach(() => {
            multiThreadedSubscriber = new ExtendedBlockSubscription(
                mockedEthObject,
                ["mock_endpoint", "mock_endpoint", "mock_endpoint"],
                0,
                "block_getter"
            );
            mockedFirstWorker = mockedWorkerClass.mock.instances[0] as jest.MockedObject<Worker>;
            mockedThirdWorker = mockedWorkerClass.mock.instances[2] as jest.MockedObject<Worker>;
        });

        test("must post message to the right worker as per worker Id", async () => {
            mockedThirdWorker.on.mockImplementationOnce((event, listener) => {
                if (event === 'message') {
                    setImmediate(() => {
                        //TODO - Mock the callBackId set so test does not fail here.
                        listener({
                            callBackId: mockedThirdWorker.postMessage.mock.calls[0][0].callBackId,
                            block: fullEthereumBlock
                        });
                    });
                };

                return mockedThirdWorker;
            });

            await multiThreadedSubscriber.getBlockFromWorker(0, 2);

            expect(mockedThirdWorker.postMessage).toBeCalledWith({
                blockNumber: 0,
                callBackId: expect.anything()
            });
            expect(mockedFirstWorker.postMessage).not.toBeCalled();
        });

        test("must resolve with block returned by worker.", async () => {
            mockedThirdWorker.on.mockImplementationOnce((event, listener) => {
                if (event === 'message') {
                    setImmediate(() => {
                        listener({
                            callBackId: mockedThirdWorker.postMessage.mock.calls[0][0].callBackId,
                            block: fullEthereumBlock
                        });
                    });
                };

                return mockedThirdWorker;
            });

            await expect(
                multiThreadedSubscriber.getBlockFromWorker(0, 2)
            ).resolves.toEqual({
                block: fullEthereumBlock,
                error: null
            });
        });

        test("must resolve with error object if worker returns error for that block", async () => {
            mockedThirdWorker.on.mockImplementationOnce((event, listener) => {
                setImmediate(() => {
                    //TODO - Mock the callBackId set so test does not fail here.
                    listener({
                        callBackId: mockedThirdWorker.postMessage.mock.calls[0][0].callBackId,
                        error: new Error("mock")
                    });
                });
                return mockedThirdWorker;
            });

            await expect(
                multiThreadedSubscriber.getBlockFromWorker(0, 2)
            ).resolves.toEqual(
                expect.objectContaining({
                    error: new Error("mock")
                })
            );
        });

        test("must reject error with if worker exits", async () => {
            mockedThirdWorker.on.mockImplementationOnce((event, listener) => {
                return mockedThirdWorker;
            });
            mockedThirdWorker.on.mockImplementationOnce((event, listener) => {
                if (event === 'error') {
                    listener(new Error("mock"));
                };

                return mockedThirdWorker;
            });

            await expect(
                multiThreadedSubscriber.getBlockFromWorker(0, 2)
            ).resolves.toEqual(
                expect.objectContaining({
                    error: new Error("mock")
                })
            );
        });
    });

    describe("backfill", () => {
        let mockedWorker: jest.MockedObject<Worker>,
            subscriber: ExtendedBlockSubscription;

        beforeEach(() => {
            subscriber = new ExtendedBlockSubscription(
                mockedEthObject,
                ["mock_endpoint"],
                0,
                "block_getter"
            );

            mockedWorker = mockedWorkerClass.mock.instances[0] as jest.MockedObject<Worker>;
            mockedWorker.on.mockReset();
        });

        test("Backfilling must stop if unsubscribe has been called.", (done) => {
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 51 } as BlockTransactionObject);
            mockedWorker.on.mockImplementation((event, listener) => {
                if (event === 'message') {
                    setImmediate(() => {
                        //TODO - Mock the callBackId set so test does not fail here.
                        listener({
                            callBackId: mockedWorker.postMessage.mock.calls[0][0].callBackId,
                            block: fullEthereumBlock
                        });
                    });
                    setImmediate(() => done())
                };

                return mockedWorker;
            });
            subscriber.subscribe(observer, 0).then(() => {
                subscriber.unsubscribe();
            });

            expect(observer.next).not.toBeCalled();
        });

        test("Backfilling must call next with full block data upto finalized block", (done) => {
            expect.assertions(52);
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 51 } as BlockTransactionObject);
            let nextBlock: number = 0;
            mockedWorker.on.mockImplementation((event, listener) => {
                if (event === 'message') {
                    setImmediate(() => {
                        //TODO - Mock the callBackId set so test does not fail here.
                        listener({
                            callBackId: mockedWorker.postMessage.mock.calls[nextBlock][0].callBackId,
                            block: fullEthereumBlock
                        });
                        nextBlock++
                    });
                };

                return mockedWorker;
            });

            let eventNumber: number = 0;
            subscriber.subscribe({
                next: async (block: IBlock) => {
                    eventNumber++;
                    expect(block).toEqual(fullEthereumBlock);
                    if (eventNumber >= 52) {
                        done();
                    }
                },
                error: observer.error,
                closed: observer.closed
            },
                0
            );

        });

        test("Backfilling must call next with full block data in order even with order of promises changed upto finalized block", (done) => {
            expect.assertions(52);
            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 51 } as BlockTransactionObject);
            let nextBlock: number = 0;
            mockedWorker.on.mockImplementationOnce((event, listener) => {
                if (event === 'message') {
                    const callNumber = nextBlock;
                    setImmediate(() => {
                        listener({
                            callBackId: 123,
                            block: fullEthereumBlock
                        });

                        listener({
                            callBackId: mockedWorker.postMessage.mock.calls[callNumber][0].callBackId,
                            block: fullEthereumBlock
                        });
                    });

                    nextBlock++
                };

                return mockedWorker;
            });

            mockedWorker.on.mockImplementation((event, listener) => {
                if (event === 'message') {
                    const callNumber = nextBlock;
                    setImmediate(() => {
                        //TODO - Mock the callBackId set so test does not fail here.
                        listener({
                            callBackId: mockedWorker.postMessage.mock.calls[callNumber][0].callBackId,
                            block: fullEthereumBlock
                        });
                    });

                    nextBlock++
                };

                return mockedWorker;
            });

            let eventNumber: number = 0;
            subscriber.subscribe({
                next: async (block: IBlock) => {
                    eventNumber++;
                    expect(block).toEqual(fullEthereumBlock);
                    if (eventNumber >= 52) {
                        done();
                    }
                },
                error: observer.error,
                closed: observer.closed
            },
                0
            );

        });

        test("On error while backfilling, observer.error must be called with block producer error", (done) => {
            expect.assertions(2);

            mockedEthObject.getBlock.mockResolvedValueOnce({ number: 51 } as BlockTransactionObject);
            mockedWorker.on.mockImplementationOnce((event, listener) => {
                if (event === 'error') {
                    listener(
                        new Error("Mock")
                    );
                };

                return mockedWorker;
            });
            mockedWorker.on.mockImplementationOnce((event, listener) => {
                if (event === 'error') {
                    listener(
                        new Error("Mock")
                    );
                };

                return mockedWorker;
            });

            subscriber.subscribe(observer, 0);

            setImmediate(() => {
                expect(observer.error).toBeCalledTimes(1);
                expect(observer.error).toBeCalledWith(
                    BlockProducerError.createUnknown(
                        new Error("Mock")
                    )
                );
                done()
            });
        });
    });
});
