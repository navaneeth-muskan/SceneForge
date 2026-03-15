import { GEMINI_MODELS } from "@/lib/gemini/models";

export const MODELS = [
  // ── OpenAI ──────────────────────────────────────────────────────────────
  { id: "gpt-5.2:none", name: "GPT-5.2 (No Reasoning)" },
  { id: "gpt-5.2:low", name: "GPT-5.2 (Low Reasoning)" },
  { id: "gpt-5.2:medium", name: "GPT-5.2 (Medium Reasoning)" },
  { id: "gpt-5.2:high", name: "GPT-5.2 (High Reasoning)" },
  { id: "gpt-5.2-pro:medium", name: "GPT-5.2 Pro (Medium)" },
  { id: "gpt-5.2-pro:high", name: "GPT-5.2 Pro (High)" },
  { id: "gpt-5.2-pro:xhigh", name: "GPT-5.2 Pro (XHigh)" },
  // ── Google Gemini ────────────────────────────────────────────────────────
  { id: GEMINI_MODELS.pro, name: "Gemini 3.1 Pro Preview ✦" },
  { id: GEMINI_MODELS.flash, name: "Gemini 3 Flash Preview ⚡" },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];

export type StreamPhase = "idle" | "reasoning" | "generating";

export type GenerationErrorType = "validation" | "api";
