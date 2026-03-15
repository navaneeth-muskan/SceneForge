// ─── Gemini Agent Shared Types ─────────────────────────────────────────────

export type SceneType =
  | "animation"   // Remotion TSX code scene
  | "title"       // Text/caption overlay
  | "video"       // Use an uploaded video asset
  | "image"       // Use an uploaded image asset
  | "audio"       // Narration / TTS audio
  | "transition"; // Brief transition moment

export interface AssetRef {
  /** ID from the uploaded media library, if matched */
  id: string;
  name: string;
  url: string;
  mediaType: "image" | "video" | "audio" | "document";
  /** Optional gs:// URI reference for storage-backed assets */
  gcsUri?: string;
}

export interface SceneSpec {
  /** Sequential index */
  index: number;
  type: SceneType;
  /** Human-readable description used to generate code/content */
  description: string;
  /** Duration in seconds (agent decides; default 3) */
  durationSeconds: number;
  /** Optional: which uploaded asset to use (for video/image scenes) */
  assetHint?: string;
  /** If true, uses the assetHint as a reference image for generating a new image via Gemini */
  generateFromAsset?: boolean;
  /** For title scenes: the text content */
  titleText?: string;
  /** For title scenes: suggested style preset id */
  titlePreset?: string;
  /** For audio scenes: the narration text */
  narrationText?: string;
  /** For audio scenes: preferred TTS voice */
  voice?: string;
}

export interface StoryPlan {
  title: string;
  description: string;
  scenes: SceneSpec[];
  /** Total suggested duration in seconds */
  totalDurationSeconds: number;
  /** Tags/keywords extracted for skill routing */
  skillHints: string[];
}

export interface BuiltScene {
  index: number;
  type: SceneType;
  /** Remotion code for animation scenes */
  code?: string;
  /** For title scenes */
  text?: string;
  titlePreset?: string;
  /** For video/image scenes — matched asset id */
  matchedAssetId?: string;
  /** For audio scenes — base64 WAV data URL */
  audioDataUrl?: string;
  /** Actual TTS duration in seconds, when narration audio is present */
  audioDurationSeconds?: number;
  /** For audio scenes — narration text (used for caption overlays) */
  narrationText?: string;
  /** For audio scenes — AI-generated Remotion code for the backing visual */
  visualCode?: string;
  /** For AI-generated image scenes — base64 data URL */
  imageDataUrl?: string;
  /** Region annotations for image scenes (normalized percentages 0-100) */
  regionAnnotations?: RegionAnnotation[];
  /** Timestamped region annotations for video scenes */
  regionAnnotationEvents?: RegionAnnotationEvent[];
  /** Duration in frames */
  durationFrames: number;
  /** Start frame in the final composition */
  startFrame: number;
  description: string;
}

export interface StoryBuildResult {
  plannerSummary: string;
  plan: StoryPlan;
  scenes: BuiltScene[];
  /** Total duration in frames */
  totalFrames: number;
  fps: number;
}

// ─── Agent Capabilities ─────────────────────────────────────────────────────
// Controls which tools / scene types the agent is allowed to use.

export interface AgentCapabilities {
  /** Call generate_image to create AI images for image-type scenes */
  generateImages: boolean;
  /** Generate TTS narration for audio-type scenes */
  generateAudio: boolean;
  /** Generate charts / data visualisation animations */
  useCharts: boolean;
  /** Generate 3D scenes using @remotion/three */
  use3D: boolean;
  /** Use react-simple-maps SVG world maps */
  useMaps: boolean;
  /** Reference pre-built motion components (LowerThird, TitleCard, etc.) */
  useComponents: boolean;
  /** Terminal / code window animations (CodeWindow, TerminalOutput, DiffView) */
  useTerminal: boolean;
  /** Brand & portfolio components (LogoReveal, SocialCard, StatHighlight, BrandTicker) */
  useBrand: boolean;
  /** Mapbox GL travel/map scenes (MapboxScene, RouteOverlay, LocationPin) */
  useTravel: boolean;
  /** Tutorial/explainer components (StepCallout, SpotlightCursor, AnnotationArrow) */
  useTutorial: boolean;
  /** Enable region analysis for image/video scenes */
  analyzeRegions: boolean;
  /** How region analysis is triggered: automatic scene-aware scoring, always on, or fully off */
  regionAnnotationMode: "auto" | "on" | "off";
}

export const DEFAULT_CAPABILITIES: AgentCapabilities = {
  generateImages: true,
  generateAudio: true,
  useCharts: true,
  use3D: false,
  useMaps: false,
  useComponents: true,
  useTerminal: true,
  useBrand: true,
  useTravel: true,
  useTutorial: true,
  analyzeRegions: true,
  regionAnnotationMode: "auto",
};

export interface RegionAnnotation {
  label: string;
  explanation: string;
  /** Approximate [ymin, xmin, ymax, xmax] in normalized percent space (0-100), used for internal layout guidance only. */
  bbox: [number, number, number, number];
  /** Primary visible callout anchor as [y, x] in normalized percent space (0-100). */
  point: [number, number];
  confidence?: number;
}

export interface RegionAnnotationEvent extends RegionAnnotation {
  /** MM:SS timestamp within the source video */
  timestamp: string;
}

// ─── Agent Skill Results ────────────────────────────────────────────────────
// Types are derived from Zod schemas in schemas.ts — edit shapes there.

import type { AudioSegmentResult, AnyAnalysisResult } from "./schemas";

/** Per-segment transcription entry (derived from AudioSegmentSchema) */
export type AudioSegment = AudioSegmentResult;

/** Union of all possible results from POST /api/agent/understand */
export type MediaAnalysisResult = AnyAnalysisResult;

export interface AgentSkillResult<T = unknown> {
  skill:
    | "understand_video"
    | "analyze_image"
    | "read_pdf"
    | "analyze_audio"
    | "generate_narration"
    | "generate_image"
    | "plan_story";
  success: boolean;
  data?: T;
  error?: string;
}
