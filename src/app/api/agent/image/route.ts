// ─── POST /api/agent/image ─────────────────────────────────────────────────
// Gemini image generation endpoint.
//
// Body: {
//   prompt: string,
//   model?: "imageFlash" | "imagePro" | "imageLite",   // default: imageFlash
//   aspectRatio?: "1:1"|"16:9"|"9:16"|"4:3"|"3:4"|"2:3"|"3:2"|"4:5"|"5:4"|"21:9"
//   imageSize?: "512" | "1K" | "2K" | "4K",            // default: 1K
//   negativePrompt?: string,
//   numberOfImages?: number,   // 1-4, default: 1
// }
//
// Response: { images: [{ dataUrl, mimeType }] }
//
// Models:
//   imageFlash  — Nano Banana 2: speed + quality, up to 4K, aspect ratio control
//   imagePro    — Nano Banana Pro: complex instructions, detailed compositions, thinking mode, 4K
//   imageLite   — 2.5 Flash Image: fastest/cheapest, 1K resolution
//
// Policy:
//   Generated images are clean base visuals only. Baked-in arrows, callouts, boxes,
//   and annotation-style overlays are intentionally discouraged and should be added
//   later as timeline overlays in Remotion.

export const runtime = "nodejs";

import { GEMINI_MODELS } from "@/lib/gemini/models";
import {
  generateImageData,
  type ImageModel,
  type AspectRatio,
} from "@/lib/gemini/image";

const VALID_MODELS: ImageModel[] = ["imageFlash", "imagePro", "imageLite"];
const VALID_RATIOS: AspectRatio[] = [
  "1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2", "4:5", "5:4", "21:9",
];
const IMAGE_POLICY_NEGATIVE_PROMPT =
  "arrows, callouts, annotation graphics, bounding boxes, highlight rings, pointer icons, cursor icons, overlay labels";

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_GENAI_API_KEY is not set. Add it to your .env.local file." },
      { status: 400 }
    );
  }

  let body: {
    prompt?: string;
    model?: string;
    aspectRatio?: string;
    imageSize?: string;
    negativePrompt?: string;
    numberOfImages?: number;
    referenceImage?: string;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    prompt,
    model = "imageFlash",
    aspectRatio = "16:9",
    imageSize = "1K",
    negativePrompt,
    numberOfImages = 1,
    referenceImage,
  } = body;

  if (!prompt?.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  if (!VALID_MODELS.includes(model as ImageModel)) {
    return Response.json(
      {
        error: `Invalid model. Use one of: ${VALID_MODELS.join(", ")}`,
        validModels: VALID_MODELS.map((k) => ({
          key: k,
          id: GEMINI_MODELS[k as ImageModel],
        })),
      },
      { status: 400 }
    );
  }

  if (!VALID_RATIOS.includes(aspectRatio as AspectRatio)) {
    return Response.json(
      { error: `Invalid aspectRatio. Use one of: ${VALID_RATIOS.join(", ")}` },
      { status: 400 }
    );
  }

  const count = Math.max(1, Math.min(4, Math.floor(numberOfImages ?? 1)));
  const mergedNegativePrompt = [IMAGE_POLICY_NEGATIVE_PROMPT, negativePrompt?.trim()]
    .filter(Boolean)
    .join(", ");

  try {
    const images = await generateImageData(apiKey, prompt, {
      model: model as ImageModel,
      aspectRatio: aspectRatio as AspectRatio,
      imageSize: imageSize as "512" | "1K" | "2K" | "4K",
      negativePrompt: mergedNegativePrompt || undefined,
      numberOfImages: count,
      referenceImage,
    });

    return Response.json({ images });
  } catch (error) {
    console.error("[image] Generation error:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Image generation failed. Check server logs.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    description: "Gemini image generation — POST /api/agent/image",
    body: {
      prompt: "string (required) — description of the image to generate",
      model: `"imageFlash" | "imagePro" | "imageLite"  (default: imageFlash)`,
      aspectRatio: `"1:1" | "16:9" | "9:16" | "4:3" | "3:4"  (default: 16:9)`,
      negativePrompt: "string (optional) — what to avoid",
      numberOfImages: "number 1-4 (default: 1)",
    },
    models: {
      imageFlash: {
        id: GEMINI_MODELS.imageFlash,
        description: "Nano Banana 2 — best balance; speed + quality; up to 4K; Search grounding",
      },
      imagePro: {
        id: GEMINI_MODELS.imagePro,
        description: "Nano Banana Pro — complex instructions, detailed compositions, thinking mode, 4K",
      },
      imageLite: {
        id: GEMINI_MODELS.imageLite,
        description: "2.5 Flash Image — fastest/cheapest; 1K resolution; no aspectRatio control",
      },
    },
    response: {
      images: "[{ dataUrl: string, mimeType: string }]",
    },
  });
}
