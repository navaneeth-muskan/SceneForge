import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, type LanguageModel } from "ai";
import { GEMINI_MODELS } from "@/lib/gemini/models";
import {
  ImageRegionAnalysisSchema,
  VideoRegionAnalysisSchema,
  type ImageRegionAnalysisResult,
  type RegionAnnotationResult,
  type VideoRegionAnalysisResult,
  type VideoRegionEventResult,
} from "@/lib/gemini/schemas";
import type { RegionAnnotation, RegionAnnotationEvent } from "@/lib/gemini/types";

type MediaPart =
  | { type: "image"; image: Uint8Array | URL }
  | { type: "file"; data: Uint8Array | URL; mediaType: string };

const YOUTUBE_RE = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]+/;

function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_RE.test(url);
}

function parseDataUrl(source: string): { mediaType: string; bytes: Uint8Array } {
  const match = source.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL payload.");
  }

  const [, mediaType, base64] = match;
  return {
    mediaType,
    bytes: Uint8Array.from(Buffer.from(base64, "base64")),
  };
}

function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function sanitizeRegion(region: RegionAnnotationResult): RegionAnnotation {
  const ymin = clampPct(region.bbox[0]);
  const xmin = clampPct(region.bbox[1]);
  const ymax = clampPct(region.bbox[2]);
  const xmax = clampPct(region.bbox[3]);

  const boxYMin = Math.min(ymin, ymax);
  const boxYMax = Math.max(ymin, ymax);
  const boxXMin = Math.min(xmin, xmax);
  const boxXMax = Math.max(xmin, xmax);

  return {
    label: region.label.trim() || "Highlighted region",
    explanation: region.explanation.trim() || "Important visual element in this scene.",
    bbox: [boxYMin, boxXMin, boxYMax, boxXMax],
    point: [clampPct(region.point[0]), clampPct(region.point[1])],
    confidence: region.confidence,
  };
}

function sanitizeEvent(event: VideoRegionEventResult): RegionAnnotationEvent {
  return {
    ...sanitizeRegion(event),
    timestamp: event.timestamp,
  };
}

function buildMediaPart(source: string, type: "image" | "video"): MediaPart {
  if (source.startsWith("data:")) {
    const { mediaType, bytes } = parseDataUrl(source);
    if (type === "image") {
      return { type: "image", image: bytes };
    }

    return { type: "file", data: bytes, mediaType };
  }

  const url = new URL(source);

  if (type === "image") {
    return { type: "image", image: url };
  }

  if (isYouTubeUrl(source)) {
    return { type: "file", data: url, mediaType: "video/*" };
  }

  return { type: "file", data: url, mediaType: "video/*" };
}

export async function analyzeImageRegions(params: {
  apiKey: string;
  imageSource: string;
  query?: string;
  maxRegions?: number;
}): Promise<RegionAnnotation[]> {
  const { apiKey, imageSource, query, maxRegions = 5 } = params;
  const google = createGoogleGenerativeAI({ apiKey });
  const mediaPart = buildMediaPart(imageSource, "image");

  const prompt = [
    "Analyze this image and return high-value visual callouts for an educational/explainer video.",
    `Return up to ${Math.max(1, Math.min(8, maxRegions))} regions.`,
    "For each region include:",
    "- label",
    "- one-sentence explanation",
    "- point [y, x] in normalized 0-100 coordinates as the primary visible callout anchor",
    "- bbox [ymin, xmin, ymax, xmax] in normalized 0-100 coordinates only as an approximate internal region for layout guidance",
    "Focus on visually distinct and meaningful parts, avoid duplicates.",
    "Do not think in terms of drawing rectangular boundary boxes. The final overlay will use the point for an arrow, cursor, spotlight, and short explanation.",
    query ? `User focus request: ${query}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { object } = await generateObject({
    model: google(GEMINI_MODELS.flash) as unknown as LanguageModel,
    schema: ImageRegionAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [mediaPart, { type: "text", text: prompt }],
      },
    ],
  });

  const typed = object as ImageRegionAnalysisResult;
  return (typed.regions ?? []).map(sanitizeRegion);
}

export async function analyzeVideoRegions(params: {
  apiKey: string;
  videoSource: string;
  query?: string;
  maxEvents?: number;
}): Promise<RegionAnnotationEvent[]> {
  const { apiKey, videoSource, query, maxEvents = 6 } = params;
  const google = createGoogleGenerativeAI({ apiKey });
  const mediaPart = buildMediaPart(videoSource, "video");

  const prompt = [
    "Analyze this video and return timestamped visual callouts for overlays.",
    `Return up to ${Math.max(1, Math.min(10, maxEvents))} events.`,
    "For each event include:",
    "- timestamp in MM:SS",
    "- label",
    "- one-sentence explanation",
    "- point [y, x] in normalized 0-100 coordinates as the primary visible callout anchor",
    "- bbox [ymin, xmin, ymax, xmax] in normalized 0-100 coordinates only as an approximate internal region for layout guidance",
    "Pick moments with clear visual relevance and avoid repeated near-identical events.",
    "Do not optimize for visible rectangular boxes. The final overlay uses a point-led arrow/cursor/callout treatment.",
    query ? `User focus request: ${query}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { object } = await generateObject({
    model: google(GEMINI_MODELS.flash) as unknown as LanguageModel,
    schema: VideoRegionAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [mediaPart, { type: "text", text: prompt }],
      },
    ],
  });

  const typed = object as VideoRegionAnalysisResult;
  return (typed.events ?? []).map(sanitizeEvent);
}
