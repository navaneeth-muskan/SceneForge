export const runtime = "nodejs";

import { getDownloadUrl, uploadBuffer } from "@/lib/gcs";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "file is required" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = sanitizeFileName(file.name);
    const key = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

    const gsUri = await uploadBuffer(
      buffer,
      key,
      file.type || "application/octet-stream",
    );
    const downloadUrl = await getDownloadUrl(key);

    return Response.json({
      success: true,
      fileName: key,
      gsUri,
      downloadUrl,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
