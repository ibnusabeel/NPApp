import mongoose, { Schema, Document, Model, Connection } from "mongoose";

export interface IInvoicePaymentDoc {
    slipRecordId?: mongoose.Types.ObjectId | null;
    amount: number;
    paidAt: Date;
}

export interface IInvoiceDocument extends Document {
    invoiceNo: string;
    customerId: mongoose.Types.ObjectId;
    customerCode: string;
    customerName: string;
    amount: number;
    paidAmount: number;
    status: "pending" | "partial" | "paid";
    dueDate?: Date | null;
    note?: string;
    payments: IInvoicePaymentDoc[];
    createdAt: Date;
    updatedAt: Date;
}

const InvoiceSchema = new Schema(
    {
        invoiceNo: { type: String, required: true, unique: true },
        customerId: { type: Schema.Types.ObjectId, required: true },
        customerCode: { type: String, required: true },
        customerName: { type: String, required: true },
        amount: { type: Number, required: true },
        paidAmount: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ["pending", "partial", "paid"],
            default: "pending",
        },
        dueDate: { type: Date, default: null },
        note: { type: String, default: "" },
        payments: [
            {
                slipRecordId: { type: Schema.Types.ObjectId, default: null },
                amount: { type: Number, required: true },
                paidAt: { type: Date, required: true },
                _id: false,
            },
        ],
    },
    { timestamps: true, strict: false },
);

InvoiceSchema.index({ customerCode: 1, status: 1 });
InvoiceSchema.index({ createdAt: -1 });

const Invoice: Model<IInvoiceDocument> =
    mongoose.models.Invoice ||
    mongoose.model<IInvoiceDocument>("Invoice", InvoiceSchema, "invoices");

export function getInvoiceModel(conn: Connection): Model<IInvoiceDocument> {
    return conn.model<IInvoiceDocument>("Invoice", InvoiceSchema, "invoices");
}

export default Invoice;
