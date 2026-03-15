// ─── POST /api/agent/analyze-region ────────────────────────────────────────
// On-demand image-region analysis.
// Body: { imageDataUrl: string, bbox?: [ymin, xmin, ymax, xmax] (0-100), query?: string }
// Returns: { annotations: RegionAnnotation[] }

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { analyzeImageRegions } from "@/lib/gemini/region-analyzer";

type RequestBody = {
  imageDataUrl: string;
  /** Drawn bounding-box hint in normalised 0-100 coords [ymin, xmin, ymax, xmax] */
  bbox?: [number, number, number, number];
  query?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_GENAI_API_KEY not configured" }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageDataUrl, bbox, query } = body;
  if (!imageDataUrl || !imageDataUrl.startsWith("data:")) {
    return NextResponse.json({ error: "imageDataUrl is required and must be a data: URL" }, { status: 400 });
  }

  // Build a combined query hint from the drawn bbox + user text
  const bboxHint = bbox
    ? `Focus your analysis on the rectangular region bounded by ymin=${bbox[0].toFixed(1)}%, xmin=${bbox[1].toFixed(1)}%, ymax=${bbox[2].toFixed(1)}%, xmax=${bbox[3].toFixed(1)}% (0-100 scale). That is the area the user explicitly selected.`
    : undefined;

  const combinedQuery = [bboxHint, query].filter(Boolean).join(" ");

  try {
    const annotations = await analyzeImageRegions({
      apiKey,
      imageSource: imageDataUrl,
      query: combinedQuery || undefined,
      maxRegions: bbox ? 3 : 5, // fewer when user drew a box
    });
    return NextResponse.json({ annotations });
  } catch (err) {
    console.error("[analyze-region] analysis failed:", err);
    return NextResponse.json({ error: "Region analysis failed" }, { status: 500 });
  }
}
