import { Schema, Model } from "mongoose";

export interface IProducedBlock {
    number: number
    hash: string
}

export interface IProducedBlocksModel<T> extends Model<T> {
    get(blockNumber?: number): Promise<T | null>;
    add(block: T, maxReOrgDepth?: number): Promise<void>;
}

export const ProducedBlocksModel = new Schema<IProducedBlock, IProducedBlocksModel<IProducedBlock>>(
    {
        number: {
            type: Number,
            required: true,
            unique: true
        },
        hash: {
            type: String,
            required: true
        },
    },
    {
        versionKey: false,
        statics: {
            async get(blockNumber?: number): Promise<IProducedBlock | null> {
                const query = blockNumber ? { number: blockNumber } : {};

                return (await this.find(query, null).sort({ number: -1 }).limit(1).exec())[0];
            },

            async add(block: IProducedBlock, maxReOrgDepth: number = 0): Promise<void> {
                await this.create(block);
                await this.deleteMany(
                    {
                        $or: [
                            { number: { $lt: block.number - maxReOrgDepth } },
                            { number: { $gt: block.number } }
                        ]
                    }
                );
            }
        }
    }
);
