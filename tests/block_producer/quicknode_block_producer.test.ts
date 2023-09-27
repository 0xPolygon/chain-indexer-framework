import { QuickNodeBlockProducer } from "../../dist/public/block_producers/quicknode_block_producer";
import { AsynchronousProducer } from "../../dist/internal/kafka/producer/asynchronous_producer";
import { ProducedBlocksModel } from "../../dist/internal/block_producers/produced_blocks_model";
import { QuickNodeBlockGetter } from "../../dist/internal/block_getters/quicknode_block_getter";
import { BlockSubscription } from "../../dist/internal/block_subscription/block_subscription";
import { IBlockProducerConfig } from "../../dist/internal/interfaces/block_producer_config";
import { Coder } from "../../dist/internal/coder/protobuf_coder";
import { Database } from "../../dist/internal/mongo/database";
import { Logger } from "../../dist/internal/logger/logger";
import EthClass, { Eth } from "web3-eth";

jest.mock("../../dist/internal/kafka/producer/asynchronous_producer");
jest.mock("../../dist/internal/block_producers/produced_blocks_model");
jest.mock("../../dist/internal/block_subscription/block_subscription");
jest.mock("../../dist/internal/block_getters/quicknode_block_getter");
jest.mock("../../dist/internal/logger/logger");
jest.mock("../../dist/internal/coder/protobuf_coder");
jest.mock("../../dist/internal/mongo/database");
jest.mock("web3-eth");

describe("Block Producer", () => {
    let mockedBlockSubscriptionClass: jest.MockedClass<typeof BlockSubscription>,
        mockedAsynchronousProducerClass: jest.MockedClass<typeof AsynchronousProducer>,
        mockedDatabaseClass: jest.MockedClass<typeof Database>,
        mockedDatabaseObject: jest.MockedObject<Database>,
        mockedCoderClass: jest.MockedClass<typeof Coder>,
        mockedLogger: jest.MockedClass<typeof Logger>,
        mockBlockProducerConfig: IBlockProducerConfig,
        mockedEthClass: jest.MockedClass<typeof Eth>,
        mockedProducedBlockSchema: jest.MockedObject<typeof ProducedBlocksModel>,
        mockedBlockGetter: jest.MockedClass<typeof QuickNodeBlockGetter>;

    beforeEach(async () => {
        mockedAsynchronousProducerClass = AsynchronousProducer as jest.MockedClass<typeof AsynchronousProducer>;
        mockedBlockSubscriptionClass = BlockSubscription as jest.MockedClass<typeof BlockSubscription>;
        mockedCoderClass = Coder as jest.MockedClass<typeof Coder>;
        mockedDatabaseClass = Database as jest.MockedClass<typeof Database>;
        mockedLogger = Logger as jest.MockedClass<typeof Logger>;
        mockedEthClass = EthClass as unknown as jest.MockedClass<typeof Eth>;
        mockedBlockGetter = QuickNodeBlockGetter as unknown as jest.MockedClass<typeof QuickNodeBlockGetter>;

        mockBlockProducerConfig = {
            rpcWsEndpoints: ["rpc.com", "rpc2.com"],
            startBlock: 0,
            mongoUrl: "mongodb://localhost:27017/chain-indexer",
            maxReOrgDepth: 0,
            topic: "demo",
            blockSubscriptionTimeout: 60000
        };
        mockedProducedBlockSchema = ProducedBlocksModel as jest.MockedObject<typeof ProducedBlocksModel>;
        mockedDatabaseClass.prototype.model.mockReturnValueOnce({});
        new QuickNodeBlockProducer(mockBlockProducerConfig);

        mockedDatabaseObject = mockedDatabaseClass.mock.instances[0] as jest.MockedObject<Database>;
    });

    test("Must return an instance of BlockProducer", async () => {
        expect(
            new QuickNodeBlockProducer(mockBlockProducerConfig)
        ).toBeInstanceOf(QuickNodeBlockProducer);
    });

    // test("When called must connect to mongoDB", async () => {
    //     new QuickNodeBlockProducer(mockBlockProducerConfig);

    //     expect(mockedDatabaseObject.connect).toBeCalled();
    // });

    test("Must create the database instance with passed mongouUrl", () => {
        expect(mockedDatabaseClass).toBeCalledWith("mongodb://localhost:27017/chain-indexer");
    });

    test("Database.model must be called with ProducedBlocks as model name to get Produced blocks model.", () => {
        expect(mockedDatabaseObject.model).toBeCalledWith(
            "ProducedBlocks",
            expect.anything(),
            expect.anything()
        );
    });

    test("Database.model must be called with ProducedBlockSchema to get Produced blocks model.", () => {
        expect(mockedDatabaseObject.model).toBeCalledWith(
            expect.anything(),
            mockedProducedBlockSchema,
            expect.anything()
        );
    });

    test("Database.model must be called with chain name + producedblocks as collection name to get Produced blocks model.", () => {
        expect(mockedDatabaseObject.model).toBeCalledWith(
            expect.anything(),
            expect.anything(),
            "producedblocks"
        );
    });

    test("Web3 eth instance must be created with first endpoint passed in config.", () => {
        expect(mockedEthClass.providers.WebsocketProvider).toHaveBeenCalledWith(
            "rpc.com",
            expect.anything()
        );
        expect(mockedEthClass).toBeCalledWith(
            //@ts-ignore
            mockedEthClass.providers.WebsocketProvider.mock.instances[0]
        );
    });

    test("Web3 eth instance must be created with right wss connection config passed in config.", () => {
        expect(mockedEthClass.providers.WebsocketProvider).toHaveBeenCalledWith(
            expect.anything(),
            {
                reconnect: {
                    auto: true
                },
                clientConfig: {
                    maxReceivedFrameSize: 1000000000,
                    maxReceivedMessageSize: 1000000000,
                }
            }
        );

        expect(mockedEthClass).toBeCalledWith(
            //@ts-ignore
            mockedEthClass.providers.WebsocketProvider.mock.instances[0]
        );
    });

    test("Coder instance must be created with right parameters.", () => {
        expect(mockedCoderClass).toBeCalledWith(
            "block",
            "blockpackage",
            "Block"
        );
    });

    test("BlockSubscription instance must be created with all parameters", () => {
        expect(mockedBlockSubscriptionClass).toBeCalledWith(
            mockedEthClass.mock.instances[0],
            ["rpc.com", "rpc2.com"],
            0,
            "quicknode_block_getter", 
            60000,
            0,
            undefined,
            undefined
        );
    });

    test("Non kafka config must be deleted from config object before being passed to KafkaProducer", () => {
        expect(mockBlockProducerConfig).not.toEqual(expect.objectContaining({
            rpcWsEndpoints: ["rpc.com", "rpc2.com"],
            startBlock: 0,
            mongoUrl: "mongodb://localhost:27017/chain-indexer",
            maxReOrgDepth: 0,
            maxRetries: 5, 
            blockSubscriptionTimeout: 60000
        }));
    });
});
