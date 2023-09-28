import { NFTTransferMapper } from "../../dist/mappers/nft_transfer_mapper";
import ethereumFullBlock from "../mock_data/ethereum_full_block.json";
import nftTransfer from "../mock_data/nft_transfer.json";
import { ABICoder } from "@maticnetwork/chain-indexer-framework/coder/abi_coder";
import { BloomFilter } from "@maticnetwork/chain-indexer-framework/filter";
import utils from "web3-utils";

jest.mock("@maticnetwork/chain-indexer-framework/coder/abi_coder");
jest.mock("@maticnetwork/chain-indexer-framework/filter");
jest.mock("web3-utils");

describe("NFTTransferMapper", () => {
    let mapperObject: NFTTransferMapper,
        mockedABICoderClass: jest.MockedClass<typeof ABICoder>,
        mockedBloomFilterClass: jest.MockedClass<typeof BloomFilter>,
        mockedUtilsObject: jest.MockedObject<typeof utils>;

    beforeEach(() => {
        mockedABICoderClass = ABICoder as jest.MockedClass<typeof ABICoder>
        mockedBloomFilterClass = BloomFilter as jest.MockedClass<typeof BloomFilter>
        mockedUtilsObject = utils as jest.MockedObject<typeof utils>;

        mapperObject = new NFTTransferMapper();
    });

    describe("map", () => {
        test("Check if transaction has NFT transfer event", () => {
            //@ts-ignore
            mockedBloomFilterClass.isTopicInBloom.mockReturnValueOnce(true);
            //@ts-ignore
            mapperObject.map(ethereumFullBlock.transactions[0]);

            expect(mockedBloomFilterClass.isTopicInBloom).toHaveBeenNthCalledWith(
                1,
                "0x00000000000000000000000000000000000000000000000000000000000000020000000000000000000000100000000000208000000000000000000000000000000000000000000000000008000000800000000000000000000100000000000000000000020000000000000000000800000000000100000080000010000000200000004100010000000000004100000000000000000000000000000100000000200009000000000000000000000000000000080000000000000020000000004000000002000000000001000000000000000000000000800000108000000028000000000000002000080000000000000000000000000000000000000000500000",
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            );

            expect(mockedBloomFilterClass.isContractAddressInBloom).toHaveBeenNthCalledWith(
                1,
                "0x00000000000000000000000000000000000000000000000000000000000000020000000000000000000000100000000000208000000000000000000000000000000000000000000000000008000000800000000000000000000100000000000000000000020000000000000000000800000000000100000080000010000000200000004100010000000000004100000000000000000000000000000100000000200009000000000000000000000000000000080000000000000020000000004000000002000000000001000000000000000000000000800000108000000028000000000000002000080000000000000000000000000000000000000000500000",
                "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364"
            );
        });

        test("If NFT transfer, map should return the tx in an array.", () => {
            //@ts-ignore
            mockedBloomFilterClass.isTopicInBloom.mockReturnValueOnce(true);
            //@ts-ignore
            mockedBloomFilterClass.isContractAddressInBloom.mockReturnValueOnce(true);

            //@ts-ignore
            mockedABICoderClass.decodeParameter.mockReturnValueOnce(1923);
            //@ts-ignore
            mockedABICoderClass.decodeParameter.mockReturnValueOnce("mock_sender_address");
            //@ts-ignore
            mockedABICoderClass.decodeParameter.mockReturnValueOnce("mock_receiver_address");

            mockedUtilsObject.toHex.mockReturnValueOnce("mock_hex");

            //@ts-ignore
            expect(mapperObject.map(nftTransfer)).toEqual([
                {
                    transactionIndex: 68,
                    transactionHash: '0x4c2f2eaf54685099b94e6d2035bec262b78d7df4baf30a84536924e241d07538',
                    transactionInitiator: "0xe95B7d229cfAed717600d64B0D938A36fd5d5060".toLowerCase(),
                    tokenAddress: "0x46A15B0b27311cedF172AB29E4f4766fbE7F4364".toLowerCase(),
                    tokenId: 1923,
                    senderAddress: 'mock_sender_address',
                    receiverAddress: 'mock_receiver_address'
                }
            ]);
        });
    });
});
