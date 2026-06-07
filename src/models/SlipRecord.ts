import mongoose, { Schema, Document, Model, Connection } from "mongoose";

export interface ISlipRecordDocument extends Document {
    lineUserId: string;
    lineMessageId?: string;
    eventTimestamp?: Date;
    customerCode?: string | null;
    customerName?: string | null;
    allocationStatus?: "pending" | "allocated" | "unallocated" | null;
    allocatedInvoiceId?: mongoose.Types.ObjectId | null;
    allocatedAmount?: number | null;
    success: boolean;
    verified: boolean;
    verificationMode: "slipok" | "qr" | "silent";
    amount: number | null;
    transDate: string | null;
    transTime: string | null;
    transRef: string | null;
    sendingBank: string | null;
    bankName: string | null;
    sender: {
        name: string | null;
        account: string | null;
        bank: string | null;
    } | null;
    receiver: {
        name: string | null;
        account: string | null;
        bank: string | null;
    } | null;
    slipokCode: number | null;
    message: string | null;
    createdAt: Date;
    updatedAt?: Date;
}

const SlipRecordSchema = new Schema(
    {
        lineUserId: { type: String, required: true },
        lineMessageId: { type: String },
        eventTimestamp: { type: Date },
        customerCode: { type: String, default: null },
        customerName: { type: String, default: null },
        allocationStatus: {
            type: String,
            enum: ["pending", "allocated", "unallocated", null],
            default: null,
        },
        allocatedInvoiceId: { type: Schema.Types.ObjectId, default: null },
        allocatedAmount: { type: Number, default: null },
        success: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        verificationMode: {
            type: String,
            enum: ["slipok", "qr", "silent"],
            required: true,
        },
        amount: { type: Number, default: null },
        transDate: { type: String, default: null },
        transTime: { type: String, default: null },
        transRef: { type: String, default: null },
        sendingBank: { type: String, default: null },
        bankName: { type: String, default: null },
        sender: {
            type: new Schema(
                {
                    name: { type: String, default: null },
                    account: { type: String, default: null },
                    bank: { type: String, default: null },
                },
                { _id: false },
            ),
            default: null,
        },
        receiver: {
            type: new Schema(
                {
                    name: { type: String, default: null },
                    account: { type: String, default: null },
                    bank: { type: String, default: null },
                },
                { _id: false },
            ),
            default: null,
        },
        slipokCode: { type: Number, default: null },
        message: { type: String, default: null },
    },
    { timestamps: true, strict: false },
);

SlipRecordSchema.index({ createdAt: -1 });
SlipRecordSchema.index({ lineUserId: 1, createdAt: -1 });
SlipRecordSchema.index({ transRef: 1 }, { sparse: true });
SlipRecordSchema.index({ customerCode: 1, createdAt: -1 }, { sparse: true });

// Default model (uses default mongoose connection — for server actions that use dbConnect)
const SlipRecord: Model<ISlipRecordDocument> =
    mongoose.models.SlipRecord ||
    mongoose.model<ISlipRecordDocument>(
        "SlipRecord",
        SlipRecordSchema,
        "slip_records",
    );

// Getter for specific connection
export function getSlipRecordModel(
    conn: Connection,
): Model<ISlipRecordDocument> {
    return conn.model<ISlipRecordDocument>(
        "SlipRecord",
        SlipRecordSchema,
        "slip_records",
    );
}

export default SlipRecord;
