import { NextRequest, NextResponse } from "next/server";
import { validateSignature } from "@line/bot-sdk";
import { verifySlipImage } from "@/lib/slipcheck/verifySlip";
import { createLineClient, downloadImageContent } from "@/lib/slipcheck/line";
import dbSlipCheckConnect from "@/lib/db-slipcheck";
import { getSlipRecordModel } from "@/models/SlipRecord";
import { getCustomerModel } from "@/models/Customer";
import { getInvoiceModel } from "@/models/Invoice";

async function getSlipCheckModels() {
    const conn = await dbSlipCheckConnect();
    return {
        SlipRecord: getSlipRecordModel(conn),
        Customer: getCustomerModel(conn),
        Invoice: getInvoiceModel(conn),
    };
}

export async function POST(req: NextRequest) {
    const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
    const rawBody = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    if (
        !validateSignature(rawBody, channelSecret, signature) &&
        channelSecret !== "placeholder"
    ) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { events?: any[] };
    try {
        body = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const events = body.events || [];
    events.forEach((event: any) => {
        handleLineEvent(event).catch((err: Error) =>
            console.error("[error] Failed to handle event:", err),
        );
    });

    return NextResponse.json({ ok: true });
}

async function handleLineEvent(event: any) {
    let lineConfig;
    try {
        lineConfig = createLineClient();
    } catch (error) {
        console.warn(`[warn] LINE not configured: ${(error as Error).message}`);
        return;
    }
    const { client, blobClient } = lineConfig;

    if (event.type === "follow") {
        await handleFollowEvent(event);
        return;
    }
    if (event.type !== "message") return;

    if (event.message?.type === "text") {
        await handleTextCommand(event, client);
        return;
    }
    if (event.message?.type !== "image") return;

    try {
        const imageBuffer = await downloadImageContent(
            blobClient,
            event.message.id,
        );
        const verification = await verifySlipImage(imageBuffer);
        if (verification.mode === "silent") return;

        const { SlipRecord, Customer, Invoice } = await getSlipCheckModels();
        const saved = await saveSlipRecordToDb({
            SlipRecord,
            Customer,
            lineUserId: event.source.userId,
            lineMessageId: event.message.id,
            eventTimestamp: event.timestamp,
            verification,
        }).catch((err: Error) => {
            console.error("[error] Failed to save slip record:", err);
            return null;
        });

        if (saved?.customer?.customerCode && saved?.insertedId) {
            autoAllocateSlip(
                { SlipRecord, Invoice },
                saved.insertedId.toString(),
                saved.customer.customerCode,
            ).catch((err: Error) =>
                console.error("[error] Auto-allocate failed:", err),
            );
        }

        const result = verification.result as any;
        if (verification.mode === "qr") {
            await pushFlexMessage(client, event.source.userId, {
                type: "flex",
                altText: "ผลตรวจสอบสลิป (QR)",
                contents: buildQrFlexContent(result.data),
            });
            return;
        }

        if (result?.success) {
            await pushFlexMessage(client, event.source.userId, {
                type: "flex",
                altText: "ผลตรวจสอบสลิป",
                contents: buildSlipResultFlexContent(result),
            });
            const senderName =
                result.data?.sender?.displayName || result.data?.sender?.name;
            await new Promise((r) => setTimeout(r, 1200));
            await pushFlexMessage(client, event.source.userId, {
                type: "flex",
                altText: "ขอบคุณครับ",
                contents: buildThankYouFlexContent(senderName),
            });
        } else if (result?.code) {
            await pushFlexMessage(client, event.source.userId, {
                type: "flex",
                altText: "ผลตรวจสอบสลิป",
                contents: buildSlipResultFlexContent(result),
            });
        }
    } catch (error) {
        console.error("[error] Slip verification failed:", error);
    }
}

async function pushFlexMessage(
    client: any,
    toUserId: string,
    flexMessage: any,
) {
    await client.pushMessage({ to: toUserId, messages: [flexMessage] });
}

async function saveSlipRecordToDb({
    SlipRecord,
    Customer,
    lineUserId,
    lineMessageId,
    eventTimestamp,
    verification,
}: {
    SlipRecord: any;
    Customer: any;
    lineUserId: string;
    lineMessageId: string;
    eventTimestamp: number;
    verification: any;
}) {
    const customer = await Customer.findOne({ lineUserId }).lean();
    const { mode, result, slipOkResult } = verification;
    let fields: any = {};

    if (mode === "qr" && result?.success && result.data) {
        const d = result.data;
        fields = {
            success: true,
            verified: false,
            verificationMode: "qr",
            amount: d.amount ?? null,
            transDate: d.transDate || null,
            transTime: d.transTime || null,
            transRef: d.transRef || null,
            sendingBank: d.sendingBank || null,
            bankName: d.bankName || null,
            sender: null,
            receiver: null,
            slipokCode: slipOkResult?.code ?? null,
            message: null,
        };
    } else {
        const slip = result?.data;
        fields = {
            success: Boolean(result?.success),
            verified: mode === "slipok" && Boolean(result?.success),
            verificationMode: mode,
            amount: slip?.amount ?? slip?.paidLocalAmount ?? null,
            transDate: slip?.transDate || null,
            transTime: slip?.transTime || null,
            transRef: slip?.transRef || null,
            sendingBank: slip?.sendingBank || null,
            bankName: slip?.receiver?.bank?.name || null,
            sender: slip?.sender
                ? {
                      name: slip.sender.displayName || slip.sender.name || null,
                      account:
                          slip.sender.account?.value ||
                          slip.sender.account ||
                          null,
                      bank: slip.sender.bank?.id || slip.sender.bank || null,
                  }
                : null,
            receiver: slip?.receiver
                ? {
                      name:
                          slip.receiver.displayName ||
                          slip.receiver.name ||
                          null,
                      account:
                          slip.receiver.account?.value ||
                          slip.receiver.account ||
                          null,
                      bank:
                          slip.receiver.bank?.id || slip.receiver.bank || null,
                  }
                : null,
            slipokCode: result?.code ?? null,
            message: result?.message || null,
        };
    }

    const doc = {
        lineUserId,
        lineMessageId,
        eventTimestamp: eventTimestamp ? new Date(eventTimestamp) : new Date(),
        customerCode: (customer as any)?.customerCode || null,
        customerName: (customer as any)?.name || null,
        allocationStatus: fields.success && fields.amount ? "pending" : null,
        ...fields,
        createdAt: new Date(),
    };
    const { insertedId } = await (SlipRecord as any).collection.insertOne(doc);
    return { insertedId, doc: { ...doc, _id: insertedId }, customer };
}

function remaining(inv: { amount: number; paidAmount: number }): number {
    return Math.max(0, (inv.amount || 0) - (inv.paidAmount || 0));
}

async function autoAllocateSlip(
    { SlipRecord, Invoice }: { SlipRecord: any; Invoice: any },
    slipRecordId: string,
    customerCode: string,
) {
    const slip = await SlipRecord.findById(slipRecordId);
    if (
        !slip ||
        !slip.success ||
        !slip.amount ||
        slip.allocationStatus === "allocated"
    )
        return null;

    const invoices = await Invoice.find({
        customerCode: customerCode.toUpperCase(),
        status: { $in: ["pending", "partial"] },
    })
        .sort({ dueDate: 1, createdAt: 1 })
        .lean();
    if (!invoices.length) {
        await SlipRecord.findByIdAndUpdate(slipRecordId, {
            $set: {
                customerCode: customerCode.toUpperCase(),
                allocationStatus: "unallocated",
                updatedAt: new Date(),
            },
        });
        return { allocated: false, reason: "no_invoices" };
    }

    const slipAmount = Number(slip.amount);
    let target: any = invoices.find(
        (inv: any) => remaining(inv) === slipAmount,
    );
    if (!target)
        target = invoices.find((inv: any) => remaining(inv) >= slipAmount);
    if (!target) target = invoices[0];

    const payAmount = Math.min(slipAmount, remaining(target));
    const newPaid = Math.min(
        target.amount,
        (target.paidAmount || 0) + payAmount,
    );
    const newStatus =
        newPaid >= target.amount ? "paid" : newPaid > 0 ? "partial" : "pending";

    await Invoice.findByIdAndUpdate(target._id, {
        $set: { paidAmount: newPaid, status: newStatus, updatedAt: new Date() },
        $push: {
            payments: { slipRecordId, amount: payAmount, paidAt: new Date() },
        },
    });
    await SlipRecord.findByIdAndUpdate(slipRecordId, {
        $set: {
            customerCode: customerCode.toUpperCase(),
            allocationStatus: "allocated",
            allocatedInvoiceId: target._id,
            allocatedAmount: payAmount,
            updatedAt: new Date(),
        },
    });

    return { allocated: true, invoiceNo: target.invoiceNo, amount: payAmount };
}

async function handleFollowEvent(event: any) {
    if (process.env.AUTO_CUSTOMER_ON_FOLLOW === "false") return;
    const lineUserId = event.source?.userId;
    if (!lineUserId) return;

    try {
        const { Customer } = await getSlipCheckModels();
        const existing = await Customer.findOne({ lineUserId });
        if (existing) return;

        const rows = await Customer.find({
            customerCode: { $regex: /^C\d+$/i },
        })
            .select("customerCode")
            .lean();
        let max = 0;
        for (const row of rows as any[]) {
            const num = parseInt(String(row.customerCode).slice(1), 10);
            if (Number.isFinite(num) && num > max) max = num;
        }
        const customerCode = `C${String(max + 1).padStart(3, "0")}`;

        let displayName = `LINE ${lineUserId.slice(-8)}`;
        try {
            const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
            if (token) {
                const pr = await fetch(
                    `https://api.line.me/v2/bot/profile/${lineUserId}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                if (pr.ok) {
                    const p = await pr.json();
                    if (p.displayName?.trim())
                        displayName = p.displayName.trim();
                }
            }
        } catch {
            /* use default */
        }

        await Customer.create({
            customerCode,
            name: displayName,
            phone: "",
            lineUserId,
            linkedAt: new Date(),
        });
        console.log(
            `[auto-customer] ${customerCode} ← ${lineUserId} (${displayName})`,
        );
    } catch (error: any) {
        console.error("[error] Auto customer on follow failed:", error.message);
    }
}

async function handleTextCommand(event: any, client: any) {
    const text = String(event.message?.text || "").trim();
    const lineUserId = event.source?.userId;
    const replyToken = event.replyToken;
    if (!lineUserId || !replyToken) return;

    if (/^(ช่วยเหลือ|help|คำสั่ง)$/i.test(text)) {
        await client.replyMessage({
            replyToken,
            messages: [
                {
                    type: "text",
                    text: "📋 คำสั่ง:\n• ผูก [รหัสลูกค้า] — ลงทะเบียน\n• ประวัติ — ดูประวัติสลิป\n• ยอดคงค้าง — ดูยอดค้างชำระ\n• ช่วยเหลือ — แสดงข้อความนี้",
                },
            ],
        });
        return;
    }

    const linkMatch = text.match(/^(?:ผูก|ลงทะเบียน|register)\s+(\S+)$/i);
    if (linkMatch) {
        try {
            const { Customer } = await getSlipCheckModels();
            const code = linkMatch[1].toUpperCase();
            const customer = await Customer.findOne({ customerCode: code });
            if (!customer) {
                await client.replyMessage({
                    replyToken,
                    messages: [
                        { type: "text", text: `❌ ไม่พบรหัสลูกค้า ${code}` },
                    ],
                });
                return;
            }
            if (customer.lineUserId && customer.lineUserId !== lineUserId) {
                await client.replyMessage({
                    replyToken,
                    messages: [
                        {
                            type: "text",
                            text: "❌ รหัสลูกค้านี้ถูกผูกกับ LINE อื่นแล้ว กรุณาติดต่อ admin",
                        },
                    ],
                });
                return;
            }
            await Customer.findByIdAndUpdate(customer._id, {
                $set: {
                    lineUserId,
                    linkedAt: new Date(),
                    updatedAt: new Date(),
                },
            });
            await client.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: `✅ ลงทะเบียนสำเร็จ!\nรหัส: ${code}\nชื่อ: ${customer.name}`,
                    },
                ],
            });
        } catch (err: any) {
            await client.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: `❌ ${err.message || "เกิดข้อผิดพลาด"}`,
                    },
                ],
            });
        }
        return;
    }

    const { SlipRecord, Customer, Invoice } = await getSlipCheckModels();

    if (/^(ประวัติ|history)$/i.test(text)) {
        const customer = await Customer.findOne({ lineUserId });
        if (!customer) {
            await client.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: "ยังไม่ได้ลงทะเบียน\nพิมพ์: ผูก [รหัสลูกค้า]",
                    },
                ],
            });
            return;
        }
        const slips = await SlipRecord.find({ lineUserId, success: true })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        if (!slips.length) {
            await client.replyMessage({
                replyToken,
                messages: [{ type: "text", text: "ยังไม่มีประวัติสลิป" }],
            });
            return;
        }
        const lines = slips.map((s: any) => {
            const date = s.createdAt
                ? new Date(s.createdAt).toLocaleDateString("th-TH")
                : "-";
            const amount = s.amount
                ? new Intl.NumberFormat("th-TH").format(s.amount)
                : "-";
            return `📅 ${date} | ฿${amount}`;
        });
        await client.replyMessage({
            replyToken,
            messages: [
                {
                    type: "text",
                    text: `📋 ประวัติสลิป (${customer.name})\n\n${lines.join("\n")}`,
                },
            ],
        });
        return;
    }

    if (/^(ยอดคงค้าง|คงค้าง|balance)$/i.test(text)) {
        const customer = await Customer.findOne({ lineUserId });
        if (!customer) {
            await client.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: "ยังไม่ได้ลงทะเบียน\nพิมพ์: ผูก [รหัสลูกค้า]",
                    },
                ],
            });
            return;
        }
        const invoices = await Invoice.find({
            customerCode: customer.customerCode,
            status: { $in: ["pending", "partial"] },
        }).lean();
        const totalOutstanding = invoices.reduce(
            (sum: number, inv: any) => sum + remaining(inv),
            0,
        );
        if (!invoices.length) {
            await client.replyMessage({
                replyToken,
                messages: [
                    {
                        type: "text",
                        text: `✅ ไม่มียอดคงค้าง (${customer.name})`,
                    },
                ],
            });
            return;
        }
        const invLines = invoices
            .slice(0, 5)
            .map(
                (inv: any) =>
                    `${inv.invoiceNo}: ฿${new Intl.NumberFormat("th-TH").format(remaining(inv))}`,
            );
        await client.replyMessage({
            replyToken,
            messages: [
                {
                    type: "text",
                    text: `💰 ยอดคงค้าง (${customer.name}): ฿${new Intl.NumberFormat("th-TH").format(totalOutstanding)}\n\n${invLines.join("\n")}${invoices.length > 5 ? `\n...และอีก ${invoices.length - 5} รายการ` : ""}`,
                },
            ],
        });
        return;
    }
}

// ─── Flex Message Builders ───

function buildQrFlexContent(data: any) {
    return {
        type: "bubble",
        size: "mega",
        body: {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFF8E7",
            paddingAll: "lg",
            spacing: "md",
            contents: [
                {
                    type: "text",
                    text: "📱 ตรวจสอบสลิป (QR)",
                    weight: "bold",
                    size: "md",
                    wrap: true,
                },
                {
                    type: "text",
                    text: "⚠️ ไม่สามารถยืนยันกับธนาคารได้ (quota เต็ม)\nกรุณาตรวจสอบยอดเงินด้วยตนเอง",
                    size: "sm",
                    color: "#888888",
                    wrap: true,
                },
                {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                        {
                            type: "text",
                            text: `🏦 ${data.bankName || data.sendingBank || "-"}`,
                            size: "sm",
                            wrap: true,
                        },
                        {
                            type: "text",
                            text: `🔖 ${data.transRef || "-"}`,
                            size: "xs",
                            color: "#888888",
                            wrap: true,
                        },
                    ],
                },
            ],
        },
    };
}

function buildSlipResultFlexContent(result: any) {
    const success = result?.success;
    const data = result?.data;
    const message = result?.message || "";

    if (success && data) {
        const amount = data.amount ?? data.paidLocalAmount;
        return {
            type: "bubble",
            size: "mega",
            body: {
                type: "box",
                layout: "vertical",
                backgroundColor: "#E8F5E9",
                paddingAll: "lg",
                spacing: "md",
                contents: [
                    {
                        type: "text",
                        text: "✅ ตรวจสอบสลิปสำเร็จ",
                        weight: "bold",
                        size: "md",
                        wrap: true,
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        contents: [
                            {
                                type: "text",
                                text: `💰 จำนวนเงิน: ${amount} บาท`,
                                size: "sm",
                                wrap: true,
                            },
                            {
                                type: "text",
                                text: `📅 ${data.transDate || "-"} ${data.transTime || "-"}`,
                                size: "xs",
                                color: "#888888",
                                wrap: true,
                            },
                            {
                                type: "text",
                                text: `👤 ${data.sender?.displayName || data.sender?.name || "-"} → 🏦 ${data.receiver?.displayName || data.receiver?.name || "-"}`,
                                size: "xs",
                                color: "#888888",
                                wrap: true,
                            },
                            {
                                type: "text",
                                text: `🔖 ${data.transRef || "-"}`,
                                size: "xs",
                                color: "#888888",
                                wrap: true,
                            },
                        ],
                    },
                ],
            },
        };
    }

    return {
        type: "bubble",
        size: "mega",
        body: {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFEBEE",
            paddingAll: "lg",
            spacing: "md",
            contents: [
                {
                    type: "text",
                    text: "❌ ไม่สามารถยืนยันสลิปได้",
                    weight: "bold",
                    size: "md",
                    wrap: true,
                },
                {
                    type: "text",
                    text: message,
                    size: "sm",
                    color: "#888888",
                    wrap: true,
                },
            ],
        },
    };
}

function buildThankYouFlexContent(senderName: string) {
    return {
        type: "bubble",
        size: "kilo",
        body: {
            type: "box",
            layout: "vertical",
            backgroundColor: "#E8F5E9",
            paddingAll: "md",
            spacing: "sm",
            contents: [
                {
                    type: "text",
                    text: "🙏 ขอบคุณครับ",
                    weight: "bold",
                    size: "md",
                    wrap: true,
                },
                {
                    type: "text",
                    text: senderName
                        ? `คุณ ${senderName}`
                        : "ขอบคุณที่ใช้บริการ",
                    size: "sm",
                    wrap: true,
                },
            ],
        },
    };
}
