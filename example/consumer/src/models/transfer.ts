import { Database } from "@maticnetwork/chain-indexer-framework/mongo/database";
import { Model, Schema } from "mongoose";
import { ITransfer } from "../interfaces/transfer.js";
import statics from "../interfaces/transfer_methods.js";

const TransferSchema = new Schema<ITransfer>({
    transactionIndex: {
        type: Number
    },
    transactionHash: {
        type: String
    },
    blockNumber: {
        type: Number
    },
    timestamp: {
        type: Date
    },
    transactionInitiator: {
        type: String
    },
    amount: {
        type: String,
    },
    tokenAddress: {
        type: String,
    },
    senderAddress: {
        type: String
    },
    receiverAddress: {
        type: String
    }
},
    {
        versionKey: false,
        statics: statics
    }
);
/**
 * This class represents Transfer Model
 * 
 * @class
 */
export class TransferModel {
    /**
    * Get the transfer model defined on this mongoose database instance
    * 
    * @param {Database} database 
    * 
    */
    public static async new(database: Database) {
        const model = database.model<ITransfer, Model<ITransfer>>(
            "transfer",
            TransferSchema
        );
        await model.createCollection();

        return model;
    }
}
