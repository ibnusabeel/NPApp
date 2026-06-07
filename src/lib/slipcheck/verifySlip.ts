import { checkSlipWithImage, isNonSlipImage, SlipOkResult } from "./slipok";
import { readSlipFromQrImage } from "./qrSlip";

const SLIPOK_QUOTA_CODES = new Set([1003, 1004]);

function isSlipOkQuotaExceeded(result: SlipOkResult | null): boolean {
    return !!(!result?.success && result?.code && SLIPOK_QUOTA_CODES.has(result.code));
}

function isQrFallbackEnabled(): boolean {
    return process.env.QR_FALLBACK !== "false";
}

export interface VerificationResult {
    mode: "slipok" | "qr" | "silent";
    result: SlipOkResult | { success: boolean; data?: any; message?: string };
    slipOkResult?: SlipOkResult;
}

export async function verifySlipImage(
    imageBuffer: Buffer,
    contentType: string = "image/jpeg"
): Promise<VerificationResult> {
    const slipOkResult = await checkSlipWithImage(imageBuffer, contentType);

    if (slipOkResult?.success) {
        return { mode: "slipok", result: slipOkResult };
    }

    if (isNonSlipImage(slipOkResult)) {
        return { mode: "silent", result: slipOkResult };
    }

    if (isSlipOkQuotaExceeded(slipOkResult) && isQrFallbackEnabled()) {
        const qrResult = await readSlipFromQrImage(imageBuffer);
        if (qrResult.success) {
            return {
                mode: "qr",
                result: qrResult,
                slipOkResult,
            };
        }
    }

    return { mode: "slipok", result: slipOkResult };
}
