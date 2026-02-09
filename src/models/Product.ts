import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    code: string;
    image?: string;
    packing: string;
    prices: {
        quantity: number;
        price: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true },
        image: { type: String },
        packing: { type: String, required: true },
        prices: [
            {
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
                _id: false,
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Product: Model<IProduct> =
    mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
