// ─── Gemini Image Generation Utility ─────────────────────────────────────────
// Shared helper used by /api/agent/image and the generate_image ADK tool.

import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODELS } from "./models";

export type ImageModel = "imageFlash" | "imagePro" | "imageLite";
export type AspectRatio =
  | "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
  | "2:3" | "3:2" | "4:5" | "5:4" | "21:9";

export interface GenerateImageOptions {
  /** Which Gemini image model to use. Defaults to "imageFlash". */
  model?: ImageModel;
  /** Desired aspect ratio. Defaults to "16:9". */
  aspectRatio?: AspectRatio;
  /** Optional negative prompt — things to avoid in the image. */
  negativePrompt?: string;
  /** Number of images to generate (1-4). Defaults to 1. */
  numberOfImages?: number;
  /** Output resolution: "512" | "1K" | "2K" | "4K". Defaults to "1K". Not supported by imageLite. */
  imageSize?: "512" | "1K" | "2K" | "4K";
  /** Optional reference image data URL for image-to-image generation. */
  referenceImage?: string;
}

export interface GeneratedImage {
  /** Base64 data URL, e.g. "data:image/png;base64,..." */
  dataUrl: string;
  mimeType: string;
}

/**
 * Generate one or more images using Gemini image generation.
 * Returns an array of base64 data URLs.
 */
export async function generateImageData(
  apiKey: string,
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<GeneratedImage[]> {
  const {
    model = "imageFlash",
    aspectRatio = "16:9",
    negativePrompt,
    numberOfImages = 1,
    imageSize = "1K",
    referenceImage,
  } = options;

  const ai = new GoogleGenAI({ apiKey });
  const policyAvoidTerms =
    "arrows, callouts, annotation graphics, bounding boxes, highlight rings, pointer icons, cursor icons, overlay labels, guide marks";

  let fullPrompt = prompt;
  // Enforce clean base images; annotation graphics are added in Remotion overlays.
  if (referenceImage) {
    fullPrompt = `TRANSFORM THIS IMAGE: ${prompt}. ` +
      "Maintain subject consistency and style from the reference. ";
  }
  
  fullPrompt +=
    " Generate a clean base image only. Do not include embedded text, labels, captions, watermarks, logos, UI text, arrows, callouts, annotation graphics, bounding boxes, highlight rings, or pointer/cursor marks.";
  fullPrompt += ` Avoid the following in the image: ${policyAvoidTerms}.`;
  if (negativePrompt) {
    fullPrompt += ` Also avoid the following in the image: ${negativePrompt}.`;
  }

  // gemini-2.5-flash-image (imageLite) doesn't support imageSize
  const imageConfig: Record<string, string | number> = { aspectRatio };
  if (model !== "imageLite") imageConfig.imageSize = imageSize;
  imageConfig.numberOfImages = Math.max(1, Math.min(4, Math.floor(numberOfImages)));

  const contents: any[] = [{ text: fullPrompt }];

  if (referenceImage) {
    let finalDataUrl = referenceImage;
    // If it's a remote URL, fetch and encode it
    if (!referenceImage.startsWith("data:")) {
      try {
        const resp = await fetch(referenceImage);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = resp.headers.get("content-type") || "image/png";
          finalDataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
        }
      } catch (err) {
        console.warn("[image] Failed to fetch remote referenceImage:", err);
      }
    }

    // Expected format: "data:image/png;base64,..."
    if (finalDataUrl.startsWith("data:")) {
      const [mime, data] = finalDataUrl.split(";base64,");
      const mimeType = mime.split(":")[1] || "image/png";
      contents.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODELS[model],
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig,
    },
  });

  const images: GeneratedImage[] = [];
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data && part.inlineData.mimeType) {
      images.push({
        dataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
        mimeType: part.inlineData.mimeType,
      });
    }
  }

  if (images.length === 0) {
    throw new Error(
      "Image generation returned no image data. " +
        "Check that the model supports image output and the prompt is valid."
    );
  }

  return images;
}

