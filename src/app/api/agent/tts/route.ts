// ─── POST /api/agent/tts ───────────────────────────────────────────────────
// Text-to-Speech using GEMINI_MODELS.tts.
// Returns a base64 WAV data URL.
//
// Body: { text: string, voice?: string }

export const runtime = "nodejs";

import { GEMINI_MODELS } from "@/lib/gemini/models";
import { pcmToWavDataUrl } from "@/lib/gemini/tts";

const VOICES = [
  // Bright / Upbeat
  "Zephyr",       // Bright
  "Puck",         // Upbeat
  "Laomedeia",    // Upbeat
  "Autonoe",      // Bright
  // Firm / Clear
  "Kore",         // Firm
  "Orus",         // Firm
  "Alnilam",      // Firm
  "Iapetus",      // Clear
  "Erinome",      // Clear
  // Informative / Knowledgeable
  "Charon",       // Informative
  "Rasalgethi",   // Informative
  "Sadaltager",   // Knowledgeable
  // Excitable / Lively
  "Fenrir",       // Excitable
  "Sadachbia",    // Lively
  // Youthful / Easy-going / Casual
  "Leda",         // Youthful
  "Callirrhoe",   // Easy-going
  "Umbriel",      // Easy-going
  "Zubenelgenubi",// Casual
  // Smooth / Soft / Gentle / Warm
  "Algieba",      // Smooth
  "Despina",      // Smooth
  "Achernar",     // Soft
  "Vindemiatrix", // Gentle
  "Sulafat",      // Warm
  // Gravelly / Breathy / Mature / Forward
  "Algenib",      // Gravelly
  "Enceladus",    // Breathy
  "Gacrux",       // Mature
  "Pulcherrima",  // Forward
  // Friendly / Even
  "Achird",       // Friendly
  "Schedar",      // Even
  // Breezy
  "Aoede",        // Breezy
] as const;

export type VoiceName = (typeof VOICES)[number];

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_GENAI_API_KEY is not set." },
      { status: 400 }
    );
  }

  let body: { text: string; voice?: VoiceName };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, voice = "Aoede" } = body;
  if (!text?.trim()) {
    return Response.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS.tts}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: VOICES.includes(voice as VoiceName) ? voice : "Aoede" },
          },
        },
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[tts] API error:", resp.status, errText);
      return Response.json(
        { error: `Gemini TTS error: ${resp.status}` },
        { status: resp.status }
      );
    }

    type TTSResponse = {
      candidates?: {
        content?: {
          parts?: {
            inlineData?: { mimeType: string; data: string };
          }[];
        };
      }[];
    };

    const data = (await resp.json()) as TTSResponse;
    const part = data.candidates?.[0]?.content?.parts?.[0];

    if (!part?.inlineData) {
      return Response.json(
        { error: "TTS returned no audio data. The model may not support this endpoint." },
        { status: 500 }
      );
    }

    // Gemini returns raw PCM (audio/L16); convert to WAV so browsers can play it
    let audioDataUrl: string;
    let responseMimeType = part.inlineData.mimeType;
    if (part.inlineData.mimeType.startsWith("audio/L16") || part.inlineData.mimeType.includes("pcm")) {
      const rateMatch = part.inlineData.mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      audioDataUrl = pcmToWavDataUrl(part.inlineData.data, sampleRate).dataUrl;
      responseMimeType = "audio/wav";
    } else {
      audioDataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }

    return Response.json({
      audioDataUrl,
      mimeType: responseMimeType,
      voice,
      textLength: text.length,
    });
  } catch (error) {
    console.error("[tts] Error:", error);
    return Response.json(
      { error: "TTS generation failed. Check server logs." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    voices: VOICES,
    defaultVoice: "Aoede",
    model: GEMINI_MODELS.tts,
  });
}
