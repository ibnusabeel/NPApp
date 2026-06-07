"use server";

import dbSlipCheckConnect from "@/lib/db-slipcheck";
import { getSlipRecordModel } from "@/models/SlipRecord";
import { getCustomerModel } from "@/models/Customer";
import { getInvoiceModel } from "@/models/Invoice";
import {
    ISlipRecord,
    ICustomer,
    IInvoice,
    IDashboardOverview,
    ILineFollower,
} from "@/types";
import mongoose from "mongoose";

// ─── Helpers ───

async function getSlipCheckModels() {
    const conn = await dbSlipCheckConnect();
    return {
        SlipRecord: getSlipRecordModel(conn),
        Customer: getCustomerModel(conn),
        Invoice: getInvoiceModel(conn),
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeDoc(doc: any) {
    const obj: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(doc)) {
        if (val instanceof mongoose.Types.ObjectId) {
            obj[key] = val.toString();
        } else if (val instanceof Date) {
            obj[key] = val.toISOString();
        } else if (
            val &&
            typeof val === "object" &&
            !Array.isArray(val) &&
            !(val instanceof mongoose.Types.ObjectId)
        ) {
            obj[key] = serializeDoc(val);
        } else {
            obj[key] = val;
        }
    }
    return obj;
}

function remaining(inv: { amount: number; paidAmount: number }): number {
    return Math.max(0, (inv.amount || 0) - (inv.paidAmount || 0));
}

function normalizeCode(code: string): string {
    return String(code || "")
        .trim()
        .toUpperCase();
}

// ─── Dashboard Overview ───

export async function getDashboardOverview(): Promise<IDashboardOverview> {
    const { SlipRecord, Customer, Invoice } = await getSlipCheckModels();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
        totalSlips,
        todaySlips,
        todaySuccess,
        amountRows,
        verifiedTotal,
        customerTotal,
        customerLinked,
        invoiceTotal,
        invoicePending,
        invoicePartial,
        outstandingRows,
        recentSlipsRaw,
        pendingInvoicesRaw,
        unallocatedSlips,
    ] = await Promise.all([
        SlipRecord.countDocuments(),
        SlipRecord.countDocuments({ createdAt: { $gte: startOfToday } }),
        SlipRecord.countDocuments({
            createdAt: { $gte: startOfToday },
            success: true,
            verified: true,
        }),
        SlipRecord.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfToday },
                    success: true,
                    amount: { $type: "number" },
                },
            },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        SlipRecord.countDocuments({ verified: true }),
        Customer.countDocuments(),
        Customer.countDocuments({ lineUserId: { $type: "string" } }),
        Invoice.countDocuments(),
        Invoice.countDocuments({ status: "pending" }),
        Invoice.countDocuments({ status: "partial" }),
        Invoice.aggregate([
            { $match: { status: { $in: ["pending", "partial"] } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: { $subtract: ["$amount", "$paidAmount"] } },
                },
            },
        ]),
        SlipRecord.find({}).sort({ createdAt: -1 }).limit(8).lean(),
        Invoice.find({ status: { $in: ["pending", "partial"] } })
            .sort({ dueDate: 1, createdAt: -1 })
            .limit(8)
            .lean(),
        SlipRecord.countDocuments({
            success: true,
            allocationStatus: { $in: ["pending", "unallocated"] },
        }),
    ]);

    return {
        slips: {
            total: totalSlips,
            today: todaySlips,
            todaySuccess,
            todayAmount: amountRows[0]?.total ?? 0,
            verifiedTotal,
        },
        customers: { total: customerTotal, linked: customerLinked },
        invoices: {
            total: invoiceTotal,
            pending: invoicePending,
            partial: invoicePartial,
            outstanding: Math.max(0, outstandingRows[0]?.total ?? 0),
        },
        unallocatedSlips,
        recentSlips: (recentSlipsRaw as any[]).map(
            serializeDoc,
        ) as unknown as ISlipRecord[],
        pendingInvoices: (pendingInvoicesRaw as any[]).map((inv: any) => ({
            ...serializeDoc(inv),
            remaining: remaining(inv),
        })) as unknown as IInvoice[],
        system: {
            mongo: true,
            qrFallback: process.env.QR_FALLBACK !== "false",
            autoCustomerOnFollow:
                process.env.AUTO_CUSTOMER_ON_FOLLOW !== "false",
            quota: null,
        },
    };
}

// ─── Slip Records ───

export async function listSlipRecords({
    page = 1,
    limit = 20,
    lineUserId,
    from,
    to,
    success,
    transRef,
}: {
    page?: number;
    limit?: number;
    lineUserId?: string;
    from?: string;
    to?: string;
    success?: string | boolean;
    transRef?: string;
} = {}) {
    const { SlipRecord } = await getSlipCheckModels();

    const filter: Record<string, unknown> = {};
    if (lineUserId) filter.lineUserId = lineUserId;
    if (transRef) filter.transRef = { $regex: transRef, $options: "i" };
    if (success !== undefined && success !== "")
        filter.success = success === "true" || success === true;
    if (from || to) {
        filter.createdAt = {} as Record<string, Date>;
        if (from)
            (filter.createdAt as Record<string, Date>).$gte = new Date(from);
        if (to) (filter.createdAt as Record<string, Date>).$lte = new Date(to);
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
        SlipRecord.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        SlipRecord.countDocuments(filter),
    ]);

    return {
        items: (items as any[]).map(serializeDoc) as unknown as ISlipRecord[],
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
    };
}

// ─── Customers ───

export async function listCustomers({
    page = 1,
    limit = 50,
    search,
}: { page?: number; limit?: number; search?: string } = {}) {
    const { Customer } = await getSlipCheckModels();

    const filter: Record<string, unknown> = {};
    if (search) {
        const q = search.trim();
        filter.$or = [
            { customerCode: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } },
        ];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
        Customer.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Customer.countDocuments(filter),
    ]);

    return {
        items: (items as any[]).map(serializeDoc) as unknown as ICustomer[],
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
    };
}

export async function createCustomer(data: {
    customerCode: string;
    name: string;
    phone?: string;
    lineUserId?: string;
}) {
    const { Customer } = await getSlipCheckModels();

    const code = normalizeCode(data.customerCode);
    if (!code) throw new Error("กรุณาระบุรหัสลูกค้า");
    if (!data.name?.trim()) throw new Error("กรุณาระบุชื่อลูกค้า");

    const existing = await Customer.findOne({ customerCode: code });
    if (existing) throw new Error(`รหัสลูกค้า ${code} มีอยู่แล้ว`);

    if (data.lineUserId) {
        const linked = await Customer.findOne({ lineUserId: data.lineUserId });
        if (linked) throw new Error("LINE User นี้ผูกกับลูกค้าอื่นแล้ว");
    }

    const doc: Record<string, unknown> = {
        customerCode: code,
        name: data.name.trim(),
        phone: data.phone?.trim() || "",
    };
    if (data.lineUserId) {
        doc.lineUserId = data.lineUserId;
        doc.linkedAt = new Date();
    }

    const customer = await Customer.create(doc);
    return serializeDoc(customer.toObject()) as unknown as ICustomer;
}

export async function updateCustomer(
    id: string,
    data: { name?: string; phone?: string; lineUserId?: string | null },
) {
    const { Customer } = await getSlipCheckModels();

    const $set: Record<string, unknown> = { updatedAt: new Date() };
    const $unset: Record<string, string> = {};

    if (data.name !== undefined) {
        if (!String(data.name).trim()) throw new Error("กรุณาระบุชื่อลูกค้า");
        $set.name = data.name.trim();
    }
    if (data.phone !== undefined) $set.phone = data.phone.trim();
    if (data.lineUserId !== undefined) {
        if (data.lineUserId) {
            const other = await Customer.findOne({
                lineUserId: data.lineUserId,
                _id: { $ne: new mongoose.Types.ObjectId(id) },
            });
            if (other)
                throw new Error(
                    `LINE นี้ผูกกับรหัส ${other.customerCode} แล้ว`,
                );
            $set.lineUserId = data.lineUserId;
            $set.linkedAt = new Date();
        } else {
            $unset.lineUserId = "";
            $unset.linkedAt = "";
        }
    }

    const update: Record<string, unknown> = { $set };
    if (Object.keys($unset).length) update.$unset = $unset;

    const customer = await Customer.findByIdAndUpdate(id, update, {
        new: true,
    }).lean();
    if (!customer) throw new Error("ไม่พบลูกค้า");
    return serializeDoc(customer) as unknown as ICustomer;
}

// ─── Invoices ───

export async function listInvoices({
    page = 1,
    limit = 20,
    customerCode,
    status,
    search,
}: {
    page?: number;
    limit?: number;
    customerCode?: string;
    status?: string;
    search?: string;
} = {}) {
    const { Invoice } = await getSlipCheckModels();

    const filter: Record<string, unknown> = {};
    if (customerCode) filter.customerCode = normalizeCode(customerCode);
    if (status) filter.status = status;
    if (search) {
        const q = search.trim();
        filter.$or = [
            { invoiceNo: { $regex: q, $options: "i" } },
            { customerName: { $regex: q, $options: "i" } },
            { customerCode: { $regex: q, $options: "i" } },
        ];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
        Invoice.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean(),
        Invoice.countDocuments(filter),
    ]);

    return {
        items: (items as any[]).map((inv: any) => ({
            ...serializeDoc(inv),
            remaining: remaining(inv),
        })) as unknown as IInvoice[],
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
    };
}

export async function createInvoice(data: {
    customerCode: string;
    invoiceNo?: string;
    amount: number;
    dueDate?: string;
    note?: string;
}) {
    const { Customer, Invoice } = await getSlipCheckModels();

    const code = normalizeCode(data.customerCode);
    const customer = await Customer.findOne({ customerCode: code });
    if (!customer) throw new Error(`ไม่พบลูกค้ารหัส ${code}`);

    const numAmount = Number(data.amount);
    if (!numAmount || numAmount <= 0)
        throw new Error("กรุณาระบุยอดเงินที่ถูกต้อง");

    const no = String(data.invoiceNo || "").trim() || `INV-${Date.now()}`;
    const dup = await Invoice.findOne({ invoiceNo: no });
    if (dup) throw new Error(`เลขที่ใบแจ้งหนี้ ${no} ซ้ำ`);

    const invoice = await Invoice.create({
        invoiceNo: no,
        customerId: customer._id,
        customerCode: code,
        customerName: customer.name,
        amount: numAmount,
        paidAmount: 0,
        status: "pending",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        note: data.note?.trim() || "",
    });
    return {
        ...serializeDoc(invoice.toObject()),
        remaining: numAmount,
    } as unknown as IInvoice;
}

export async function manualAllocateSlip(
    slipRecordId: string,
    invoiceId: string,
    amount?: number,
) {
    const { SlipRecord, Invoice } = await getSlipCheckModels();

    const slip = await SlipRecord.findById(slipRecordId);
    if (!slip) throw new Error("ไม่พบสลิป");
    if (!slip.success) throw new Error("สลิปนี้ไม่ได้ตรวจผ่าน");

    const payAmount = Number(amount) || Number(slip.amount);
    if (!payAmount || payAmount <= 0) throw new Error("ยอดชำระไม่ถูกต้อง");

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error("ไม่พบใบแจ้งหนี้");

    const newPaid = Math.min(
        invoice.amount,
        (invoice.paidAmount || 0) + payAmount,
    );
    const newStatus =
        newPaid >= invoice.amount
            ? "paid"
            : newPaid > 0
              ? "partial"
              : "pending";

    await Invoice.findByIdAndUpdate(invoiceId, {
        $set: { paidAmount: newPaid, status: newStatus, updatedAt: new Date() },
        $push: {
            payments: {
                slipRecordId: new mongoose.Types.ObjectId(slipRecordId),
                amount: payAmount,
                paidAt: new Date(),
            },
        },
    });
    await SlipRecord.findByIdAndUpdate(slipRecordId, {
        $set: {
            customerCode: invoice.customerCode,
            allocationStatus: "allocated",
            allocatedInvoiceId: new mongoose.Types.ObjectId(invoiceId),
            allocatedAmount: payAmount,
            updatedAt: new Date(),
        },
    });

    const updated = await Invoice.findById(invoiceId).lean();
    return {
        slip: serializeDoc(slip.toObject()),
        invoice: updated
            ? { ...serializeDoc(updated), remaining: remaining(updated) }
            : null,
    };
}

// ─── LINE Members ───

function getLineTokenOrThrow(): string {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
    return token;
}

export async function listLineFollowers({
    start,
    limit = 30,
    search,
}: { start?: string; limit?: number; search?: string } = {}): Promise<{
    source: string;
    items: ILineFollower[];
    next: string | null;
    error?: string;
}> {
    try {
        const token = getLineTokenOrThrow();
        const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 1000);
        let url = `https://api.line.me/v2/bot/followers/ids?limit=${safeLimit}`;
        if (start && start !== "undefined" && start !== "null")
            url += `&start=${start}`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            const errBody = await res.text();
            throw new Error(errBody || `LINE API error (HTTP ${res.status})`);
        }

        const data = await res.json();
        const userIds: string[] = data.userIds || [];
        const items: ILineFollower[] = [];

        for (let i = 0; i < userIds.length; i += 15) {
            const batch = userIds.slice(i, i + 15);
            const profiles = await Promise.all(
                batch.map(async (uid) => {
                    try {
                        const pr = await fetch(
                            `https://api.line.me/v2/bot/profile/${uid}`,
                            { headers: { Authorization: `Bearer ${token}` } },
                        );
                        if (!pr.ok)
                            return {
                                userId: uid,
                                displayName: null,
                                pictureUrl: null,
                            };
                        const p = await pr.json();
                        return {
                            userId: uid,
                            displayName: p.displayName || null,
                            pictureUrl: p.pictureUrl || null,
                        };
                    } catch {
                        return {
                            userId: uid,
                            displayName: null,
                            pictureUrl: null,
                        };
                    }
                }),
            );
            items.push(...profiles);
        }

        if (items.length) {
            const { Customer } = await getSlipCheckModels();
            const linked = await Customer.find({
                lineUserId: { $in: items.map((i) => i.userId) },
            }).lean();
            const linkMap = new Map(
                (linked as any[]).map((c: any) => [c.lineUserId, c]),
            );
            for (const item of items) {
                const cust = linkMap.get(item.userId) as any;
                item.linkedCustomerCode = cust?.customerCode || null;
                item.linkedCustomerName = cust?.name || null;
            }
        }

        let filtered = items;
        if (search) {
            const q = search.trim().toLowerCase();
            filtered = items.filter(
                (i) =>
                    i.userId.toLowerCase().includes(q) ||
                    (i.displayName || "").toLowerCase().includes(q) ||
                    (i.linkedCustomerCode || "").toLowerCase().includes(q),
            );
        }

        return {
            source: "followers",
            items: filtered,
            next: data.next || null,
        };
    } catch (error: unknown) {
        return {
            source: "followers",
            items: [],
            next: null,
            error: error instanceof Error ? error.message : "LINE API error",
        };
    }
}

export async function listRecentLineUsers({
    limit = 30,
    search,
}: { limit?: number; search?: string } = {}): Promise<{
    source: string;
    items: ILineFollower[];
    next: null;
    error?: string;
}> {
    const { SlipRecord, Customer } = await getSlipCheckModels();

    const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
    const rows = await SlipRecord.aggregate([
        { $match: { lineUserId: { $type: "string" } } },
        {
            $group: {
                _id: "$lineUserId",
                lastAt: { $max: "$createdAt" },
                count: { $sum: 1 },
            },
        },
        { $sort: { lastAt: -1 } },
        { $limit: safeLimit },
    ]);

    const items: ILineFollower[] = rows.map((r: any) => ({
        userId: r._id as string,
        displayName: null,
        pictureUrl: null,
        lastAt: (r.lastAt as Date)?.toISOString(),
        slipCount: r.count as number,
        linkedCustomerCode: null,
        linkedCustomerName: null,
    }));

    if (items.length && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
        try {
            const token = getLineTokenOrThrow();
            for (const item of items) {
                try {
                    const pr = await fetch(
                        `https://api.line.me/v2/bot/profile/${item.userId}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                    );
                    if (pr.ok) {
                        const p = await pr.json();
                        item.displayName = p.displayName || null;
                        item.pictureUrl = p.pictureUrl || null;
                    }
                } catch {
                    /* keep null */
                }
            }
        } catch {
            /* keep null */
        }
    }

    if (items.length) {
        const linked = await Customer.find({
            lineUserId: { $in: items.map((i) => i.userId) },
        }).lean();
        const linkMap = new Map(
            (linked as any[]).map((c: any) => [c.lineUserId, c]),
        );
        for (const item of items) {
            const cust = linkMap.get(item.userId) as any;
            item.linkedCustomerCode = cust?.customerCode || null;
            item.linkedCustomerName = cust?.name || null;
        }
    }

    let filtered = items;
    if (search) {
        const q = search.trim().toLowerCase();
        filtered = items.filter(
            (i) =>
                i.userId.toLowerCase().includes(q) ||
                (i.displayName || "").toLowerCase().includes(q) ||
                (i.linkedCustomerCode || "").toLowerCase().includes(q),
        );
    }

    return { source: "recent", items: filtered, next: null };
}
