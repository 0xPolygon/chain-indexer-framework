import { Model } from "mongoose";
import TransferConsumer from "../dist/transfer_consumer.js";
import { ITransfer } from "../dist/interfaces/transfer.js";
import TransferService from "../dist/services/transfer.js";
import TransferMapper from "../dist/mapper/transfer.js"
//@ts-ignore
import { transferTransactionMessage } from "./mock_data/transfer_message.js";

jest.mock('../dist/mapper/transfer.js');

describe("transfer consumer", () => {

    let mockTransferService: jest.Mocked<TransferService>,
        mockTransferMapper: jest.Mocked<TransferMapper>,
        transferConsumer: jest.Mocked<TransferConsumer>;

    const transferTransaction = [
        {
            transactionIndex: 1,
            transactionHash: "0x0bbd76664f215b0a74d4ee773c85c19cc649dcb504963678db568dca6912f0aa",
            blockNumber: 1234,
            timestamp: new Date(12340),
            transactionInitiator: "0x65a8f07bd9a8598e1b5b6c0a88f4779dbc077675",
            amount: "7954515646169844787673",
            tokenAddress: "0x8839e639f210b80ffea73aedf51baed8dac04499",
            senderAddress: "0xe95b7d229cfaed717600d64b0d938a36fd5d5060",
            receiverAddress: "0xab6395382798ee6ea6e9a97cdfd18557f34adc87"
        }
    ]

    beforeEach(() => {
        mockTransferService = new TransferService({} as Model<ITransfer>) as jest.Mocked<TransferService>;
        mockTransferMapper = new TransferMapper() as jest.Mocked<TransferMapper>;

        mockTransferService.save = jest.fn();
        mockTransferService.getAllTransactions = jest.fn().mockReturnValueOnce({
            result: transferTransaction
        });

        mockTransferMapper.map = jest.fn().mockReturnValueOnce(transferTransaction);
    });

    test("onTransferData", async () => {

        transferConsumer = new TransferConsumer(
            mockTransferService,
            mockTransferMapper
        ) as jest.Mocked<TransferConsumer>;
        await transferConsumer.onTransferData(transferTransactionMessage);

        expect(mockTransferMapper.map).toBeCalledWith({
            "blockNumber": {
                "high": 0,
                "low": 0,
                "unsigned": true
            },
            "data": [
                {
                    "amount": "7954515646169844787673",
                    "receiverAddress": "0xab6395382798ee6ea6e9a97cdfd18557f34adc87",
                    "senderAddress": "0xe95b7d229cfaed717600d64b0d938a36fd5d5060",
                    "tokenAddress": "0x8839e639f210b80ffea73aedf51baed8dac04499",
                    "transactionHash": "0x0bbd76664f215b0a74d4ee773c85c19cc649dcb504963678db568dca6912f0aa",
                    "transactionIndex": { "high": 1, "low": 0, "unsigned": true },
                    "transactionInitiator": "0x65a8f07bd9a8598e1b5b6c0a88f4779dbc077675"
                }
            ],
            "timestamp": 12340
        });

        expect(mockTransferService.save).toBeCalledWith(transferTransaction);
    });
});
