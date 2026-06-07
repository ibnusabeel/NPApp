import { NextRequest, NextResponse } from "next/server";
import { verifySlipImage } from "@/lib/slipcheck/verifySlip";
import { readSlipFromQrImage } from "@/lib/slipcheck/qrSlip";
import { formatDate, formatTime } from "@/lib/slipcheck/slipok";

function parseImageBody(body: any) {
    if (!body?.image) {
        throw new Error("กรุณาแนบรูปสลิป");
    }

    const match = (body.image as string).match(/^data:(.+);base64,(.+)$/);
    const base64 = match ? match[2] : body.image;
    const contentType = match ? match[1] : body.mime || "image/jpeg";

    return {
        buffer: Buffer.from(base64, "base64"),
        contentType,
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { buffer, contentType } = parseImageBody(body);
        const verification = await verifySlipImage(buffer, contentType);

        if (verification.mode === "silent") {
            return NextResponse.json({
                mode: "silent",
                message:
                    (verification.result as any)?.message ||
                    "ไม่ใช่สลิปโอนเงิน",
                slipok: formatSlipOkForWeb(verification.result as any),
            });
        }

        if (verification.mode === "qr") {
            return NextResponse.json({
                mode: "qr",
                message: "SlipOK quota เต็ม — ใช้การอ่าน QR แทน",
                qr: (verification.result as any).data,
                slipok: formatSlipOkForWeb(
                    verification.slipOkResult as any
                ),
            });
        }

        return NextResponse.json({
            mode: "slipok",
            slipok: formatSlipOkForWeb(verification.result as any),
        });
    } catch (error: any) {
        return NextResponse.json(
            { mode: "error", error: error.message },
            { status: 400 }
        );
    }
}

function formatSlipOkForWeb(result: any) {
    if (!result?.success || !result?.data) {
        return {
            success: false,
            code: result?.code,
            message: result?.message || "ตรวจสอบไม่ผ่าน",
        };
    }

    const slip = result.data;
    return {
        success: true,
        amount: slip.amount ?? slip.paidLocalAmount,
        date: formatDate(slip.transDate),
        time: formatTime(slip.transTime),
        sender: slip.sender?.displayName || slip.sender?.name || "-",
        receiver: slip.receiver?.displayName || slip.receiver?.name || "-",
        transRef: slip.transRef || "-",
    };
}
