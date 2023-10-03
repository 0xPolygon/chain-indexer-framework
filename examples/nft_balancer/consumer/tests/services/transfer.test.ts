import TransferTokenService from "../../dist/services/transfer_token";
import { Model } from "mongoose";
import { IToken } from "../../dist/interfaces/token";

describe("transfer token service", () => {
    let transferTokenService: jest.Mocked<TransferTokenService>,
        mockTransferModel: jest.MockedObject<Model<IToken>>

    const data: IToken[] = [{
        "tokenId": 7954515646169844787673,
        "owner": "0xab6395382798ee6ea6e9a97cdfd18557f34adc87"
    }];

    beforeEach(() => {
        mockTransferModel = Object.assign({
            add: jest.fn(),
            getAll: jest.fn(),
            updateTokens: jest.fn(),
        }) as jest.MockedObject<Model<IToken>>;

        transferTokenService = new TransferTokenService(mockTransferModel as unknown as Model<IToken>) as jest.Mocked<TransferTokenService>;

    });

    test("test the save method", async () => {

        await transferTokenService.save(data);
        //@ts-ignore
        expect(mockTransferModel.updateTokens).toBeCalledWith(data);
    })
})
