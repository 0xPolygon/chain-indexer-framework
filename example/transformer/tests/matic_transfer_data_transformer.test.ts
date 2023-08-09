import { ITransformedBlock } from "@maticnetwork/chainflow/interfaces/transformed_block";
import { Coder } from "@maticnetwork/chainflow/coder/protobuf_coder";
import { ABICoder } from "@maticnetwork/chainflow/coder/abi_coder";
import { IBlock } from "@maticnetwork/chainflow/interfaces/block";
import { IConsumerConfig } from "@maticnetwork/chainflow/interfaces/consumer_config";
import { IProducerConfig } from "@maticnetwork/chainflow/interfaces/producer_config";
import { ICoder } from "@maticnetwork/chainflow/interfaces/coder";
import { IKafkaCoderConfig } from "@maticnetwork/chainflow/interfaces/kafka_coder_config";
import { BloomFilter } from "@maticnetwork/chainflow/filter";
import { MaticTransferMapper } from "../dist/mappers/matic_transfer_mapper.js";
import { MaticTransferDataTransformer } from "../dist/matic_transfer_data_transformer.js";
import IMaticTransferTx from "../dist/interfaces/matic_transfer_tx.js";
import ethereumFullBlock from "./mock_data/ethereum_full_block.json";

jest.mock("../dist/mappers/matic_transfer_mapper.js");
jest.mock("@maticnetwork/chainflow/coder/abi_coder");
jest.mock("@maticnetwork/chainflow/filter");

describe("MaticTransferDataTransformer", () => {
    class ExtendedTransformer extends MaticTransferDataTransformer {
        public transform(block: IBlock): Promise<ITransformedBlock<IMaticTransferTx>> {
            return super.transform(block);
        }
    }

    let
        mockedMaticTransferMapperObject: jest.MockedObject<MaticTransferMapper>,
        mockedBloomFilter: jest.MockedClass<typeof BloomFilter>,
        mockedABICoder: jest.MockedClass<typeof ABICoder>,
        mockedCoderClass: jest.MockedClass<typeof Coder>,
        extendedTransformer: ExtendedTransformer;

    beforeEach(() => {
        mockedBloomFilter = BloomFilter as jest.MockedClass<typeof BloomFilter>;
        mockedABICoder = ABICoder as jest.MockedClass<typeof ABICoder>;
        mockedCoderClass = Coder as jest.MockedClass<typeof Coder>;
    });

    describe("transform", () => {
        beforeEach(() => {
            mockedMaticTransferMapperObject = new MaticTransferMapper() as jest.MockedObject<MaticTransferMapper>

            extendedTransformer = new ExtendedTransformer(
                {topic: "mocktopic", coders: {} as IKafkaCoderConfig} as IConsumerConfig,
                {coder: {} as ICoder} as IProducerConfig,
                mockedMaticTransferMapperObject

            )
        });

        test("mapper.map must be called with transaction details", async () => {
            //@ts-ignore
            await extendedTransformer.transform(ethereumFullBlock);

            expect(mockedMaticTransferMapperObject.map).toBeCalledWith(
                ethereumFullBlock.transactions[0]
            );
        });

        test("must return transformed block with matic transfer events.", async () => {
            mockedMaticTransferMapperObject.map.mockReturnValueOnce([{
                transactionHash: "mock"
            }] as IMaticTransferTx[])

            
            await expect(
                //@ts-ignore
                extendedTransformer.transform(ethereumFullBlock)
            ).resolves.toEqual({
                blockNumber: 17855673,
                timestamp: 1691321963,
                data: [{
                    transactionHash: "mock"
                }]
            });
        });

    });
})
