export const runtime = "nodejs";

import { deleteFile } from "@/lib/gcs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { key?: string };
    const key = body.key?.trim();

    if (!key) {
      return Response.json({ error: "key is required" }, { status: 400 });
    }

    if (!key.startsWith("uploads/")) {
      return Response.json({ error: "invalid key" }, { status: 400 });
    }

    await deleteFile(key);
    return Response.json({ success: true, key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
