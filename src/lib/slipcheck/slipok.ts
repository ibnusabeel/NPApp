const SLIPOK_BASE_URL = "https://api.slipok.com/api/line/apikey";

function getConfig() {
    const apiKey = process.env.SLIPOK_API_KEY;
    const branchId = process.env.SLIPOK_BRANCH_ID || "68143";

    if (!apiKey) {
        throw new Error("SLIPOK_API_KEY is not configured");
    }

    return { apiKey, branchId };
}

export interface SlipOkResult {
    success: boolean;
    code?: number;
    message?: string;
    data?: {
        amount?: number;
        paidLocalAmount?: number;
        transDate?: string;
        transTime?: string;
        transRef?: string;
        sender?: {
            displayName?: string;
            name?: string;
            account?: { value?: string };
            bank?: { id?: string };
        };
        receiver?: {
            displayName?: string;
            name?: string;
            account?: { value?: string };
            bank?: { id?: string; name?: string };
        };
        sendingBank?: string;
    };
}

export async function checkSlipWithImage(
    imageBuffer: Buffer,
    contentType: string = "image/jpeg",
): Promise<SlipOkResult> {
    const { apiKey, branchId } = getConfig();
    const log = process.env.SLIPOK_LOG !== "false";

    const ext = contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
          ? "webp"
          : "jpg";

    const form = new FormData();
    form.append(
        "files",
        new Blob([new Uint8Array(imageBuffer)], { type: contentType }),
        `slip.${ext}`,
    );
    form.append("log", String(log));

    const response = await fetch(`${SLIPOK_BASE_URL}/${branchId}`, {
        method: "POST",
        headers: {
            "x-authorization": apiKey,
        },
        body: form,
    });

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return {
            success: false,
            message: text || `SlipOK API error (HTTP ${response.status})`,
        };
    }
}

export async function checkQuota() {
    const { apiKey, branchId } = getConfig();

    const response = await fetch(`${SLIPOK_BASE_URL}/${branchId}/quota`, {
        method: "GET",
        headers: {
            "x-authorization": apiKey,
            "Content-Type": "application/json",
        },
    });

    return response.json();
}

export function formatDate(yyyymmdd: string): string {
    if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
    return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(0, 4)}`;
}

export function formatTime(hhmmss: string): string {
    if (!hhmmss || hhmmss.length < 6) return hhmmss;
    return `${hhmmss.slice(0, 2)}:${hhmmss.slice(2, 4)}:${hhmmss.slice(4, 6)}`;
}

const NON_SLIP_ERROR_CODES = new Set([1000, 1005, 1006, 1007, 1008]);

export function isNonSlipImage(result: SlipOkResult | null): boolean {
    return !!(
        !result?.success &&
        result?.code &&
        NON_SLIP_ERROR_CODES.has(result.code)
    );
}
