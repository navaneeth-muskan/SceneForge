export const runtime = "nodejs";

import { BUCKET_NAME, bucket, getDownloadUrl } from "@/lib/gcs";

type MediaType = "image" | "video" | "audio" | "document";

function inferMediaType(mimeType: string, name: string): MediaType | null {
  const lower = name.toLowerCase();
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType === "text/plain" ||
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".doc") ||
    lower.endsWith(".docx")
  ) {
    return "document";
  }
  return null;
}

export async function GET() {
  try {
    const [files] = await bucket.getFiles({ prefix: "uploads/" });
    const sorted = [...files].sort((left, right) => {
      const leftTime = new Date(left.metadata.updated ?? 0).getTime();
      const rightTime = new Date(right.metadata.updated ?? 0).getTime();
      return rightTime - leftTime;
    });

    const items = await Promise.all(
      sorted.map(async (file) => {
        const mimeType = file.metadata.contentType ?? "application/octet-stream";
        const name = file.name.split("/").pop() ?? file.name;
        const mediaType = inferMediaType(mimeType, name);
        if (!mediaType) return null;

        const downloadUrl = await getDownloadUrl(file.name);
        return {
          id: file.name,
          name,
          key: file.name,
          gcsUri: `gs://${BUCKET_NAME}/${file.name}`,
          url: downloadUrl,
          type: mediaType,
          mimeType,
          size: Number(file.metadata.size ?? 0),
          updatedAt: file.metadata.updated ?? null,
        };
      })
    );

    return Response.json({ success: true, items: items.filter(Boolean) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list uploads";
    return Response.json({ error: message }, { status: 500 });
  }
}
