import { MaticTransferMapper } from "../../dist/mappers/matic_transfer_mapper.js";
import ethereumFullBlock from "../mock_data/ethereum_full_block.json";
import maticTransfer from "../mock_data/matic_transfer.json";
import { ABICoder } from "@maticnetwork/chain-indexer-framework/coder/abi_coder";
import { BloomFilter } from "@maticnetwork/chain-indexer-framework/filter";
import utils from "web3-utils";

jest.mock("@maticnetwork/chain-indexer-framework/coder/abi_coder");
jest.mock("@maticnetwork/chain-indexer-framework/filter");
jest.mock("web3-utils");

describe("MaticTransferMapper", () => {
    let mapperObject: MaticTransferMapper,
        mockedABICoderClass: jest.MockedClass<typeof ABICoder>,
        mockedBloomFilterClass: jest.MockedClass<typeof BloomFilter>,
        mockedUtilsObject: jest.MockedObject<typeof utils>;

    beforeEach(() => {
        mockedABICoderClass = ABICoder as jest.MockedClass<typeof ABICoder>
        mockedBloomFilterClass = BloomFilter as jest.MockedClass<typeof BloomFilter>
        mockedUtilsObject = utils as jest.MockedObject<typeof utils>;

        mapperObject = new MaticTransferMapper();
    });

    describe("map", () => {
        test("Check if transaction has transfer event", () => {
            //@ts-ignore
            mapperObject.map(ethereumFullBlock.transactions[0]);

            expect(mockedBloomFilterClass.isTopicInBloom).toHaveBeenNthCalledWith(
                1,
                "0x00000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000800000000000000000200000000000000000000000000000000000008000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000002002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000002000000000000800000000000000000000000000000000000000000",
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            );
        });

        test("If matic transfer, map should return the tx in an array.", () => {
            //@ts-ignore
            mockedBloomFilterClass.isTopicInBloom.mockReturnValueOnce(true);

            //@ts-ignore
            mockedABICoderClass.decodeParameter.mockReturnValueOnce("mock_amount");
            //@ts-ignore
            mockedABICoderClass.decodeParameter.mockReturnValueOnce("mock_sender_address");
            //@ts-ignore
            mockedABICoderClass.decodeParameter.mockReturnValueOnce("mock_receiver_address");

            mockedUtilsObject.toHex.mockReturnValueOnce("mock_hex");

            //@ts-ignore
            expect(mapperObject.map(maticTransfer)).toEqual([
                {
                    transactionIndex: 68,
                    transactionHash: '0xc032ee963fa4096aec6fccbba85053bfb80185318b35563569d4aeac9d75fa27',
                    transactionInitiator: "0xe95B7d229cfAed717600d64B0D938A36fd5d5060".toLowerCase(),
                    tokenAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0".toLowerCase(),
                    amount: 'mock_hex',
                    senderAddress: 'mock_sender_address',
                    receiverAddress: 'mock_receiver_address'
                }
            ]);
        });
    });
});
