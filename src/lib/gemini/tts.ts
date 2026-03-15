// ─── Gemini TTS Utility ───────────────────────────────────────────────────────
// Shared helper used by both story/route.ts and the generate_tts ADK tool.
// Requires GOOGLE_GENAI_API_KEY environment variable.

import { GEMINI_MODELS } from "./models";

export interface WavResult {
  dataUrl: string;
  /** Exact audio duration derived from WAV byte count — not an AI estimate. */
  durationSeconds: number;
}

/**
 * Convert a raw PCM base64 payload (audio/L16;rate=N) to a proper WAV data URL.
 * Returns both the data URL and the precise audio duration in seconds.
 */
export function pcmToWavDataUrl(base64Pcm: string, sampleRate = 24000, channels = 1): WavResult {
  const pcmBytes = Uint8Array.from(Buffer.from(base64Pcm, "base64"));
  const dataLen = pcmBytes.length;
  const wav = new Uint8Array(44 + dataLen);
  const dv = new DataView(wav.buffer);

  // RIFF/WAVE header
  wav.set([82, 73, 70, 70], 0);         // "RIFF"
  dv.setUint32(4, 36 + dataLen, true);  // chunk size
  wav.set([87, 65, 86, 69], 8);         // "WAVE"

  // fmt chunk
  wav.set([102, 109, 116, 32], 12);     // "fmt "
  dv.setUint32(16, 16, true);           // subchunk1Size (PCM = 16)
  dv.setUint16(20, 1, true);            // AudioFormat = PCM
  dv.setUint16(22, channels, true);
  dv.setUint32(24, sampleRate, true);
  const byteRate = sampleRate * channels * 2;
  dv.setUint32(28, byteRate, true);     // byteRate
  dv.setUint16(32, channels * 2, true); // blockAlign
  dv.setUint16(34, 16, true);           // bitsPerSample

  // data chunk
  wav.set([100, 97, 116, 97], 36);      // "data"
  dv.setUint32(40, dataLen, true);
  wav.set(pcmBytes, 44);

  const dataUrl = `data:audio/wav;base64,${Buffer.from(wav.buffer).toString("base64")}`;
  const durationSeconds = dataLen / byteRate;
  return { dataUrl, durationSeconds };
}

/**
 * Generate text-to-speech audio via Gemini TTS.
 * Returns a WAV data URL and the precise audio duration in seconds.
 */

// Canonical set of voice names accepted by the Gemini TTS API
const VALID_TTS_VOICES = new Set([
  "achernar", "achird", "algenib", "algieba", "alnilam",
  "aoede", "autonoe", "callirrhoe", "charon", "despina",
  "enceladus", "erinome", "fenrir", "gacrux", "iapetus",
  "kore", "laomedeia", "leda", "orus", "puck", "pulcherrima",
  "rasalgethi", "sadachbia", "sadaltager", "schedar", "sulafat",
  "umbriel", "vindemiatrix", "zephyr", "zubenelgenubi",
]);

export async function generateTtsAudio(
  apiKey: string,
  text: string,
  voice = "aoede"
): Promise<WavResult> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${GEMINI_MODELS.tts}:generateContent?key=${apiKey}`;

  // Normalise voice: lowercase and fall back to "aoede" if the LLM picked
  // a name that isn't in the supported set (e.g. "Nova", "Orbit").
  const normVoice = voice.toLowerCase();
  const safeVoice = VALID_TTS_VOICES.has(normVoice) ? normVoice : "aoede";

  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: safeVoice } },
      },
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    throw new Error(`TTS API error: ${resp.status} ${await resp.text()}`);
  }

  const data = (await resp.json()) as {
    candidates?: {
      content?: {
        parts?: { inlineData?: { mimeType: string; data: string } }[];
      };
    }[];
  };

  const part = data.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData) {
    throw new Error("TTS response contained no audio data");
  }

  // Gemini returns raw PCM (audio/L16); convert to WAV so browsers can play it
  if (part.inlineData.mimeType.startsWith("audio/L16") || part.inlineData.mimeType.includes("pcm")) {
    const rateMatch = part.inlineData.mimeType.match(/rate=(\d+)/);
    const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
    return pcmToWavDataUrl(part.inlineData.data, sampleRate);
  }

  // Non-PCM fallback — estimate duration as unknown (0 signals to use planned duration)
  return { dataUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`, durationSeconds: 0 };
}
