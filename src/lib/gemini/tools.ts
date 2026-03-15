// ─── Gemini ADK Tool Definitions ───────────────────────────────────────────
// These are pure functions passed to @google/adk Agent instances.
// Each tool runs server-side only.

import type { StoryPlan, AssetRef } from "./types";

// ---------------------------------------------------------------------------
// Tool: plan_story_scenes
// Used by the storyPlannerAgent to decompose a prompt into a scene list.
// ---------------------------------------------------------------------------

export interface PlanStoryScenesInput {
  userPrompt: string;
  availableAssets: AssetRef[];
  compositeDurationSeconds: number;
}

export interface PlanStoryScenesOutput {
  plan: StoryPlan;
}

export async function plan_story_scenes(
  input: PlanStoryScenesInput
): Promise<PlanStoryScenesOutput> {
  // This function body is NOT called by the ADK tool loop — the agent
  // infers scene data from its internal reasoning. The function is registered
  // so the agent can call it to *commit* the final plan as structured output.
  //
  // In practice, the route handler uses the agent's FunctionResponse to
  // extract the StoryPlan. If the agent doesn't call the tool, we parse
  // the text response instead.
  return {
    plan: {
      title: "Untitled Story",
      description: input.userPrompt,
      scenes: [],
      totalDurationSeconds: input.compositeDurationSeconds,
      skillHints: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Tool: generate_scene_animation
// Used by the sceneBuilderAgent for animation code scenes.
// ---------------------------------------------------------------------------

export interface GenerateSceneAnimationInput {
  sceneDescription: string;
  durationFrames: number;
  fps: number;
}

export interface GenerateSceneAnimationOutput {
  code: string;
}

export async function generate_scene_animation(
  input: GenerateSceneAnimationInput
): Promise<GenerateSceneAnimationOutput> {
  // Placeholder — agent fills in the code via its response text.
  return {
    code: `// ${input.sceneDescription}\nexport const Scene = () => <AbsoluteFill />;`,
  };
}

// ---------------------------------------------------------------------------
// Tool: generate_title_text
// Used by the sceneBuilderAgent for title/caption scenes.
// ---------------------------------------------------------------------------

export interface GenerateTitleTextInput {
  sceneDescription: string;
  styleHint?: string;
}

export interface GenerateTitleTextOutput {
  text: string;
  preset: string;
}

export async function generate_title_text(
  input: GenerateTitleTextInput
): Promise<GenerateTitleTextOutput> {
  return {
    text: input.sceneDescription,
    preset: input.styleHint ?? "modern-title",
  };
}

// ---------------------------------------------------------------------------
// Tool: match_uploaded_asset
// Fuzzy-matches an assetHint string against the available uploaded media.
// ---------------------------------------------------------------------------

export interface MatchUploadedAssetInput {
  hint: string;
  availableAssets: AssetRef[];
}

export interface MatchUploadedAssetOutput {
  assetId: string | null;
  assetUrl: string | null;
  assetName: string | null;
}

export function match_uploaded_asset(
  input: MatchUploadedAssetInput
): MatchUploadedAssetOutput {
  if (!input.availableAssets.length) {
    return { assetId: null, assetUrl: null, assetName: null };
  }

  const hint = input.hint.toLowerCase();
  // Exact name match first
  let match = input.availableAssets.find((a) =>
    a.name.toLowerCase().includes(hint)
  );
  // Fallback: partial token match
  if (!match) {
    const tokens = hint.split(/\s+/);
    match = input.availableAssets.find((a) =>
      tokens.some((t) => a.name.toLowerCase().includes(t))
    );
  }
  // Last resort: return first asset
  if (!match) match = input.availableAssets[0];

  return {
    assetId: match.id,
    assetUrl: match.url,
    assetName: match.name,
  };
}

// ---------------------------------------------------------------------------
// Tool: identify_scene_type
// Simple heuristic — the agent calls this to confirm the scene type before
// generating content, avoiding wasted code generation.
// ---------------------------------------------------------------------------

export function identify_scene_type(
  description: string,
  availableAssets: AssetRef[]
): SceneType {
  const lower = description.toLowerCase();
  if (lower.includes("title") || lower.includes("headline") || lower.includes("text") || lower.includes("caption")) {
    return "title";
  }
  if (lower.includes("audio") || lower.includes("narrat") || lower.includes("voice")) {
    return "audio";
  }
  if (lower.includes("transition") || lower.includes("fade")) {
    return "transition";
  }
  // If the hint matches an uploaded asset, prefer using it
  if (availableAssets.length > 0) {
    const hint = description.split(" ").find((w) =>
      availableAssets.some((a) => a.name.toLowerCase().includes(w.toLowerCase()))
    );
    if (hint) {
      const asset = availableAssets.find((a) =>
        a.name.toLowerCase().includes(hint.toLowerCase())
      );
      if (asset) {
        if (asset.mediaType === "video") return "video";
        if (asset.mediaType === "image") return "image";
        if (asset.mediaType === "audio") return "audio";
        return "animation";
      }
    }
  }
  return "animation";
}

type SceneType = "animation" | "title" | "video" | "image" | "audio" | "transition";
