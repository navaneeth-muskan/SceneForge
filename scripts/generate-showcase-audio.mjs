#!/usr/bin/env node
// ─── Showcase Voiceover Generator ────────────────────────────────────────────
// Calls Gemini TTS to generate a narration track for the showcase video and
// saves it to public/audio/showcase-voiceover.wav.
//
// Usage:
//   npm run generate:audio
//   # or directly:
//   node scripts/generate-showcase-audio.mjs
//
// Requires: GOOGLE_GENAI_API_KEY in .env or .env.local
// Output:   public/audio/showcase-voiceover.wav  (~30 s, matches ShowcaseComp)
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Load env files (.env.local takes precedence over .env) ────────────────────
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(ROOT, file);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
    console.log(`  env loaded from ${file}`);
    break;
  }
}

loadEnv();

const API_KEY = process.env.GOOGLE_GENAI_API_KEY;
if (!API_KEY) {
  console.error(
    "\n✗ GOOGLE_GENAI_API_KEY is not set.\n" +
    "  Add it to .env or .env.local and try again.\n"
  );
  process.exit(1);
}

const FPS = 30;

// ── Per-scene narration ───────────────────────────────────────────────────────
// Text is trimmed to fit each scene's frame budget (durationInFrames / 30fps).
// At ~2.3 words/second a 5.7 s scene fits ~13 words comfortably.
// The frame budget is used at the end to warn if any generated audio overflows.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENT: Instead of a plain transcript, each scene gets a full director-
// style prompt. The TTS model is an LLM — it should understand the scene brief
// and narrate what the viewer *sees*, not read code or lists literally.
//
// Prompt structure (from Gemini TTS prompting guide):
//   AUDIO PROFILE  — who is speaking
//   SCENE          — visual context
//   DIRECTOR'S NOTES — style / pace / tone
//   TRANSCRIPT     — the actual words to speak
//
// The TRANSCRIPT is intentionally short to fit each scene's frame budget.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Each scene uses the inline "Say [director note]: [transcript]" format from
// the TTS prompting guide — unambiguous about what gets spoken while still
// controlling style, pace, and tone.
// ─────────────────────────────────────────────────────────────────────────────
const SCENES = [
  {
    file: "showcase-01-start.wav",
    frames: 130, // 4.3 s — ident card
    text: `Say this as a calm, cinematic product launch narrator.:

SceneForge. Agentic Multimodal Motion Graphics Studio.`,
  },
  {
    file: "showcase-02-editor.wav",
    frames: 200, // 6.7 s
    text: `Say this as an enthusiastic but precise product demo narrator, like a senior engineer showing off their best work. Keep energy up, pace moderate:

Type your idea. The agent pipeline plans scenes and builds a live Remotion timeline in seconds.`,
  },
  {
    file: "showcase-03-features.wav",
    frames: 170, // 5.7 s
    text: `Say this as a confident product narrator reading a feature overview — convey breadth and completeness, not listing. Clear and assured:

Eight proven capabilities: prompt-to-animation, agentic story pipelines, multimodal input, image workflows, narration, and live cloud-backed preview.`,
  },
  {
    file: "showcase-04-flowchart.wav",
    frames: 170, // 5.7 s
    text: `Say this as a technical architect calmly walking through a system diagram — measured, solid, like the architecture itself:

The browser drives API routes that fan out to five Gemini-powered agents. Models, storage, and Remotion all connect to deliver a live preview.`,
  },
  {
    file: "showcase-05-stack.wav",
    frames: 170, // 5.7 s
    text: `Say this as a grounded, credible product narrator. No hype — this is real proof of delivery, not a concept. Steady confidence:

Next.js, Remotion, and Gemini ADK. Cloud Run deployed, storage live, and every layer proven in production.`,
  },
  {
    file: "showcase-06-end.wav",
    frames: 160, // 5.3 s
    text: `Say this as the warm, inspiring close of a product keynote. Slow pace — let the closing line hang in the air and invite the viewer in:

Describe your vision. SceneForge builds the motion.`,
  },
];

// ── PCM (audio/L16) buffer → WAV buffer ──────────────────────────────────────
function pcmToWav(base64Pcm, sampleRate = 24000, channels = 1) {
  const pcm = Buffer.from(base64Pcm, "base64");
  const dataLen = pcm.length;
  const wav = Buffer.alloc(44 + dataLen);

  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + dataLen, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);            // PCM subchunk size
  wav.writeUInt16LE(1, 20);             // PCM format
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  const byteRate = sampleRate * channels * 2;
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(channels * 2, 32);  // blockAlign
  wav.writeUInt16LE(16, 34);            // bitsPerSample
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(dataLen, 40);
  pcm.copy(wav, 44);

  return wav;
}

// ── Call Gemini TTS ────────────────────────────────────────────────────────────
// Voice options (informative/clear voices work well for product demos):
//   "Kore"       — firm and clear
//   "Orus"       — firm
//   "Charon"     — informative
//   "Rasalgethi" — informative
//   "Sadaltager" — knowledgeable
const VOICE = "Kore";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

async function generateTts(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: VOICE },
        },
      },
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini TTS API returned ${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const part = data?.candidates?.[0]?.content?.parts?.[0];

  if (!part?.inlineData) {
    throw new Error(
      "TTS response contained no audio data.\n" +
      "Full response: " + JSON.stringify(data, null, 2)
    );
  }

  const { mimeType, data: base64Audio } = part.inlineData;
  const rateMatch = mimeType.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

  const rawBytes = Buffer.from(base64Audio, "base64");
  const durationSec = rawBytes.length / (sampleRate * 1 * 2);

  console.log(`  received PCM  ${(rawBytes.length / 1024).toFixed(1)} KB`);
  console.log(`  sample rate   ${sampleRate} Hz`);
  console.log(`  duration      ${durationSec.toFixed(2)} s`);

  return {
    wav: pcmToWav(base64Audio, sampleRate),
    sampleRate,
    durationSec,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const outDir = path.join(ROOT, "public", "audio");
  fs.mkdirSync(outDir, { recursive: true });
  const timings = [];

  console.log(`\n⟳ Generating ${SCENES.length} scene audio files via Gemini TTS`);
  console.log(`  model : ${TTS_MODEL}`);
  console.log(`  voice : ${VOICE}\n`);

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    console.log(`  [${i + 1}/${SCENES.length}] ${scene.file}`);
    console.log(`         ${scene.text.split(" ").length} words`);

    const { wav, sampleRate, durationSec } = await generateTts(scene.text);
    const outPath = path.join(outDir, scene.file);
    fs.writeFileSync(outPath, wav);

    const durationInFrames = Math.max(1, Math.ceil(durationSec * FPS));
    timings.push({
      file: scene.file,
      durationInFrames,
      durationSeconds: Number(durationSec.toFixed(3)),
      sampleRate,
    });

    console.log(`         saved → ${durationSec.toFixed(2)} s (${durationInFrames} frames)\n`);
  }

  let cursor = 0;
  const timingsWithOffsets = timings.map((item) => {
    const from = cursor;
    cursor += item.durationInFrames;
    return { ...item, from };
  });

  const timingFilePath = path.join(ROOT, "src", "remotion", "showcase-audio-timings.ts");
  const timingFile = [
    "// Auto-generated by scripts/generate-showcase-audio.mjs",
    "// Run `npm run generate:audio` whenever narration text/voice changes.",
    "",
    "export type ShowcaseAudioTiming = {",
    "  file: string;",
    "  from: number;",
    "  durationInFrames: number;",
    "  durationSeconds: number;",
    "  sampleRate: number;",
    "};",
    "",
    "export const SHOWCASE_AUDIO_TIMINGS: ShowcaseAudioTiming[] = [",
    ...timingsWithOffsets.map(
      (item) =>
        `  { file: "${item.file}", from: ${item.from}, durationInFrames: ${item.durationInFrames}, durationSeconds: ${item.durationSeconds}, sampleRate: ${item.sampleRate} },`
    ),
    "];",
    "",
    `export const SHOWCASE_DURATION = ${cursor};`,
    "",
  ].join("\n");

  fs.writeFileSync(timingFilePath, timingFile, "utf8");

  console.log(`✓ All scene audio saved to public/audio/`);
  console.log(`✓ Timing map written to src/remotion/showcase-audio-timings.ts`);
  console.log(`  Total showcase duration: ${cursor} frames (${(cursor / FPS).toFixed(2)} s)`);
  console.log(`  Refresh your dev server (next dev) to hear them.\n`);
}

main().catch((err) => {
  console.error("\n✗ Generation failed:", err.message);
  process.exit(1);
});
