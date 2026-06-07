import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductDocument extends Document {
    name: string;
    code: string;
    image?: string;
    packing: string;
    unit: string;
    category?: string;
    labelWidth: number;
    labelHeight: number;
    prices: {
        quantity: number;
        price: number;
        unit?: string;
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
        unit: { type: String, default: "ชิ้น" },
        category: { type: String },
        labelWidth: { type: Number, default: 10 }, // cm
        labelHeight: { type: Number, default: 2.5 }, // cm
        prices: [
            {
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
                unit: { type: String }, // Optional per-tier unit
                _id: false,
            },
        ],
    },
    {
        timestamps: true,
    },
);

// Create indexes for better query performance and lower RAM usage
// (unique on code handled by schema field definition)
ProductSchema.index({ name: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ createdAt: -1 });
// Compound index for search queries
ProductSchema.index({ name: 1, code: 1 });

const Product: Model<IProductDocument> =
    mongoose.models.Product ||
    mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
