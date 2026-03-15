// ─── Gemini Model Config ─────────────────────────────────────────────────────
// Single source of truth for all Gemini model strings used across the app.
// Update here to change models globally.

export const GEMINI_MODELS = {
  /** Deep reasoning, complex planning, agentic workflows — Story Planner */
  pro: "gemini-3.1-pro-preview",

  /** Fast multimodal — Scene Builder, media understanding, validation, skill detection */
  flash: "gemini-3-flash-preview",

  /** Text-to-speech (Flash) — faster, lower cost narration */
  tts: "gemini-2.5-flash-preview-tts",

  /** Text-to-speech (Pro) — higher quality narration, same capabilities */
  ttsPro: "gemini-2.5-pro-preview-tts",

  // ── Image generation (Nano Banana) ───────────────────────────────────────

  /** Nano Banana 2 — best all-round; speed + quality balance; up to 4K; Google Image Search grounding */
  imageFlash: "gemini-3.1-flash-image-preview",

  /** Nano Banana Pro — professional asset production; thinking mode; up to 4K; complex instructions & text */
  imagePro: "gemini-3-pro-image-preview",

  /** Nano Banana (2.5) — fastest/cheapest; high-volume, low-latency; 1K resolution only */
  imageLite: "gemini-2.5-flash-image",
} as const;

export type GeminiModelKey = keyof typeof GEMINI_MODELS;
export type GeminiModelId = (typeof GEMINI_MODELS)[GeminiModelKey];
