// ─── POST /api/agent/search ───────────────────────────────────────────────
// Grounded live web search using ADK GOOGLE_SEARCH + GEMINI_MODELS.flash.

export const runtime = "nodejs";
export const maxDuration = 60;

import { runWebSearch } from "@/lib/gemini/agent";

type SearchRequestBody = {
  query?: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_GENAI_API_KEY is not set. Add it to your .env.local file." },
      { status: 400 }
    );
  }

  let body: SearchRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return Response.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const result = await runWebSearch(query);
    return Response.json(result);
  } catch (error) {
    console.error("[search] Grounded search failed:", error);
    return Response.json(
      { error: "Grounded search failed. Check server logs." },
      { status: 500 }
    );
  }
}
