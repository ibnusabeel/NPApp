import { messagingApi } from "@line/bot-sdk";
const { MessagingApiClient, MessagingApiBlobClient } = messagingApi;

export function createLineClient() {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const channelSecret = process.env.LINE_CHANNEL_SECRET;

    if (!channelAccessToken || !channelSecret) {
        throw new Error(
            "LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET is not configured",
        );
    }

    return {
        client: new MessagingApiClient({ channelAccessToken }),
        blobClient: new MessagingApiBlobClient({ channelAccessToken }),
        channelSecret,
    };
}

export async function downloadImageContent(
    blobClient: any,
    messageId: string,
): Promise<Buffer> {
    const stream = await blobClient.getMessageContent(messageId);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
}
