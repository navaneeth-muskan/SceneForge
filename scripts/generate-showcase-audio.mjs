#!/usr/bin/env node
// ─── Showcase Voiceover Generator ────────────────────────────────────────────
// Calls Gemini TTS to generate a narration track for the showcase video and
// saves it to public/audio/showcase-voiceover.wav.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadEnv() {
  for (const file of[".env.local", ".env"]) {
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
  console.error("\n✗ GOOGLE_GENAI_API_KEY is not set.\n  Add it to .env or .env.local and try again.\n");
  process.exit(1);
}

const FPS = 30;

// ── Per-scene narration (Updated Flowchart script) ────────────────────────────
const SCENES =[
  {
    file: "showcase-01-start.wav",
    text: `Say this as a calm, cinematic product launch narrator.: SceneForge. Agentic Multimodal Motion Graphics Studio.`,
  },
  {
    file: "showcase-02-editor.wav",
    text: `Say this as an enthusiastic but precise product demo narrator: Type your idea. The agent pipeline plans scenes and builds a live Remotion timeline in seconds.`,
  },
  {
    file: "showcase-03-youtube.wav",
    text: `Say this as a focused demo narrator showing one concrete capability: Paste a YouTube URL and SceneForge extracts key moments, summary points, and sequence-ready structure for animation.`,
  },
  {
    file: "showcase-04-website.wav",
    text: `Say this as a precise engineer explaining website analysis in product terms: Paste a website link. The model parses sections and facts, then converts them into highlights and table-like scene data.`,
  },
  {
    file: "showcase-05-upload.wav",
    text: `Say this as a practical systems narrator describing file ingestion: Upload PDFs, images, video, or audio. SceneForge normalizes files into structured outputs for points, highlights, and planned scenes.`,
  },
  {
    file: "showcase-06-examples.wav",
    text: `Say this as a proud creator showing off the final results. High energy, visually descriptive: The result? Breathtaking multimodal motion graphics. Here are just a few examples of what you can generate with SceneForge.`,
  },
  {
    file: "showcase-07-features.wav",
    text: `Say this as a confident feature-overview narrator, clear and energetic: SceneForge combines prompt-to-animation, agentic planning, multimodal understanding, cloud media, and live preview into one workflow.`,
  },
  {
    file: "showcase-08-flowchart.wav",
    text: `Say this as a technical architect calmly walking through a system diagram: The flow starts at the browser and agent panel, passing requests to Next.js API routes. These orchestrate Multimodal, Image, and TTS APIs alongside Gemini Story Planners. Everything converges to compile in Remotion, looping back to a live preview.`,
  },
  {
    file: "showcase-09-stack.wav",
    text: `Say this as a grounded, credible product narrator. No hype, just proof: Next.js, Remotion, Gemini ADK, and Google Cloud Run with GCS media handling, all working together in production.`,
  },
  {
    file: "showcase-10-end.wav",
    text: `Say this as the warm, inspiring close of a product keynote. Slow pace — let the closing line hang in the air: Describe your vision. SceneForge builds the motion.`,
  },
];

function pcmToWav(base64Pcm, sampleRate = 24000, channels = 1) {
  const pcm = Buffer.from(base64Pcm, "base64");
  const dataLen = pcm.length;
  const wav = Buffer.alloc(44 + dataLen);

  wav.write("RIFF", 0, "ascii");
  wav.writeUInt32LE(36 + dataLen, 4);
  wav.write("WAVE", 8, "ascii");
  wav.write("fmt ", 12, "ascii");
  wav.writeUInt32LE(16, 16);            
  wav.writeUInt16LE(1, 20);             
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  const byteRate = sampleRate * channels * 2;
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(channels * 2, 32);  
  wav.writeUInt16LE(16, 34);            
  wav.write("data", 36, "ascii");
  wav.writeUInt32LE(dataLen, 40);
  pcm.copy(wav, 44);

  return wav;
}

const VOICE = "Kore";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

async function generateTts(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities:["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
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

  if (!part?.inlineData) throw new Error("TTS response contained no audio data.");

  const { mimeType, data: base64Audio } = part.inlineData;
  const rateMatch = mimeType.match(/rate=(\d+)/);
  const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

  const rawBytes = Buffer.from(base64Audio, "base64");
  const durationSec = rawBytes.length / (sampleRate * 1 * 2);

  return { wav: pcmToWav(base64Audio, sampleRate), sampleRate, durationSec };
}

async function main() {
  const outDir = path.join(ROOT, "public", "audio");
  fs.mkdirSync(outDir, { recursive: true });
  const timings =[];

  console.log(`\n⟳ Generating ${SCENES.length} scene audio files via Gemini TTS (${VOICE})`);

  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    console.log(`[${i + 1}/${SCENES.length}] ${scene.file}`);

    const { wav, sampleRate, durationSec } = await generateTts(scene.text);
    const outPath = path.join(outDir, scene.file);
    fs.writeFileSync(outPath, wav);

    const durationInFrames = Math.max(1, Math.ceil(durationSec * FPS));
    timings.push({ file: scene.file, durationInFrames, durationSeconds: Number(durationSec.toFixed(3)), sampleRate });
  }

  let cursor = 0;
  const timingsWithOffsets = timings.map((item) => {
    const from = cursor;
    cursor += item.durationInFrames;
    return { ...item, from };
  });

  const timingFilePath = path.join(ROOT, "src", "remotion", "showcase-audio-timings.ts");
  const timingFile =[
    "// Auto-generated by scripts/generate-showcase-audio.mjs",
    "export type ShowcaseAudioTiming = { file: string; from: number; durationInFrames: number; durationSeconds: number; sampleRate: number; };",
    "export const SHOWCASE_AUDIO_TIMINGS: ShowcaseAudioTiming[] =[",
    ...timingsWithOffsets.map((item) => `  { file: "${item.file}", from: ${item.from}, durationInFrames: ${item.durationInFrames}, durationSeconds: ${item.durationSeconds}, sampleRate: ${item.sampleRate} },`),
    "];",
    `export const SHOWCASE_DURATION = ${cursor};`,
    "",
  ].join("\n");

  fs.writeFileSync(timingFilePath, timingFile, "utf8");
  console.log(`✓ All scene audio saved and timings updated. Total duration: ${(cursor / FPS).toFixed(2)}s\n`);
}

main().catch((err) => { console.error("\n✗ Generation failed:", err.message); process.exit(1); });