import { NextRequest, NextResponse } from "next/server";
import { readSlipFromQrImage } from "@/lib/slipcheck/qrSlip";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body?.image) {
            throw new Error("กรุณาแนบรูปสลิป");
        }

        const match = (body.image as string).match(
            /^data:(.+);base64,(.+)$/
        );
        const base64 = match ? match[2] : body.image;
        const buffer = Buffer.from(base64, "base64");
        const result = await readSlipFromQrImage(buffer);

        return NextResponse.json({ mode: "qr-only", qr: result });
    } catch (error: any) {
        return NextResponse.json(
            { mode: "error", error: error.message },
            { status: 400 }
        );
    }
}
