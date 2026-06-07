import sharp from "sharp";
import jsqr from "jsqr";
import { slipVerify } from "promptparse/validate";
import { getBankName } from "@/lib/banks";

interface QrSlipData {
    sendingBank: string;
    bankName: string;
    transRef: string;
    verified: boolean;
}

interface QrResult {
    success: boolean;
    data?: QrSlipData;
    message?: string;
}

async function imageToRgba(imageBuffer: Buffer) {
    return sharp(imageBuffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
}

function scanQrFromRgba(
    data: Buffer | Uint8ClampedArray,
    width: number,
    height: number
): string | null {
    const clamped =
        data instanceof Uint8ClampedArray
            ? data
            : new Uint8ClampedArray(data);
    const found = jsqr(clamped, width, height);
    if (found?.data) return found.data;

    const inverted = new Uint8ClampedArray(clamped.length);
    for (let i = 0; i < clamped.length; i += 4) {
        inverted[i] = 255 - clamped[i];
        inverted[i + 1] = 255 - clamped[i + 1];
        inverted[i + 2] = 255 - clamped[i + 2];
        inverted[i + 3] = clamped[i + 3];
    }

    const invertedFound = jsqr(inverted, width, height);
    return invertedFound?.data || null;
}

export async function decodeQrPayloadFromImage(
    imageBuffer: Buffer
): Promise<string | null> {
    const sizes = [1200, 800, null];

    for (const maxSize of sizes) {
        let pipeline = sharp(imageBuffer).ensureAlpha();
        if (maxSize) {
            pipeline = pipeline.resize({
                width: maxSize,
                height: maxSize,
                fit: "inside",
                withoutEnlargement: false,
            });
        }

        const { data, info } = await pipeline
            .raw()
            .toBuffer({ resolveWithObject: true });
        const payload = scanQrFromRgba(data, info.width, info.height);
        if (payload) return payload;
    }

    return null;
}

function parseSlipQrPayload(payload: string | null): QrResult {
    if (!payload) {
        return { success: false, message: "ไม่พบ QR Code ในรูปภาพ" };
    }

    const slipData = slipVerify(payload);
    if (!slipData) {
        return { success: false, message: "QR Code ไม่ใช่รูปแบบสลิปโอนเงิน" };
    }

    return {
        success: true,
        data: {
            sendingBank: slipData.sendingBank,
            bankName: getBankName(slipData.sendingBank),
            transRef: slipData.transRef,
            verified: false,
        },
    };
}

export async function readSlipFromQrImage(
    imageBuffer: Buffer
): Promise<QrResult> {
    const payload = await decodeQrPayloadFromImage(imageBuffer);
    return parseSlipQrPayload(payload);
}
