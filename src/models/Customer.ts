import mongoose, { Schema, Document, Model, Connection } from "mongoose";

export interface ICustomerDocument extends Document {
    customerCode: string;
    name: string;
    phone: string;
    lineUserId?: string | null;
    linkedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema(
    {
        customerCode: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        phone: { type: String, default: "" },
        lineUserId: { type: String, default: null },
        linkedAt: { type: Date, default: null },
    },
    { timestamps: true, strict: false },
);

CustomerSchema.index(
    { lineUserId: 1 },
    {
        unique: true,
        partialFilterExpression: { lineUserId: { $type: "string" } },
    },
);

const Customer: Model<ICustomerDocument> =
    mongoose.models.Customer ||
    mongoose.model<ICustomerDocument>("Customer", CustomerSchema, "customers");

export function getCustomerModel(conn: Connection): Model<ICustomerDocument> {
    return conn.model<ICustomerDocument>(
        "Customer",
        CustomerSchema,
        "customers",
    );
}

export default Customer;
