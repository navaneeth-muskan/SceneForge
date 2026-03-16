// ─── POST /api/agent/story ─────────────────────────────────────────────────
// Gemini ADK story-building pipeline:
// 1. Story Planner (GEMINI_MODELS.pro) decomposes prompt → SceneSpec[]
// 2. Scene Builders (GEMINI_MODELS.flash, parallel) generate code/text per scene
// 3. TTS (GEMINI_MODELS.tts) for audio narration scenes
//
// Requires: GOOGLE_GENAI_API_KEY environment variable

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "@/lib/gemini/models";
import { runStoryPlanner, runSceneBuilder } from "@/lib/gemini/agent";
import { generateTtsAudio } from "@/lib/gemini/tts";
import { generateImageData } from "@/lib/gemini/image";
import { analyzeImageRegions, analyzeVideoRegions } from "@/lib/gemini/region-analyzer";
import type { AssetRef, BuiltScene, StoryBuildResult, SceneSpec, AgentCapabilities } from "@/lib/gemini/types";
import { DEFAULT_CAPABILITIES } from "@/lib/gemini/types";

// Prevent Next.js edge runtime (needs Node.js for ADK)
export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_GENAI_API_KEY is not set. Add it to your .env.local file." },
      { status: 400 }
    );
  }

  let body: {
    prompt: string;
    assets?: AssetRef[];
    fps?: number;
    durationInFrames?: number;
    capabilities?: Partial<AgentCapabilities>;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, assets = [], fps = 30, capabilities: rawCaps } = body;
  const caps: AgentCapabilities = { ...DEFAULT_CAPABILITIES, ...rawCaps };

  if (!prompt?.trim()) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  try {
    // ── Step 1: Story Planning ──────────────────────────────────────────────
    console.log("[story] Planning with ADK storyPlannerAgent…");
    const { plan, reasoning } = await runStoryPlanner(prompt, assets, caps);
    console.log(`[story] Plan ready: ${plan.scenes.length} scenes — "${plan.title}"`);

    const targetFps = fps;
    const narrationTailBufferFrames = Math.max(2, Math.round(targetFps * 0.15));
    const narrationPauseFrames = Math.max(1, Math.round(targetFps));
    const fitDurationToAudio = (baseFrames: number, ttsDurationSeconds?: number): number => {
      if (!ttsDurationSeconds || ttsDurationSeconds <= 0) return baseFrames;
      // Keep a short tail and explicit breathing room before the next scene.
      const audioFrames = Math.ceil(ttsDurationSeconds * targetFps) + narrationTailBufferFrames + narrationPauseFrames;
      return Math.max(baseFrames, audioFrames);
    };
    const autoAnnotatedSceneIndexes = selectAutoAnnotatedScenes(plan.scenes, assets, caps);

    // ── Step 2: Build each scene in parallel ───────────────────────────────
    const genai = new GoogleGenerativeAI(apiKey);
    const flashModel = genai.getGenerativeModel({ model: GEMINI_MODELS.flash });

    const buildScene = async (scene: SceneSpec): Promise<BuiltScene> => {
      const durationFrames = Math.round(scene.durationSeconds * targetFps);

      switch (scene.type) {
        case "animation": {
          // Use ADK scene builder for animation code
          let code: string;
          let audioDataUrl: string | undefined;
          let audioDurationSeconds: number | undefined;
          let realDurationFrames = durationFrames;
          try {
            const [builderResult, ttsResult] = await Promise.all([
              runSceneBuilder(scene, targetFps, caps),
              caps.generateAudio && scene.narrationText
                ? generateTtsAudio(apiKey!, scene.narrationText, scene.voice)
                : Promise.resolve(undefined),
            ]);
            code = builderResult.code ?? await generateFallbackCode(flashModel, scene, targetFps);
            audioDataUrl = ttsResult?.dataUrl;
            audioDurationSeconds = ttsResult?.durationSeconds;
            realDurationFrames = fitDurationToAudio(durationFrames, audioDurationSeconds);
          } catch (err) {
            console.error(`[scene ${scene.index}] Scene builder error:`, err);
            code = await generateFallbackCode(flashModel, scene, targetFps);
          }
          return {
            index: scene.index,
            type: "animation",
            code,
            audioDataUrl,
            audioDurationSeconds,
            narrationText: scene.narrationText,
            durationFrames: realDurationFrames,
            startFrame: 0, // filled in post loop
            description: scene.description,
          };
        }

        case "title": {
          let audioDataUrl: string | undefined;
          let audioDurationSeconds: number | undefined;
          let realDurationFrames = durationFrames;
          if (caps.generateAudio && scene.narrationText) {
            try {
              const ttsResult = await generateTtsAudio(apiKey!, scene.narrationText, scene.voice);
              audioDataUrl = ttsResult.dataUrl;
              audioDurationSeconds = ttsResult.durationSeconds;
              realDurationFrames = fitDurationToAudio(durationFrames, audioDurationSeconds);
            } catch (err) {
              console.error(`[scene ${scene.index}] Title narration error:`, err);
            }
          }
          return {
            index: scene.index,
            type: "title",
            text: scene.titleText ?? scene.description,
            titlePreset: scene.titlePreset ?? "modern-title",
            audioDataUrl,
            audioDurationSeconds,
            narrationText: scene.narrationText,
            durationFrames: realDurationFrames,
            startFrame: 0,
            description: scene.description,
          };
        }

        case "video": {
          // Video scenes are analysis-only in this app:
          // use uploaded footage for understanding/annotation, then render generated motion graphics instead.
          const matched = matchAsset(scene.assetHint ?? scene.description, assets, ["video"]);
          let audioDataUrl: string | undefined;
          let audioDurationSeconds: number | undefined;
          let regionAnnotationEvents: BuiltScene["regionAnnotationEvents"];
          let code: string | undefined;
          let realDurationFrames = durationFrames;
          const shouldAnalyze = shouldAnalyzeSceneRegions(caps, scene, autoAnnotatedSceneIndexes);
          if ((caps.generateAudio && scene.narrationText) || (shouldAnalyze && matched?.url && matched.mediaType === "video")) {
            try {
              const [ttsResult, annotationEvents] = await Promise.all([
                caps.generateAudio && scene.narrationText
                  ? generateTtsAudio(apiKey!, scene.narrationText, scene.voice)
                  : Promise.resolve(undefined),
                shouldAnalyze && matched?.url && matched.mediaType === "video"
                  ? analyzeVideoRegions({
                      apiKey: apiKey!,
                      videoSource: matched.url,
                      query: scene.narrationText ?? scene.description,
                    })
                  : Promise.resolve(undefined),
              ]);
              audioDataUrl = ttsResult?.dataUrl;
              audioDurationSeconds = ttsResult?.durationSeconds;
              regionAnnotationEvents = annotationEvents;
              realDurationFrames = fitDurationToAudio(durationFrames, audioDurationSeconds);
            } catch (err) {
              console.error(`[scene ${scene.index}] Video narration/annotation error:`, err);
            }
          }
          try {
            const animationScene: SceneSpec = {
              ...scene,
              type: "animation",
              description: `Create a generated motion-graphics explainer (no raw uploaded video playback). Context: ${scene.description}`,
            };
            const builderResult = await runSceneBuilder(animationScene, targetFps, caps);
            code = builderResult.code ?? await generateFallbackCode(flashModel, animationScene, targetFps);
          } catch (err) {
            console.error(`[scene ${scene.index}] Video->animation conversion error:`, err);
            code = await generateFallbackCode(
              flashModel,
              {
                ...scene,
                type: "animation",
                description: `Generated visual explainer (no raw uploaded footage): ${scene.description}`,
              },
              targetFps,
            );
          }
          return {
            index: scene.index,
            type: "animation",
            code,
            audioDataUrl,
            audioDurationSeconds,
            narrationText: scene.narrationText,
            regionAnnotationEvents,
            durationFrames: realDurationFrames,
            startFrame: 0,
            description: scene.description,
          };
        }

        case "image": {
          let imageDataUrl: string | undefined;
          let matchedAssetId: string | undefined;
          let audioDataUrl: string | undefined;
          let audioDurationSeconds: number | undefined;
          let regionAnnotations: BuiltScene["regionAnnotations"];
          let realDurationFrames = durationFrames;
          const shouldAnalyze = shouldAnalyzeSceneRegions(caps, scene, autoAnnotatedSceneIndexes);

          // 1. Try to match an existing asset first
          const matched = matchAsset(scene.assetHint ?? scene.description, assets, ["image"]);
          
          try {
            // Generate TTS first (always needed if audio requested)
            const ttsPromise = caps.generateAudio && scene.narrationText
              ? generateTtsAudio(apiKey!, scene.narrationText, scene.voice)
              : Promise.resolve(undefined);

            // 2. Decide if we use matched asset as-is, or generate a new image
            if (matched && !scene.generateFromAsset) {
              // Use matched asset strictly as-is
              matchedAssetId = matched.id;
              const ttsResult = await ttsPromise;
              audioDataUrl = ttsResult?.dataUrl;
              audioDurationSeconds = ttsResult?.durationSeconds;
              realDurationFrames = fitDurationToAudio(durationFrames, audioDurationSeconds);

              if (shouldAnalyze && matched.url && matched.mediaType === "image") {
                try {
                  regionAnnotations = await analyzeImageRegions({
                    apiKey: apiKey!,
                    imageSource: matched.url,
                    query: scene.narrationText ?? scene.description,
                  });
                } catch (err) {
                  console.error(`[scene ${scene.index}] Matched-image region analysis error:`, err);
                }
              }
            } else {
              // 3. Actively generate a new image (from scratch, OR image-to-image using matched asset)
              const referenceImage = (matched && scene.generateFromAsset) ? matched.url : undefined;
              
              const [imageResult, ttsResult] = await Promise.all([
                caps.generateImages
                  ? generateImageData(apiKey!, scene.description, {
                      aspectRatio: "16:9",
                      negativePrompt:
                        "arrows, callouts, annotation graphics, bounding boxes, highlight rings, pointer icons, cursor icons, overlay labels",
                      numberOfImages: 1,
                      referenceImage, // Pass reference image down to generator
                    })
                  : Promise.resolve(undefined),
                ttsPromise,
              ]);
              
              imageDataUrl = imageResult?.[0]?.dataUrl;
              audioDataUrl = ttsResult?.dataUrl;
              audioDurationSeconds = ttsResult?.durationSeconds;
              realDurationFrames = fitDurationToAudio(durationFrames, audioDurationSeconds);

              if (shouldAnalyze && imageDataUrl) {
                try {
                  regionAnnotations = await analyzeImageRegions({
                    apiKey: apiKey!,
                    imageSource: imageDataUrl,
                    query: scene.narrationText ?? scene.description,
                  });
                } catch (err) {
                  console.error(`[scene ${scene.index}] Image region analysis error:`, err);
                }
              }
            }
          } catch (err) {
            console.error(`[scene ${scene.index}] Image/TTS generation error:`, err);
          }
          return {
            index: scene.index,
            type: "image",
            imageDataUrl,
            matchedAssetId,
            audioDataUrl,
            audioDurationSeconds,
            narrationText: scene.narrationText,
            regionAnnotations,
            durationFrames: realDurationFrames,
            startFrame: 0,
            description: scene.description,
          };
        }

        case "audio": {
          // Call TTS directly — bypasses ADK roundtrip (more reliable, avoids circular server calls)
          if (!caps.generateAudio) {
            // Convert to a subtitle title scene
            return {
              index: scene.index,
              type: "title",
              text: scene.narrationText ?? scene.description,
              titlePreset: "subtitle",
              durationFrames,
              startFrame: 0,
              description: scene.description,
            };
          }
          let audioDataUrl: string | undefined;
          let audioDurationSeconds: number | undefined;
          let visualCode: string | undefined;
          // Use actual TTS audio length — the story planner's durationSeconds is just an estimate
          let realDurationFrames = durationFrames;
          try {
            // Run TTS and visual backing generation in parallel
            const [ttsResult, visualResult] = await Promise.all([
              generateTtsAudio(
                apiKey!,
                scene.narrationText ?? scene.description,
                scene.voice
              ),
              runSceneBuilder(
                {
                  ...scene,
                  type: "animation",
                  description: `Fullscreen visual animation to accompany this narration (NO text, NO captions — visuals only): "${(scene.narrationText ?? scene.description).slice(0, 160)}"`,
                },
                targetFps,
                caps
              ).catch(() => ({ code: undefined })),
            ]);
            audioDataUrl = ttsResult.dataUrl;
            audioDurationSeconds = ttsResult.durationSeconds;
            if (ttsResult.durationSeconds > 0) {
              realDurationFrames = fitDurationToAudio(durationFrames, ttsResult.durationSeconds);
            }
            visualCode = visualResult.code;
          } catch (err) {
            console.error(`[scene ${scene.index}] TTS/visual error:`, err);
          }
          return {
            index: scene.index,
            type: "audio",
            audioDataUrl,
            audioDurationSeconds,
            narrationText: scene.narrationText ?? scene.description,
            visualCode,
            durationFrames: realDurationFrames,
            startFrame: 0,
            description: scene.description,
          };
        }

        case "transition": {
          // Use a simple fade animation
          const code = `export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity }} />
  );
};`;
          return {
            index: scene.index,
            type: "transition",
            code,
            durationFrames,
            startFrame: 0,
            description: scene.description,
          };
        }

        default:
          return {
            index: scene.index,
            type: "animation",
            durationFrames,
            startFrame: 0,
            description: scene.description,
          };
      }
    };

    const builtScenes = await Promise.all(plan.scenes.map(buildScene));
    const normalizedScenes = [...builtScenes].sort((a, b) => a.index - b.index);

    // Final safety pass: narrated scenes must remain long enough for their audio.
    for (const scene of normalizedScenes) {
      if (scene.narrationText?.trim() && scene.audioDurationSeconds && scene.audioDurationSeconds > 0) {
        const expectedMinSeconds = estimateNarrationMinSeconds(scene.narrationText);
        if (scene.audioDurationSeconds + 0.15 < expectedMinSeconds) {
          console.warn(
            `[story][scene ${scene.index}] Potentially short narration audio: ` +
              `tts=${scene.audioDurationSeconds.toFixed(2)}s expected>=${expectedMinSeconds.toFixed(2)}s`
          );
        }
        const before = scene.durationFrames;
        scene.durationFrames = fitDurationToAudio(scene.durationFrames, scene.audioDurationSeconds);
        if (scene.durationFrames > before) {
          console.info(
            `[story][scene ${scene.index}] Extended duration ${before} -> ${scene.durationFrames} frames ` +
              `to fit narration with ~1s pause`
          );
        }
      }
    }

    // ── Step 3: Compute start frames ───────────────────────────────────────
    let cursor = 0;
    for (const s of normalizedScenes) {
      s.startFrame = cursor;
      cursor += s.durationFrames;
    }

    const totalFrames = cursor;

    const result: StoryBuildResult = {
      plannerSummary: reasoning.slice(0, 1200),
      plan,
      scenes: normalizedScenes,
      totalFrames,
      fps: targetFps,
    };

    return Response.json(result);
  } catch (error) {
    console.error("[story] Pipeline error:", error);
    return Response.json(
      { error: "Story generation failed. Check server logs." },
      { status: 500 }
    );
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function matchAsset(
  hint: string,
  assets: AssetRef[],
  allowedMediaTypes?: AssetRef["mediaType"][]
): AssetRef | null {
  const scopedAssets = allowedMediaTypes && allowedMediaTypes.length > 0
    ? assets.filter((asset) => allowedMediaTypes.includes(asset.mediaType))
    : assets;

  if (!scopedAssets.length) return null;
  const lower = hint.toLowerCase();
  return (
    scopedAssets.find((a) => a.name.toLowerCase().includes(lower)) ??
    scopedAssets.find((a) =>
      lower.split(/\s+/).some((w) => a.name.toLowerCase().includes(w))
    ) ??
    scopedAssets[0]
  );
}

function estimateNarrationMinSeconds(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  // Conservative speaking-rate floor (~160 wpm) plus slight punctuation overhead.
  const base = (words / 160) * 60;
  const punctuationCount = (trimmed.match(/[.,!?;:]/g) ?? []).length;
  const punctuationPause = punctuationCount * 0.04;
  return Math.max(0.6, base + punctuationPause);
}

function sceneAnnotationScore(scene: Pick<SceneSpec, "type" | "description" | "narrationText" | "assetHint">, matchedAsset?: AssetRef | null): number {
  if (scene.type !== "image" && scene.type !== "video") return Number.NEGATIVE_INFINITY;

  const text = `${scene.description} ${scene.narrationText ?? ""} ${scene.assetHint ?? ""} ${matchedAsset?.name ?? ""}`.toLowerCase();

  let score = 0;

  if (/\b(plant|leaf|leaves|flower|petal|stem|root|branch|vein|anatomy|organ|skeleton|muscle|brain|heart|cell|molecule|diagram|infographic|chart|graph|dashboard|ui|interface|screen|screenshot|map|route|landmark|machine|engine|device|circuit|tool|robot|part|component|cross-section|cutaway|tutorial|step|before|after|comparison|assembly|structure|layers?)\b/.test(text)) {
    score += 3;
  }

  if (/\b(close-up|macro|detail|detailed|breakdown|explainer|educational|how it works|inside|internal|section|labeled|multi-part|multiple parts|identify|explain)\b/.test(text)) {
    score += 2;
  }

  if (scene.type === "video" && /\b(demo|walkthrough|process|operation|mechanism|showing|sequence|steps|guide)\b/.test(text)) {
    score += 2;
  }

  if (/\b(background|wallpaper|cinematic|portrait|selfie|headshot|bokeh|ambient|atmospheric|abstract|texture|minimal|beauty shot|hero shot|establishing shot|scenic|landscape)\b/.test(text)) {
    score -= 3;
  }

  if (/\b(title card|big text|quote card|poster|typography only|caption only|logo reveal)\b/.test(text)) {
    score -= 2;
  }

  if (matchedAsset?.mediaType === "video") score += 1;
  if (matchedAsset?.mediaType === "image") score += 1;

  return score;
}

function selectAutoAnnotatedScenes(
  scenes: SceneSpec[],
  assets: AssetRef[],
  caps: AgentCapabilities,
): Set<number> {
  if (!caps.analyzeRegions || caps.regionAnnotationMode !== "auto") {
    return new Set<number>();
  }

  const scoredScenes = scenes
    .map((scene) => {
      const matched = scene.type === "image" || scene.type === "video"
        ? matchAsset(scene.assetHint ?? scene.description, assets, ["image", "video"])
        : null;
      return {
        index: scene.index,
        score: sceneAnnotationScore(scene, matched),
      };
    })
    .filter((scene) => scene.score >= 2)
    .sort((left, right) => right.score - left.score || left.index - right.index);

  const maxAutoAnnotatedScenes = Math.max(1, Math.min(4, Math.ceil(scenes.length / 3)));
  return new Set(scoredScenes.slice(0, maxAutoAnnotatedScenes).map((scene) => scene.index));
}

function shouldAnalyzeSceneRegions(
  caps: AgentCapabilities,
  scene: Pick<SceneSpec, "index" | "type" | "description" | "narrationText" | "assetHint">,
  autoAnnotatedSceneIndexes: Set<number>,
): boolean {
  if (!caps.analyzeRegions) return false;
  if (scene.type !== "image" && scene.type !== "video") return false;
  if (caps.regionAnnotationMode === "off") return false;
  if (caps.regionAnnotationMode === "on") return true;
  return autoAnnotatedSceneIndexes.has(scene.index);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateFallbackCode(model: any, scene: SceneSpec, fps: number): Promise<string> {
  const frames = Math.round(scene.durationSeconds * fps);
  const prompt = `Generate a Remotion TSX animation component for: "${scene.description}".
Duration: ${frames} frames at ${fps}fps.
Export as: export const SceneComp = () => { ... }
Import only from "remotion". Define constants inside the component. Return only the code, no markdown.`;
  const result = await model.generateContent(prompt);
  return result.response.text()
    .replace(/^```(?:tsx|typescript|ts|jsx|js)?\n?/i, "")
    .replace(/```$/, "")
    .trim();
}

// generateTTS is handled by the shared generateTtsAudio helper in @/lib/gemini/tts.
// Kept here removed — callers now use generateTtsAudio directly.
