// ─── POST /api/agent/understand ────────────────────────────────────────────
// Multimodal media analysis using GEMINI_MODELS.flash + Zod structured output.
// Accepts image, video, audio, or PDF — as base64 data URL, remote URL, or YouTube URL.
//
// Body: { fileUrl?: string, base64Data?: string, mimeType?: string,
//         fileType?: "image"|"video"|"pdf"|"text"|"audio",
//         question?: string, structured?: boolean }
//
// YouTube: pass a youtube.com or youtu.be URL as fileUrl with fileType:"video". No mimeType needed.
// structured:true — audio: per-segment transcription; video: timestamped event log
// Supported audio MIME types: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac
// Supported video MIME types: video/mp4, video/mpeg, video/mov, video/avi, video/webm, video/3gpp

export const runtime = "nodejs";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";
import { GEMINI_MODELS } from "@/lib/gemini/models";
import { BUCKET_NAME, getDownloadUrl } from "@/lib/gcs";
import {
  ImageAnalysisSchema,
  VideoAnalysisSchema,
  VideoTranscriptionSchema,
  PdfAnalysisSchema,
  AudioAnalysisSchema,
  AudioTranscriptionSchema,
  type AnyAnalysisResult,
} from "@/lib/gemini/schemas";

// ─── Types ────────────────────────────────────────────────────────────────────────────

type RequestBody = {
  fileUrl?: string;
  base64Data?: string;
  /** MIME type of the file. Optional for YouTube URLs — Gemini resolves it automatically. */
  mimeType?: string;
  fileType?: "image" | "video" | "pdf" | "text" | "audio";
  question?: string;
  /**
   * audio: per-segment timestamped transcription with per-segment emotion
   * video: key-event log with MM:SS timestamps
   */
  structured?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]+/;

function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_RE.test(url);
}

type MediaPart =
  | { type: "image"; image: Uint8Array | URL }
  | { type: "file"; data: Uint8Array | URL; mediaType: string };

function base64ToBytes(base64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

const EXTENSION_MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/mov",
  mpeg: "video/mpeg",
  mpg: "video/mpeg",
  avi: "video/avi",
  webm: "video/webm",
  "3gp": "video/3gpp",
  "3gpp": "video/3gpp",
  wav: "audio/wav",
  mp3: "audio/mp3",
  aiff: "audio/aiff",
  aac: "audio/aac",
  ogg: "audio/ogg",
  flac: "audio/flac",
  m4a: "audio/mp4",
};

function inferMimeFromName(name: string): string | null {
  const clean = name.split("?")[0]?.split("#")[0] ?? "";
  const dot = clean.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = clean.slice(dot + 1).toLowerCase();
  return EXTENSION_MIME_MAP[ext] ?? null;
}

function defaultMimeForFileType(fileType: RequestBody["fileType"]): string {
  switch (fileType) {
    case "video":
      return "video/mp4";
    case "audio":
      return "audio/mpeg";
    case "pdf":
      return "application/pdf";
    case "text":
      return "text/plain";
    case "image":
    default:
      return "image/jpeg";
  }
}

function resolveEffectiveMimeType(args: {
  providedMimeType?: string;
  dataUrlMimeType?: string;
  sourceHint?: string;
  fileType: RequestBody["fileType"];
}): string {
  const provided = args.providedMimeType?.trim();
  if (provided && provided.toLowerCase() !== "application/octet-stream") {
    return provided;
  }

  const dataUrlMime = args.dataUrlMimeType?.trim();
  if (dataUrlMime && dataUrlMime.toLowerCase() !== "application/octet-stream") {
    return dataUrlMime;
  }

  const inferredFromName = args.sourceHint ? inferMimeFromName(args.sourceHint) : null;
  if (inferredFromName) {
    return inferredFromName;
  }

  return defaultMimeForFileType(args.fileType);
}

async function resolveAnalyzableUrl(inputUrl: string): Promise<{ resolvedUrl: string; sourceHint: string }> {
  if (inputUrl.startsWith("uploads/")) {
    return {
      resolvedUrl: await getDownloadUrl(inputUrl),
      sourceHint: inputUrl,
    };
  }

  if (inputUrl.startsWith("gs://")) {
    const match = inputUrl.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (!match) {
      throw new Error("Invalid gs:// URI format.");
    }

    const bucket = match[1];
    const objectPath = match[2];
    if (bucket !== BUCKET_NAME) {
      throw new Error(`Unsupported gs:// bucket '${bucket}'.`);
    }

    return {
      resolvedUrl: await getDownloadUrl(objectPath),
      sourceHint: objectPath,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    throw new Error("Invalid fileUrl. Provide an https URL, gs:// URI, or uploads/... storage key.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Unsupported fileUrl protocol. Use https URL, gs:// URI, or uploads/... storage key.");
  }

  return {
    resolvedUrl: inputUrl,
    sourceHint: inputUrl,
  };
}

// ─── Route handler ─────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GOOGLE_GENAI_API_KEY is not set." }, { status: 400 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fileUrl, base64Data, mimeType = "", fileType = "image", question, structured = false } = body;

  if (!fileUrl && !base64Data) {
    return Response.json({ error: "Provide either fileUrl or base64Data" }, { status: 400 });
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });

    // ── Resolve raw base64 string (strip data URL prefix if present) ─────────
    let rawBase64: string | null = null;
    let dataUrlMimeType: string | undefined;

    if (base64Data) {
      rawBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
    } else if (fileUrl?.startsWith("data:")) {
      const m = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return Response.json({ error: "Invalid data URL" }, { status: 400 });
      dataUrlMimeType = m[1];
      rawBase64 = m[2];
    }

    const effectiveMimeType = resolveEffectiveMimeType({
      providedMimeType: mimeType,
      dataUrlMimeType,
      sourceHint: fileUrl,
      fileType,
    });

    // ── Build media part ────────────────────────────────────────────────
    let mediaPart: MediaPart;

    if (rawBase64) {
      mediaPart = effectiveMimeType.startsWith("image/")
        ? { type: "image", image: base64ToBytes(rawBase64) }
        : { type: "file", data: base64ToBytes(rawBase64), mediaType: effectiveMimeType };
    } else if (fileUrl) {
      if (isYouTubeUrl(fileUrl)) {
        // YouTube: pass URL directly — Gemini resolves the video without a mimeType
        mediaPart = { type: "file", data: new URL(fileUrl), mediaType: "video/*" };
      } else {
        let normalized;
        try {
          normalized = await resolveAnalyzableUrl(fileUrl);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid fileUrl.";
          return Response.json({ error: message }, { status: 400 });
        }

        const url = new URL(normalized.resolvedUrl);
        const urlMimeType = resolveEffectiveMimeType({
          providedMimeType: mimeType,
          sourceHint: normalized.sourceHint,
          fileType,
        });

        mediaPart = urlMimeType.startsWith("image/")
          ? { type: "image", image: url }
          : { type: "file", data: url, mediaType: urlMimeType };
      }
    } else {
      return Response.json({ error: "No file data provided" }, { status: 400 });
    }

    // ── Pick schema + prompt ───────────────────────────────────────────────
    const { schema, prompt } = resolveSchemaAndPrompt(fileType, question, structured);

    // ── Generate structured output ──────────────────────────────────────────
    const { object } = await generateObject({
      model: google(GEMINI_MODELS.flash) as unknown as LanguageModel,
      schema,
      messages: [
        {
          role: "user",
          content: [mediaPart, { type: "text", text: prompt }],
        },
      ],
    });

    return Response.json(object as AnyAnalysisResult);
  } catch (error) {
    console.error("[understand] Analysis error:", error);
    return Response.json({ error: "Media analysis failed. Check server logs." }, { status: 500 });
  }
}

// ─── Schema + prompt resolver ────────────────────────────────────────────────────────────

function resolveSchemaAndPrompt(
  fileType: string,
  question?: string,
  structured = false
): { schema: z.ZodTypeAny; prompt: string } {
  const q = question ? `Focus on answering: "${question}"\n\n` : "";

  switch (fileType) {
    case "video":
      if (structured) {
        return {
          schema: VideoTranscriptionSchema,
          prompt:
            `${q}Analyze this video and produce a detailed timestamped event log. ` +
            `For each key moment, include the MM:SS timestamp, a description of what is ` +
            `happening visually, any spoken content at that moment, and the dominant emotion ` +
            `of the speaker if present. Cover all meaningful changes in scene, action, or dialogue. ` +
            `Also provide an overall description, a concise summary, dominant colors as hex codes, ` +
            `relevant keyword tags, and text overlay ideas for video production.`,
        };
      }
      return {
        schema: VideoAnalysisSchema,
        prompt:
          `${q}Analyze this video. Describe its content, extract relevant tags, ` +
          `identify key spoken content or narration, detect dominant colors as hex codes, ` +
          `and suggest text overlay ideas for video production.`,
      };

    case "pdf":
    case "text":
      return {
        schema: PdfAnalysisSchema,
        prompt:
          `${q}Analyze this document. Write a concise description, extract key points, ` +
          `generate relevant tags, and suggest text overlay ideas.`,
      };

    case "audio":
      if (structured) {
        return {
          schema: AudioTranscriptionSchema,
          prompt:
            `${q}Transcribe and analyze this audio in detail. ` +
            `Provide a per-segment breakdown with accurate MM:SS timestamps. ` +
            `Detect the language of each segment, translate non-English segments to English, ` +
            `and identify the dominant emotion for each segment and overall.`,
        };
      }
      return {
        schema: AudioAnalysisSchema,
        prompt:
          `${q}Analyze this audio clip. Describe the content, provide a brief summary and ` +
          `transcription of what is spoken, detect the primary language, identify the dominant ` +
          `emotion, and suggest text overlay ideas for video production.`,
      };

    case "image":
    default:
      return {
        schema: ImageAnalysisSchema,
        prompt:
          `${q}Analyze this image. Describe its content in 1-2 sentences, identify all notable ` +
          `objects and any visible text, extract the dominant colors as hex codes, generate ` +
          `relevant keyword tags, and suggest text overlay ideas for video production.`,
      };
  }
}

// ─── GET — capability info ─────────────────────────────────────────────────────

export async function GET() {
  return Response.json({
    supportedTypes: ["image", "video", "pdf", "audio"],
    youtubeSupport: true,
    model: GEMINI_MODELS.flash,
    structuredOutput: true,
    notes: {
      youtube: "Pass a youtube.com or youtu.be URL as fileUrl with fileType:'video'. mimeType not required.",
      storage: "fileUrl also accepts gs://<bucket>/<path> and uploads/<path> storage keys.",
      structured: "Set structured:true for timestamped breakdowns — works for both audio and video.",
    },
    schemas: {
      image: "description, tags, colorPalette, detectedContent, suggestedOverlays",
      video: "description, tags, transcript?, colorPalette, suggestedOverlays",
      "video+structured": "description, summary, tags, duration?, colorPalette, events[{timestamp, description, transcript?, emotion?}], suggestedOverlays",
      pdf: "description, tags, keyPoints, suggestedOverlays",
      audio: "description, summary, tags, language, languageCode, transcript?, emotion, suggestedOverlays",
      "audio+structured": "description, summary, tags, language, languageCode, emotion, segments[{timestamp, content, language, languageCode, translation?, emotion}]",
    },
  });
}
