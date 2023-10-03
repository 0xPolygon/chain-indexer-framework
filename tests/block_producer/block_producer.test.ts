import { IProducedBlock, IProducedBlocksModel } from "../../dist/internal/block_producers/produced_blocks_model";
import { AsynchronousProducer } from "../../dist/internal/kafka/producer/asynchronous_producer";
import { ProducedBlocksModel } from "../../dist/internal/block_producers/produced_blocks_model";
import { IBlockProducerConfig } from "../../dist/internal/interfaces/block_producer_config";
import { BlockSubscription } from "../../dist/internal/block_subscription/block_subscription";
import { BlockProducerError } from "../../dist/internal/errors/block_producer_error";
import { BlockProducer } from "../../dist/internal/block_producers/block_producer";
import fullEthereumBlock from "../mock_data/ethereum_full_block.json";
import ethereumBlock from "../mock_data/ethereum_block.json";
import { Logger } from "../../dist/internal/logger/logger";
import { Coder } from "../../dist/internal/coder/protobuf_coder";
import { Database } from "../../dist/internal/mongo/database";
import { Metadata, DeliveryReport } from "node-rdkafka";
import { Queue } from "../../dist/internal/queue/queue";
import EthClass, { Eth, Block } from "web3-eth";
import { IBlockSubscription } from "../../dist/internal/interfaces/block_subscription";
import { IBlock } from "../../dist/internal/interfaces/block";
import { BlockGetter } from "../../dist/internal/block_getters/block_getter";
//@ts-ignore
import LongImport, * as Long from "long";

jest.mock("../../dist/internal/kafka/producer/asynchronous_producer");
jest.mock("../../dist/internal/block_producers/produced_blocks_model");
jest.mock("../../dist/internal/block_subscription/block_subscription");
jest.mock("../../dist/internal/logger/logger");
jest.mock("../../dist/internal/coder/protobuf_coder");
jest.mock("../../dist/internal/mongo/database");
jest.mock("../../dist/internal/queue/queue");
jest.mock("web3-eth");
jest.mock("long");
jest.mock("../../dist/internal/block_getters/block_getter");

describe("Block Producer", () => {
    let mockedBlockSubscriptionClass: jest.MockedClass<typeof BlockSubscription>,
        mockedAsynchronousProducerClass: jest.MockedClass<typeof AsynchronousProducer>,
        mockedDatabaseClass: jest.MockedClass<typeof Database>,
        mockedProducedBlockModel: jest.Mocked<IProducedBlocksModel<IProducedBlock>>,
        mockedDatabaseObject: jest.MockedObject<Database>,
        mockedCoderClass: jest.MockedClass<typeof Coder>,
        mockedLogger: jest.MockedClass<typeof Logger>;

    beforeEach(() => {
        mockedAsynchronousProducerClass = AsynchronousProducer as jest.MockedClass<typeof AsynchronousProducer>;
        mockedBlockSubscriptionClass = BlockSubscription as jest.MockedClass<typeof BlockSubscription>;
        mockedCoderClass = Coder as jest.MockedClass<typeof Coder>;
        mockedDatabaseClass = Database as jest.MockedClass<typeof Database>;
        mockedProducedBlockModel = {
            get: jest.fn(),
            add: jest.fn()
        } as unknown as jest.Mocked<IProducedBlocksModel<IProducedBlock>>;
        mockedLogger = Logger as jest.MockedClass<typeof Logger>;
    });

    describe("Instance", () => {
        let mockedBlockSubscriptionObject: jest.MockedObject<IBlockSubscription<IBlock, BlockProducerError>>,
            mockedAsynchronousProducerObject: jest.MockedObject<AsynchronousProducer>,
            mockedQueueClass: jest.MockedClass<typeof Queue>,
            mockedQueueObject: jest.MockedObject<Queue<IProducedBlock>>,
            mockedBlockGetter: jest.MockedObject<BlockGetter>,
            mockedLongClass: jest.MockedClass<typeof Long>,
            mockedCoderObject: jest.MockedObject<Coder>,
            blockProducer: BlockProducer;

        beforeEach(() => {
            mockedQueueClass = Queue as jest.MockedClass<typeof Queue>;
            mockedLongClass = LongImport;

            mockedBlockSubscriptionObject = new BlockSubscription(
                {} as Eth
            ) as unknown as jest.MockedObject<IBlockSubscription<IBlock, BlockProducerError>>;
            mockedDatabaseObject = new Database("test.url") as jest.MockedObject<Database>;
            mockedCoderObject = new Coder("test", "testpackage", "TestMessage") as jest.MockedObject<Coder>;
            mockedBlockGetter = {
                maxRetries: 4,
                getBlock: jest.fn()
            } as unknown as jest.MockedObject<BlockGetter>;

            blockProducer = new BlockProducer(
                mockedCoderObject,
                { topic: "test" },
                mockedBlockSubscriptionObject,
                mockedBlockGetter,
                mockedDatabaseObject,
                mockedProducedBlockModel
            );

            mockedAsynchronousProducerObject = mockedAsynchronousProducerClass.mock.instances[0] as jest.MockedObject<AsynchronousProducer>;
            mockedQueueObject = mockedQueueClass.mock.instances[0] as jest.MockedObject<Queue<IProducedBlock>>;
            
            mockedProducedBlockModel.get.mockResolvedValue({
                hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07",
                number: 15400000
            });
        });

        describe("constructor", () => {
            test("Must initiate parent class with coder and producer config", () => {
                expect(mockedAsynchronousProducerClass).toBeCalledWith(
                    mockedCoderObject,
                    { topic: "test", "message.max.bytes": 26214400 }
                );
            });
        });

        describe("start", () => {
            test("start when called must start the asynchronous producer", async () => {
                await blockProducer.start();

                expect(mockedAsynchronousProducerObject.start).toBeCalled();
            });

            test("start when called must subscribe to block subscription with the block store in mongo.", async () => {
                await blockProducer.start();

                expect(mockedBlockSubscriptionObject.subscribe).toBeCalledWith({
                    next: expect.anything(),
                    error: expect.anything(),
                    closed: expect.anything()
                },
                    15400000
                );
            });

            test("Start must query mongoDB for latest produced block before starting", async () => {
                await blockProducer.start();

                expect(mockedProducedBlockModel.get).toBeCalledTimes(1);
                expect(mockedProducedBlockModel.get).toBeCalledWith();
            });

            test("If mongo does not return a block, then subscription must be started from start block set.", async () => {
                const blockProducerWithReOrg = new BlockProducer(
                    mockedCoderObject,
                    { topic: "test" },
                    mockedBlockSubscriptionObject,
                    mockedBlockGetter,
                    mockedDatabaseObject,
                    mockedProducedBlockModel,
                    0,
                    3
                );
                mockedProducedBlockModel.get.mockResolvedValueOnce(null);
                mockedProducedBlockModel.get.mockResolvedValueOnce(null);
                await blockProducerWithReOrg.start();

                expect(mockedBlockSubscriptionObject.subscribe)
                    .toBeCalledWith(
                        expect.anything(),
                        0
                    );
            });

            test("If mongo returns previous block and re org depth is more than 0, start block must be next block if after checking chain for hash.", async () => {
                const blockProducerWithReOrg = new BlockProducer(
                    mockedCoderObject,
                    { topic: "test" },
                    mockedBlockSubscriptionObject,
                    mockedBlockGetter,
                    mockedDatabaseObject,
                    mockedProducedBlockModel,
                    0,
                    3
                );
                mockedBlockGetter.getBlock.mockResolvedValueOnce(ethereumBlock as unknown as Block);
                mockedBlockGetter.getBlock.mockResolvedValueOnce({ number: 0 } as Block);
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07",
                    number: 15400000
                });

                await blockProducerWithReOrg.start();

                expect(mockedBlockGetter.getBlock).toBeCalledWith(15400000);
                expect(mockedBlockSubscriptionObject.subscribe)
                    .toBeCalledWith(
                        expect.anything(),
                        15400001
                    );
            });

            test("If latest produced block does not match hash on chain, the block before that must be checked until equal", async () => {
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15400000
                });
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15400000
                });
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07",
                    number: 15399999
                });
                const blockProducerWithReOrg = new BlockProducer(
                    mockedCoderObject,
                    { topic: "test" },
                    mockedBlockSubscriptionObject,
                    mockedBlockGetter,
                    mockedDatabaseObject,
                    mockedProducedBlockModel,
                    0,
                    3
                );

                const olderEthereumBlock = Object.assign({}, ethereumBlock);

                mockedBlockGetter.getBlock.mockResolvedValueOnce(olderEthereumBlock as unknown as Block);
                mockedBlockGetter.getBlock.mockResolvedValueOnce(Object.assign(
                    olderEthereumBlock as unknown as Block,
                    { number: 15399999 }
                ));
                mockedBlockGetter.getBlock.mockResolvedValueOnce({ number: 0 } as Block);

                await blockProducerWithReOrg.start();

                // 3 times including eth.getBlock for latest finalized block.
                expect(mockedBlockGetter.getBlock).toBeCalledTimes(2);
                expect(mockedBlockGetter.getBlock).toHaveBeenNthCalledWith(1, 15400000);
                expect(mockedBlockGetter.getBlock).toHaveBeenNthCalledWith(2, 15399999);
                expect(mockedBlockSubscriptionObject.subscribe)
                    .toBeCalledWith(
                        expect.anything(),
                        15400000
                    );
            });



            test("If mongo does not return a block in middle of check, then subscription must be started from that depth.", async () => {
                const blockProducerWithReOrg = new BlockProducer(
                    mockedCoderObject,
                    { topic: "test" },
                    mockedBlockSubscriptionObject,
                    mockedBlockGetter,
                    mockedDatabaseObject,
                    mockedProducedBlockModel,
                    0,
                    3
                );
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15400000
                });
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15400000
                });
                mockedProducedBlockModel.get.mockResolvedValueOnce(null);

                mockedBlockGetter.getBlock.mockResolvedValueOnce(ethereumBlock as unknown as Block);

                await blockProducerWithReOrg.start();

                expect(mockedBlockSubscriptionObject.subscribe)
                    .toBeCalledWith(
                        expect.anything(),
                        15399999
                    );
            });

            test("If latest produced blocks does not match hash on chain, the block before that must be checked until max re org depth", async () => {
                const blockProducerWithReOrg = new BlockProducer(
                    mockedCoderObject,
                    { topic: "test" },
                    mockedBlockSubscriptionObject,
                    mockedBlockGetter,
                    mockedDatabaseObject,
                    mockedProducedBlockModel,
                    0,
                    3
                );
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15400000
                });
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15400000
                });
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15399999
                });
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15399998
                });
                mockedProducedBlockModel.get.mockResolvedValueOnce({
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb03",
                    number: 15399997
                });

                const olderEthereumBlock = Object.assign({}, ethereumBlock);

                mockedBlockGetter.getBlock.mockResolvedValueOnce(olderEthereumBlock as unknown as Block);
                mockedBlockGetter.getBlock.mockResolvedValueOnce(Object.assign(
                    olderEthereumBlock as unknown as Block,
                    { number: 15399999 }
                ));
                mockedBlockGetter.getBlock.mockResolvedValueOnce(Object.assign(
                    olderEthereumBlock as unknown as Block,
                    { number: 15399998 }
                ));
                mockedBlockGetter.getBlock.mockResolvedValueOnce({ number: 0 } as Block);

                await blockProducerWithReOrg.start();

                expect(mockedBlockGetter.getBlock).toBeCalledTimes(3);
                expect(mockedBlockGetter.getBlock).toHaveBeenNthCalledWith(1, 15400000);
                expect(mockedBlockGetter.getBlock).toHaveBeenNthCalledWith(2, 15399999);
                expect(mockedBlockGetter.getBlock).toHaveBeenNthCalledWith(3, 15399998);
                expect(mockedBlockSubscriptionObject.subscribe)
                    .toBeCalledWith(
                        expect.anything(),
                        15399997
                    );
            });

            test("start on success must return producer metadata.", async () => {
                mockedAsynchronousProducerObject.start.mockResolvedValueOnce(
                    { orig_broker_id: 12 } as Metadata
                );

                await expect(blockProducer.start()).resolves.toEqual(
                    { orig_broker_id: 12 }
                );
            });

            test("start on next block, the block must be produced to producer with right params", async () => {
                //@ts-ignore
                mockedLongClass.fromValue.mockReturnValue({
                    toNumber: jest.fn().mockReturnValueOnce(123),
                    toString: jest.fn().mockReturnValueOnce("123")
                });

                await blockProducer.start();
                await mockedBlockSubscriptionObject.subscribe.mock.calls[0][0].next(fullEthereumBlock as unknown as IBlock);

                expect(mockedAsynchronousProducerObject.produceEvent).toHaveBeenCalledWith(
                    "123",
                    fullEthereumBlock,
                    undefined,
                    undefined,
                    undefined,
                    {
                        number: 123,
                        hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07"
                    }
                );
            });

            test("On fatal thrown by block subscription, it must be restarted and error logged.", async () => {
                await blockProducer.start();
                await mockedBlockSubscriptionObject.subscribe.mock.calls[0][0].error(
                    new BlockProducerError(
                        "Error in block subscription",
                        BlockProducerError.codes.OBSERVER_NOT_SET,
                        true,
                        "Subscription not started with observer.",
                        "local",
                    )
                );

                expect(mockedLogger.error).toBeCalledWith(
                    new BlockProducerError(
                        "Error in block subscription",
                        BlockProducerError.codes.OBSERVER_NOT_SET,
                        true,
                        "Subscription not started with observer.",
                        "local",
                    )
                );
                expect(mockedBlockSubscriptionObject.unsubscribe).toHaveBeenCalled();
                expect(mockedBlockSubscriptionObject.subscribe).toHaveBeenCalled();
            });

            test("On error thrown by restart block subscription, no error must be thrown by producer but logged", async () => {
                mockedBlockSubscriptionObject.unsubscribe.mockRejectedValueOnce(new Error("demo"));
                await blockProducer.start();

                await expect(
                    mockedBlockSubscriptionObject.subscribe.mock.calls[0][0].error(
                        new BlockProducerError(
                            "Error in block subscription",
                            BlockProducerError.codes.OBSERVER_NOT_SET,
                            true,
                            "Subscription not started with observer.",
                            "local",
                        )
                    )).resolves.toBe(undefined);
                expect(mockedLogger.error).toBeCalledWith(
                    new BlockProducerError(
                        "Error in block subscription",
                        BlockProducerError.codes.OBSERVER_NOT_SET,
                        true,
                        "Subscription not started with observer.",
                        "local",
                    )
                );
            });

            test("On fatal thrown by produceEvent, block producer and block subscription must be restarted and incident logged.", async () => {
                mockedAsynchronousProducerObject.produceEvent.mockRejectedValueOnce({ isFatal: true, code: 3001 });
                await blockProducer.start();
                await mockedBlockSubscriptionObject.subscribe.mock.calls[0][0].next(
                    fullEthereumBlock as unknown as IBlock
                );
                await new Promise((resolve) => {
                    setTimeout(() => resolve(true), 300);
                });

                expect(mockedAsynchronousProducerObject.stop).toHaveBeenCalled();
                expect(mockedAsynchronousProducerObject.start).toHaveBeenCalled();
                expect(mockedLogger.error).toBeCalledWith(
                    { isFatal: true, code: 3001 }
                );
                expect(mockedBlockSubscriptionObject.unsubscribe).toHaveBeenCalled();
                expect(mockedBlockSubscriptionObject.subscribe).toHaveBeenCalled();
            });

            test("On erroneous state error, fatal error event must be emitted.", async () => {
                mockedAsynchronousProducerObject.produceEvent.mockRejectedValueOnce({
                    message: "Local: Erroneous state",
                    isFatal: true,
                    code: 3001
                });

                await blockProducer.start();
                await mockedBlockSubscriptionObject.subscribe.mock.calls[0][0].next(
                    fullEthereumBlock as unknown as IBlock
                );
                await new Promise((resolve) => {
                    setTimeout(() => resolve(true), 300);
                });

                expect(mockedAsynchronousProducerObject.stop).toHaveBeenCalled();
                expect(mockedLogger.error).toBeCalledWith({
                    message: "Local: Erroneous state",
                    isFatal: true,
                    code: 3001
                });
                expect(mockedBlockSubscriptionObject.unsubscribe).toHaveBeenCalled();
                expect(mockedAsynchronousProducerObject.emit).toBeCalledWith(
                    "blockProducer.fatalError",
                    {
                        message: "Local: Erroneous state",
                        isFatal: true,
                        code: 3001
                    }
                );
            });

            test("On delivery report, the produced block must be added to mongoDB collection in correct order", (done) => {
                expect.assertions(3);
                mockedAsynchronousProducerObject.produceEvent.mockRejectedValueOnce({ isFatal: true });
                //Mock implementation to change order.
                mockedProducedBlockModel.add.mockImplementationOnce(async () => {
                    await new Promise(resolve => setTimeout(() => {
                        expect(mockedProducedBlockModel.add).toHaveBeenCalledTimes(1);
                        resolve(true);
                    }, 100));
                    return;
                });

                mockedQueueObject.shift.mockReturnValueOnce({
                    number: 15400000,
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07"
                });
                mockedQueueObject.shift.mockReturnValueOnce({
                    number: 15400001,
                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07"
                });
                mockedQueueObject.isEmpty.mockReturnValueOnce(false);
                mockedQueueObject.isEmpty.mockReturnValueOnce(false);
                mockedQueueObject.isEmpty.mockReturnValueOnce(true);

                blockProducer.start().then(() => {
                    //@ts-ignore
                    mockedAsynchronousProducerObject.on.mock.calls[0][1](
                        {
                            opaque: {
                                number: 15400000,
                                hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07"
                            }
                        } as DeliveryReport
                    );
                    //@ts-ignore
                    mockedAsynchronousProducerObject.on.mock.calls[0][1](
                        {
                            opaque: {
                                number: 15400001,
                                hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07"
                            }
                        } as DeliveryReport
                    );

                    setTimeout(() => {
                        try {
                            expect(mockedProducedBlockModel.add).toHaveBeenNthCalledWith(
                                1,
                                {
                                    number: 15400000,
                                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07"
                                },
                                0
                            );
                            expect(mockedProducedBlockModel.add).toHaveBeenNthCalledWith(
                                2,
                                {
                                    number: 15400001,
                                    hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07"
                                },
                                0
                            );
                            done();
                        } catch (error) {
                            //Catch to log the test failure.
                            //https://jestjs.io/docs/asynchronous#:~:text=If%20done()%20is%20never,the%20catch%20block%20to%20done%20.
                            done(error);
                        }
                    }, 300)
                });
            });

            test("On error when adding produced block to mongoDB, no error must be thrown, must be retried upto 5 times and logged", async () => {
                mockedProducedBlockModel.add.mockRejectedValueOnce(
                    new Error("Demo")
                );
                mockedProducedBlockModel.add.mockRejectedValueOnce(
                    new Error("Demo")
                );
                mockedProducedBlockModel.add.mockRejectedValueOnce(
                    new Error("Demo")
                );
                mockedProducedBlockModel.add.mockRejectedValueOnce(
                    new Error("Demo")
                );
                mockedProducedBlockModel.add.mockRejectedValueOnce(
                    new Error("Demo")
                );
                await blockProducer.start();

                //@ts-ignore
                mockedAsynchronousProducerObject.on.mock.calls[0][1](
                    {
                        opaque: {
                            number: 15400000,
                            hash: "0x19823dbf42b70e95e552b48e3df646d2f41b510e20b8ee1878acb18eccbefb07"
                        }
                    } as DeliveryReport
                )

                await new Promise(resolve => setTimeout(() => {
                    resolve(true);
                }, 100));

                expect(mockedProducedBlockModel.add).toBeCalledTimes(5);
                expect(mockedLogger.error).toBeCalledTimes(1);
                expect(mockedLogger.error).toBeCalledWith(
                    BlockProducerError.createUnknown(new Error("Demo"))
                );
            });
        });

        describe("stop", () => {
            test("Stop must call unsubscribe and stop", async () => {
                await blockProducer.stop();

                expect(mockedAsynchronousProducerObject.stop).toHaveBeenCalled();
                expect(mockedBlockSubscriptionObject.unsubscribe).toHaveBeenCalled();
            });

            test("Stop must resolve to true on success", async () => {
                await expect(blockProducer.stop()).resolves.toBe(true);
            });

            test("Throws error Block producer or Kafka error on exception.", async () => {
                mockedAsynchronousProducerObject.stop.mockRejectedValueOnce(new Error("mock"));

                await expect(blockProducer.stop()).rejects.toEqual(BlockProducerError.createUnknown(
                    new Error("mock")
                ));
            });
        });
    });
});
