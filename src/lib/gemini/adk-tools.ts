// ─── Shared ADK FunctionTools ─────────────────────────────────────────────────
// Reusable FunctionTool instances wired into Story Planner and Scene Builder.
// Server-only. Requires GOOGLE_GENAI_API_KEY environment variable.

import { FunctionTool } from "@google/adk";
import { z } from "zod";
import { generateTtsAudio } from "./tts";
import { generateImageData } from "./image";

// Internal base URL for server-to-server calls to Next.js API routes.
function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  );
}

// ── analyze_media ─────────────────────────────────────────────────────────────
// Calls POST /api/agent/understand to extract structured metadata from an asset.
// Useful for both the Story Planner (understand assets before planning) and the
// Scene Builder (get color palette / visual style for a referenced asset).

export const analyzeMediaTool = new FunctionTool({
  name: "analyze_media",
  description:
    "Analyze an uploaded image, video, or audio asset. Returns description, " +
    "color palette, tags, and content details. " +
    "Story Planner: call this for each uploaded asset before committing a plan. " +
    "Scene Builder: call this when an animation references an asset to extract " +
    "its color palette and visual style.",
  parameters: z.object({
    url: z.string().describe("URL or data URL of the asset to analyze."),
    fileType: z
      .enum(["image", "video", "audio", "pdf"])
      .describe("Media type of the asset."),
    mimeType: z
      .string()
      .optional()
      .describe("MIME type of the file, e.g. image/jpeg. Omit for YouTube URLs."),
    question: z
      .string()
      .optional()
      .describe("Optional focused question to guide the analysis response."),
  }),
  execute: async (input) => {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/agent/understand`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl: input.url,
        fileType: input.fileType,
        mimeType: input.mimeType,
        question: input.question,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `analyze_media failed: ${res.status} ${await res.text()}`
      );
    }

    return (await res.json()) as Record<string, unknown>;
  },
});

// ── generate_tts ──────────────────────────────────────────────────────────────
// Generates text-to-speech audio for narration or audio scenes.
// Returns { audioDataUrl } — a base64-encoded data URL of the audio.
// Wired into the Scene Builder so it can resolve TTS during scene generation.

export const generateTtsTool = new FunctionTool({
  name: "generate_tts",
  description:
    "Generate text-to-speech audio for a narration or audio scene. " +
    "Returns a base64 data URL for the generated audio. " +
    "Use this for 'audio' type scenes: call generate_tts with the narration text, " +
    "then commit the returned audioDataUrl via commit_scene_code.",
  parameters: z.object({
    text: z.string().describe("Text to convert to speech."),
    voice: z
      .string()
      .optional()
      .describe(
        "Voice name (optional). Available: Aoede, Charon, Fenrir, Kore, Puck, " +
          "Orbit, Nova, Soleil, Despina, Erinome. Defaults to Aoede."
      ),
  }),
  execute: async (input) => {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY is not set");

    const audioDataUrl = await generateTtsAudio(
      apiKey,
      input.text,
      input.voice ?? "Aoede"
    );
    return { audioDataUrl };
  },
});

// ── generate_image ────────────────────────────────────────────────────────────
// Generates an image from a text prompt using Gemini image models.
// Returns { imageDataUrl } — a base64-encoded data URL of the first generated image.
// Wired into the Scene Builder so "image" scenes can be AI-generated on demand
// rather than relying solely on uploaded assets.

export const generateImageTool = new FunctionTool({
  name: "generate_image",
  description:
    "Generate an image from a text prompt using Gemini image generation. " +
    "Use this for 'image' type scenes when no uploaded asset is available or " +
    "when the scene requires a specific AI-generated visual. " +
    "Returns imageDataUrl — commit it via commit_scene_code({ imageDataUrl }).",
  parameters: z.object({
    prompt: z
      .string()
      .describe(
        "Detailed image description. Include style, mood, colors, composition, and subject. " +
          "Generated images should remain clean base visuals: do not request baked arrows, callouts, boxes, or annotation labels."
      ),
    aspectRatio: z
      .enum(["1:1", "16:9", "9:16", "4:3", "3:4"])
      .optional()
      .describe("Desired aspect ratio. Defaults to 16:9 for landscape video scenes."),
    negativePrompt: z
      .string()
      .optional()
      .describe(
        "Comma-separated list of things to avoid in the image, for example: arrows, callouts, boxes, annotation graphics, text overlays, watermarks."
      ),
    model: z
      .enum(["imageFlash", "imagePro", "imageLite"])
      .optional()
      .describe(
        "Image model to use. imageFlash (default): speed + quality balance. " +
          "imagePro: complex compositions and detailed instruction following. imageLite: fastest, 1K resolution only."
      ),
    referenceImageUrl: z
      .string()
      .url()
      .optional()
      .describe("Optional URL of an uploaded asset or reference image to maintain character/style consistency (image-to-image)."),
  }),
  execute: async (input) => {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY is not set");

    let referenceImageDataUrl: string | undefined = undefined;
    if (input.referenceImageUrl) {
      if (input.referenceImageUrl.startsWith("data:image")) {
        referenceImageDataUrl = input.referenceImageUrl;
      } else {
        const resp = await fetch(input.referenceImageUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = resp.headers.get("content-type") || "image/png";
          referenceImageDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
        }
      }
    }

    const [image] = await generateImageData(apiKey, input.prompt, {
      model: input.model ?? "imageFlash",
      aspectRatio: input.aspectRatio ?? "16:9",
      negativePrompt: input.negativePrompt,
      numberOfImages: 1,
      referenceImage: referenceImageDataUrl,
    });

    return { imageDataUrl: image.dataUrl, mimeType: image.mimeType };
  },
});

// ── generate_svg ─────────────────────────────────────────────────────────────
// Generates SVG code for icons, logos, or illustrations.
// This doesn't call an external generation API but instead prompts the agent
// to output raw SVG code that can be embedded in Remotion scenes.

export const generateSvgTool = new FunctionTool({
  name: "generate_svg",
  description:
    "Generate raw SVG code for an icon, logo, pattern, or illustration. " +
    "Returns the valid SVG string. Use this when a scene requires specific " +
    "vector graphics that aren't available as assets.",
  parameters: z.object({
    description: z.string().describe("Vivid description of the graphic to generate."),
    style: z.enum(["minimal", "detailed", "outline", "flat", "animated"]).describe("Visual style of the SVG."),
    color: z.string().optional().describe("Primary color or theme (hex or name)."),
  }),
  execute: async (input) => {
    // Note: The LLM calling this tool is expected to generate the SVG code 
    // itself in its final response or as part of a chain.
    // However, for this implementation, we return a success signal with the parameters.
    return {
      status: "ready_to_generate",
      ...input,
      message: "Please output the raw SVG code for the described graphic in your next response.",
    };
  },
});

// ── resolve_config ──────────────────────────────────────────────────────────
// Checks status of API keys and project configuration.
// Helps agents decide if they can use certain features (like Mapbox).

export const resolveConfigTool = new FunctionTool({
  name: "resolve_config",
  description:
    "Check availability of API keys and project configuration (e.g. Mapbox). " +
    "Use this before planning scenes that depend on external services.",
  parameters: z.object({
    feature: z.enum(["mapbox", "google_genai", "elevenlabs", "gcs"]).describe("Feature to check."),
  }),
  execute: async (input) => {
    const config: Record<string, boolean> = {
      mapbox: !!process.env.REMOTION_MAPBOX_TOKEN,
      google_genai: !!process.env.GOOGLE_GENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      gcs: !!process.env.BUCKET_NAME && !!process.env.GCP_PROJECT_ID,
    };

    const isAvailable = config[input.feature] ?? false;
    return {
      feature: input.feature,
      isAvailable,
      status: isAvailable ? "Available" : "Not Configured",
      guidance: isAvailable 
        ? `The ${input.feature} feature is ready to use.`
        : `The ${input.feature} feature is not configured. Please use fallback options or ask the user to provide the necessary keys.`
    };
  },
});

// ── edit_image ──────────────────────────────────────────────────────────────
// Transforms an existing image based on a prompt (image-to-image).
// Returns { imageDataUrl } — the base64-encoded data URL of the edited image.

export const editImageTool = new FunctionTool({
  name: "edit_image",
  description:
    "Edit or transform an existing image using Gemini image-to-image. " +
    "Provide a reference image URL and a transformation prompt. " +
    "Returns imageDataUrl of the new transformed image.",
  parameters: z.object({
    referenceUrl: z.string().describe("URL or data URL of the image to edit/transform."),
    prompt: z.string().describe("Description of the transformation to apply (e.g. 'add a brand logo', 'change style to cinematic')."),
    aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).optional().describe("Output aspect ratio."),
  }),
  execute: async (input) => {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY is not set");

    let referenceImageDataUrl = input.referenceUrl;
    if (!referenceImageDataUrl.startsWith("data:image")) {
      const resp = await fetch(referenceImageDataUrl);
      if (resp.ok) {
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = resp.headers.get("content-type") || "image/png";
        referenceImageDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    }

    const [image] = await generateImageData(apiKey, input.prompt, {
      referenceImage: referenceImageDataUrl,
      aspectRatio: input.aspectRatio ?? "16:9",
      model: "imagePro", // Use Pro for better complex editing instructions
      numberOfImages: 1,
    });

    return { imageDataUrl: image.dataUrl, mimeType: image.mimeType };
  },
});
