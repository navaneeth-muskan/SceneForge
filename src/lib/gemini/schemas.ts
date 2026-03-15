// ─── Gemini Structured Output Schemas ────────────────────────────────────────
// Single source of truth for all response shapes used with generateObject.
// TypeScript types are derived via z.infer — no manual duplication.

import { z } from "zod";

const Emotion = z.enum(["happy", "sad", "angry", "neutral"]);

// ── Image ─────────────────────────────────────────────────────────────────────

export const ImageAnalysisSchema = z.object({
  description: z.string().describe("1-2 sentence description of the image."),
  tags: z.array(z.string()).describe("Relevant keyword tags for the image."),
  colorPalette: z
    .array(z.string())
    .describe("Dominant hex color codes extracted from the image, e.g. ['#1a2b3c']."),
  detectedContent: z
    .array(z.string())
    .describe("Objects, text, faces, or notable elements detected in the image."),
  suggestedOverlays: z
    .array(z.string())
    .describe("Ideas for text or graphic overlays suitable for video production."),
});

// ── Image/Video Region Annotation ───────────────────────────────────────────

const Percent = z.preprocess((value) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return value;
  return Math.max(0, Math.min(100, numeric));
}, z.number().min(0).max(100));

export const RegionBBoxSchema = z
  .array(Percent)
  .min(4)
  .max(4)
  .describe("Bounding box as [ymin, xmin, ymax, xmax] normalized to 0-100.");

export const RegionPointSchema = z
  .array(Percent)
  .min(2)
  .max(2)
  .describe("Anchor point as [y, x] normalized to 0-100.");

export const RegionAnnotationSchema = z.object({
  label: z.string().describe("Short label for the highlighted item."),
  explanation: z.string().describe("One-sentence explanation of this highlighted item."),
  bbox: RegionBBoxSchema,
  point: RegionPointSchema,
  confidence: z.number().min(0).max(1).optional(),
});

export const ImageRegionAnalysisSchema = z.object({
  summary: z.string().describe("Brief summary of what was annotated in the image."),
  regions: z
    .array(RegionAnnotationSchema)
    .max(8)
    .describe("Detected and explained regions, ordered by relevance."),
});

export const VideoRegionEventSchema = RegionAnnotationSchema.extend({
  timestamp: z.string().describe("MM:SS timestamp for when this highlighted item appears."),
});

export const VideoRegionAnalysisSchema = z.object({
  summary: z.string().describe("Brief summary of what was annotated in the video."),
  events: z
    .array(VideoRegionEventSchema)
    .max(10)
    .describe("Timestamped region annotations in chronological order."),
});

// ── Video ─────────────────────────────────────────────────────────────────────

export const VideoAnalysisSchema = z.object({
  description: z.string().describe("1-3 sentence description of the video content."),
  tags: z.array(z.string()).describe("Relevant keyword tags for the video."),
  transcript: z
    .string()
    .optional()
    .describe("Key spoken content or narration if any."),
  colorPalette: z
    .array(z.string())
    .describe("Dominant hex color codes from the video."),
  suggestedOverlays: z
    .array(z.string())
    .describe("Ideas for text or graphic overlays suitable for video production."),
});

// ── PDF / Document ────────────────────────────────────────────────────────────

export const PdfAnalysisSchema = z.object({
  description: z.string().describe("Concise summary of the document."),
  tags: z.array(z.string()).describe("Relevant keyword tags for the document."),
  keyPoints: z.array(z.string()).describe("Key points or facts extracted from the document."),
  suggestedOverlays: z
    .array(z.string())
    .describe("Text overlay suggestions based on the document content."),
});

// ── Audio — summary mode ──────────────────────────────────────────────────────

export const AudioAnalysisSchema = z.object({
  description: z.string().describe("1-2 sentence description of the audio content."),
  summary: z.string().describe("Brief summary of what was said or what the audio contains."),
  tags: z.array(z.string()).describe("Relevant keyword tags for the audio."),
  language: z.string().describe("Primary spoken language name, e.g. 'English'."),
  languageCode: z.string().describe("BCP-47 language code, e.g. 'en'."),
  transcript: z
    .string()
    .optional()
    .describe("Full or summarized transcription of spoken content."),
  emotion: Emotion.describe("Dominant overall emotion in the audio."),
  suggestedOverlays: z
    .array(z.string())
    .describe("Text overlay ideas based on the audio content."),
});

// ── Audio — structured transcription mode ─────────────────────────────────────

export const AudioSegmentSchema = z.object({
  timestamp: z.string().describe("Segment start time in MM:SS format."),
  content: z.string().describe("Transcribed text for this segment."),
  language: z.string().describe("Language name for this segment."),
  languageCode: z.string().describe("BCP-47 language code for this segment."),
  translation: z
    .string()
    .optional()
    .describe("English translation only if the segment is not in English; omit otherwise."),
  emotion: Emotion.describe("Dominant emotion for this segment."),
});

export const AudioTranscriptionSchema = z.object({
  description: z.string().describe("1-2 sentence description of the audio content."),
  summary: z.string().describe("Concise summary of the full audio."),
  tags: z.array(z.string()).describe("Relevant keyword tags for the audio."),
  language: z.string().describe("Primary spoken language name, e.g. 'English'."),
  languageCode: z.string().describe("BCP-47 language code, e.g. 'en'."),
  emotion: Emotion.describe("Dominant overall emotion across the full audio."),
  segments: z
    .array(AudioSegmentSchema)
    .describe("Per-segment transcription with timestamps and per-segment emotion."),
});

// ── Video — structured event/segment mode ────────────────────────────────────

export const VideoEventSchema = z.object({
  timestamp: z.string().describe("Event start time in MM:SS format."),
  description: z.string().describe("What is happening visually at this moment."),
  transcript: z.string().optional().describe("Any spoken content at this moment."),
  emotion: Emotion.optional().describe("Dominant emotion of the speaker if present."),
});

export const VideoTranscriptionSchema = z.object({
  description: z.string().describe("1-3 sentence description of the full video."),
  summary: z.string().describe("Concise summary of the video content."),
  tags: z.array(z.string()).describe("Relevant keyword tags for the video."),
  duration: z
    .string()
    .optional()
    .describe("Estimated total duration in MM:SS format if determinable."),
  colorPalette: z
    .array(z.string())
    .describe("Dominant hex color codes from the video."),
  events: z
    .array(VideoEventSchema)
    .describe("Key timestamped events in chronological order, sampled at meaningful moments."),
  suggestedOverlays: z
    .array(z.string())
    .describe("Ideas for text or graphic overlays for video production."),
});

// ── Inferred TypeScript types ─────────────────────────────────────────────────

export type ImageAnalysisResult = z.infer<typeof ImageAnalysisSchema>;
export type VideoAnalysisResult = z.infer<typeof VideoAnalysisSchema>;
export type RegionAnnotationResult = z.infer<typeof RegionAnnotationSchema>;
export type ImageRegionAnalysisResult = z.infer<typeof ImageRegionAnalysisSchema>;
export type VideoRegionEventResult = z.infer<typeof VideoRegionEventSchema>;
export type VideoRegionAnalysisResult = z.infer<typeof VideoRegionAnalysisSchema>;
export type VideoEventResult = z.infer<typeof VideoEventSchema>;
export type VideoTranscriptionResult = z.infer<typeof VideoTranscriptionSchema>;
export type PdfAnalysisResult = z.infer<typeof PdfAnalysisSchema>;
export type AudioAnalysisResult = z.infer<typeof AudioAnalysisSchema>;
export type AudioSegmentResult = z.infer<typeof AudioSegmentSchema>;
export type AudioTranscriptionResult = z.infer<typeof AudioTranscriptionSchema>;

/** Union of all possible structured output results from /api/agent/understand */
export type AnyAnalysisResult =
  | ImageAnalysisResult
  | VideoAnalysisResult
  | VideoTranscriptionResult
  | PdfAnalysisResult
  | AudioAnalysisResult
  | AudioTranscriptionResult;
