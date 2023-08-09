import TransferService from "../../dist/services/transfer.js";
import { Model } from "mongoose";
import { ITransfer } from "../../dist/interfaces/transfer.js";

describe("transfer service", () => {
    let transferService: jest.Mocked<TransferService>,
        mockTransferModel: jest.MockedObject<Model<ITransfer>>

    const data: ITransfer[] = [{
        "transactionIndex": 1,
        "transactionHash": "0x0bbd76664f215b0a74d4ee773c85c19cc649dcb504963678db568dca6912f0aa",
        "blockNumber": 1234,
        "timestamp": new Date(12340),
        "transactionInitiator": "0x65a8f07bd9a8598e1b5b6c0a88f4779dbc077675",
        "amount": "7954515646169844787673",
        "tokenAddress": "0x8839e639f210b80ffea73aedf51baed8dac04499",
        "senderAddress": "0xe95b7d229cfaed717600d64b0d938a36fd5d5060",
        "receiverAddress": "0xab6395382798ee6ea6e9a97cdfd18557f34adc87"
    }];

    const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn()
    };

    beforeEach(() => {
        mockTransferModel = Object.assign({
            add: jest.fn(),
            getAll: jest.fn(),
            getLastTransferBlock: jest.fn(),
            addAllTransfers: jest.fn(),
            startSession: jest.fn().mockResolvedValue(mockSession),
            session: mockSession,
            getTransactionCount: jest.fn(),
            deleteTxsForReorg: jest.fn(),
        }) as jest.MockedObject<Model<ITransfer>>;

        transferService = new TransferService(mockTransferModel as unknown as Model<ITransfer>) as jest.Mocked<TransferService>;

    });

    test("test the save method without reorg", async () => {
        //@ts-ignore
        mockTransferModel.getLastTransferBlock.mockResolvedValueOnce(1233);

        await transferService.save(data);
        //@ts-ignore
        expect(mockTransferModel.addAllTransfers).toBeCalledWith(data, mockSession);
    })

    test("test the save method with reorg", async () => {
        //@ts-ignore
        mockTransferModel.getLastTransferBlock.mockResolvedValueOnce(1235);

        await transferService.save(data);
        //@ts-ignore
        expect(mockTransferModel.deleteTxsForReorg).toBeCalledWith(data[0].blockNumber, mockSession);
        //@ts-ignore
        expect(mockTransferModel.addAllTransfers).toBeCalledWith(data, mockSession);
    })
})
