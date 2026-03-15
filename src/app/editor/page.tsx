"use client";

export const dynamic = "force-dynamic";

import { AnimationPlayer } from "@/components/AnimationPlayer";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { TimelineEditor } from "@/components/Editor/TimelineEditor";
import { DownloadButton } from "@/components/AnimationPlayer/RenderControls/DownloadButton";
import { ErrorComp } from "@/components/AnimationPlayer/RenderControls/Error";
import { ProgressBar } from "@/components/AnimationPlayer/RenderControls/ProgressBar";
import { useRendering } from "@/helpers/use-rendering";
import { useAnimationState } from "@/hooks/useAnimationState";
import { removeBackgroundFromImage } from "@/helpers/remove-background";
import { ANIMATED_LAYER_SOURCE } from "./animated-layer-code";
import { removeBackgroundFromGif } from "@/helpers/remove-background-gif";
import type { NextPage } from "next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { PlayerRef } from "@remotion/player";
import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  FileText,
  Film,
  Folder,
  Image,
  Layers,
  LayoutTemplate,
  Monitor,
  Music2,
  PanelLeft,
  Pause,
  Play,
  Redo2,
  RotateCw,
  Save,
  Scan,
  Scissors,
  Search,
  Settings,
  SkipBack,
  SkipForward,
  Captions,
  SlidersHorizontal,
  Smile,
  Type,
  Undo2,
  Upload,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  MousePointer2,
} from "lucide-react";
import { AgentPanel } from "@/components/AgentPanel";
import { AnnotationOverlay } from "@/components/AnnotationOverlay";
import { captureFrame } from "@/helpers/capture-frame";
import type { StoryBuildResult, MediaAnalysisResult } from "@/lib/gemini/types";
import type { RegionAnnotation } from "@/lib/gemini/types";

type MediaType = "image" | "video" | "audio" | "document";

interface UploadedMediaItem {
  id: string;
  name: string;
  size: number;
  url: string;
  type: MediaType;
  mimeType?: string;
  storageKey?: string;
  gcsUri?: string;
  agentMetadata?: {
    description: string;
    tags: string[];
    colorPalette?: string[];
    suggestedOverlays?: string[];
  };
}

interface VisualTransform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

interface AppearanceOptions {
  fit: "contain" | "cover" | "fill";
  filterPreset: "none" | "grayscale" | "sepia" | "vibrant";
  borderRadius: number;
  brightness: number;
  padding: number;
  paddingBackground: string;
}

type Layout3dPreset =
  | "none"
  | "tiltUp"
  | "tiltDown"
  | "left"
  | "right"
  | "book"
  | "floating"
  | "billboard"
  | "skewed";

interface Layout3dOptions {
  preset: Layout3dPreset;
  intensity: number;
}

interface VisualAiState {
  backgroundRemoved: boolean;
  originalUrl?: string | null;
  processedUrl?: string | null;
  isProcessing?: boolean;
}

type AnimationPreset =
  | "none"
  | "fade"
  | "scale"
  | "bounce"
  | "flip"
  | "zoom"
  | "slide"
  | "snap"
  | "glitch"
  | "swipe"
  | "float"
  | "spin"
  | "slideD"
  | "slideL"
  | "diagonal"
  | "wobble"
  | "flipY"
  | "pulse"
  | "drop"
  | "squeeze"
  | "roll"
  | "swing"
  | "expand"
  | "twist"
  | "blur"
  | "spiral"
  | "shake"
  | "curtain"
  | "fold"
  | "zigzag"
  | "elastic"
  | "slingshot"
  | "rotate"
  | "skew"
  | "peek"
  | "vortex"
  | "typing";

interface AnimationSettings {
  preset: AnimationPreset;
  durationFrames: number;
  delayFrames: number;
}

interface CropRegion {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface CropOptions {
  enabled: boolean;
  aspectRatio: string;
  region: CropRegion;
  /** How image fills the crop area: "contain" (fit) or "cover". Default "contain". */
  objectFit?: "contain" | "cover";
}

interface VisualTimelineItem extends UploadedMediaItem {
  start: number;
  end: number;
  transform: VisualTransform;
  sourceKind?: "upload" | "sticker" | "emoji" | "shape" | "shader" | "animCode";
  /** Raw Remotion TSX code for animation-sourced visual layers */
  animCode?: string;
  shapePreset?: "circle" | "square" | "diamond" | "triangle" | "pill";
  shaderVariant?: "aurora" | "plasma" | "mesh";
  shaderSpeed?: number;
  shaderIntensity?: number;
  trimBeforeFrames?: number;
  trimAfterFrames?: number;
  crop?: CropOptions;
  appearance?: AppearanceOptions;
  ai?: VisualAiState;
  layout3d?: Layout3dOptions;
  enterAnimation?: AnimationSettings;
  exitAnimation?: AnimationSettings;
}

interface AudioTimelineItem extends UploadedMediaItem {
  start: number;
  end: number;
}

interface TextShadowOptions {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

interface TextStyleOptions {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  letterSpacing: number;
  textAlign: "left" | "center" | "right";
  color: string;
  highlightColor?: string;
  shadow?: TextShadowOptions;
}

interface TextTimelineItem {
  id: string;
  name: string;
  text: string;
  start: number;
  end: number;
  transform: VisualTransform;
  style: TextStyleOptions;
  preset?: string;
  diffMode?: "none" | "charMorph";
  diffTargetText?: string;
  diffMorphSpeed?: number;
  enterAnimation?: AnimationSettings;
  exitAnimation?: AnimationSettings;
}

const defaultTextShadow: TextShadowOptions = {
  enabled: false,
  color: "#000000",
  blur: 4,
  offsetX: 0,
  offsetY: 2,
};

const TEXT_PRESETS: { id: string; label: string; description: string; text: string; style: TextStyleOptions; transform: VisualTransform }[] = [
  { id: "modern-title", label: "Modern Title", description: "Sleek & Minimalist", text: "Modern Title", style: { fontFamily: "Inter", fontWeight: "600", fontSize: 48, letterSpacing: 0, textAlign: "center", color: "#1e293b" }, transform: { x: 10, y: 40, width: 80, height: 20, rotation: 0 } },
  { id: "impact", label: "MAKE AN IMPACT", description: "Bold & Commanding", text: "MAKE AN IMPACT", style: { fontFamily: "Inter", fontWeight: "900", fontSize: 72, letterSpacing: 2, textAlign: "center", color: "#ffffff" }, transform: { x: 5, y: 35, width: 90, height: 30, rotation: 0 } },
  { id: "sliced", label: "SLICED", description: "Edgy & Modern", text: "SLICED", style: { fontFamily: "Inter", fontWeight: "900", fontSize: 96, letterSpacing: -2, textAlign: "center", color: "#ffffff", highlightColor: "#ef4444" }, transform: { x: 10, y: 30, width: 80, height: 40, rotation: 0 } },
  { id: "minimal", label: "less is more", description: "Ultra Minimal", text: "less is more", style: { fontFamily: "Inter", fontWeight: "300", fontSize: 36, letterSpacing: 4, textAlign: "center", color: "#94a3b8" }, transform: { x: 15, y: 42, width: 70, height: 16, rotation: 0 } },
  { id: "highlighted", label: "Highlighted Text", description: "Emphasis", text: "Highlighted Text", style: { fontFamily: "Inter", fontWeight: "600", fontSize: 40, letterSpacing: 0, textAlign: "center", color: "#ffffff", highlightColor: "#8b5cf6" }, transform: { x: 15, y: 40, width: 70, height: 20, rotation: 0 } },
];

const DIFF_TEXT_TEMPLATES = [
  {
    id: "diff-status",
    label: "Status Update",
    fromText: "Launching Soon",
    toText: "Launching Today",
  },
  {
    id: "diff-headline",
    label: "Headline Shift",
    fromText: "Old Pricing Model",
    toText: "New Flexible Pricing",
  },
  {
    id: "diff-metric",
    label: "Metric Change",
    fromText: "CTR 2.1%",
    toText: "CTR 4.8%",
  },
] as const;

const STICKER_LIBRARY = [
  { id: "star-burst", label: "Star Burst", bg: "#f59e0b", fg: "#ffffff", glyph: "★" },
  { id: "new-tag", label: "New", bg: "#10b981", fg: "#ffffff", glyph: "NEW" },
  { id: "sale", label: "Sale", bg: "#ef4444", fg: "#ffffff", glyph: "SALE" },
  { id: "idea", label: "Idea", bg: "#8b5cf6", fg: "#ffffff", glyph: "IDEA" },
  { id: "cta", label: "Tap", bg: "#0ea5e9", fg: "#ffffff", glyph: "TAP" },
] as const;

const EMOJI_LIBRARY = ["🔥", "✨", "🎯", "✅", "🚀", "💡", "🎉", "😍", "📈", "⚡", "🧠", "🎬"] as const;

const SHAPE_LIBRARY = [
  { id: "circle", label: "Circle", fill: "#0ea5e9" },
  { id: "square", label: "Square", fill: "#8b5cf6" },
  { id: "diamond", label: "Diamond", fill: "#f97316" },
  { id: "triangle", label: "Triangle", fill: "#10b981" },
  { id: "pill", label: "Pill", fill: "#ef4444" },
] as const;

const SHADER_LIBRARY = [
  { id: "aurora", label: "Aurora" },
  { id: "plasma", label: "Plasma" },
  { id: "mesh", label: "Mesh" },
] as const;

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

/**
 * Generates an animated dark-gradient backing code for narration scenes.
 * The component ID must be a valid JS identifier (no hyphens).
 */
function makeNarrationBackingCode(compId: string): string {
  return `const AnimScene_${compId} = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const angle = interpolate(frame, [0, durationInFrames], [120, 280], { extrapolateRight: "clamp" });
  const hue1 = interpolate(frame, [0, durationInFrames], [220, 260], { extrapolateRight: "clamp" });
  const hue2 = interpolate(frame, [0, durationInFrames], [250, 295], { extrapolateRight: "clamp" });
  const orbX = interpolate(frame, [0, durationInFrames], [30, 68], { extrapolateRight: "clamp" });
  const orbY = interpolate(frame, [0, durationInFrames], [38, 62], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: \`linear-gradient(\${angle}deg, hsl(\${hue1},55%,9%), hsl(\${hue2},50%,14%))\` }}>
      <div style={{ position:"absolute", width:900, height:900, borderRadius:"50%", background:\`radial-gradient(circle, hsla(\${hue1},70%,50%,0.18) 0%, transparent 70%)\`, top:\`\${orbY}%\`, left:\`\${orbX}%\`, transform:"translate(-50%,-50%)", filter:"blur(90px)" }} />
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", background:\`radial-gradient(circle, hsla(\${hue2},60%,45%,0.13) 0%, transparent 70%)\`, top:\`\${100-orbY}%\`, left:\`\${100-orbX}%\`, transform:"translate(-50%,-50%)", filter:"blur(70px)" }} />
    </AbsoluteFill>
  );
};`;
}

const EditorPage: NextPage = () => {
  const aspectOptions = [
    { value: "16:9", label: "Widescreen", width: 1920, height: 1080 },
    { value: "9:16", label: "Vertical", width: 1080, height: 1920 },
    { value: "1:1", label: "Square", width: 1080, height: 1080 },
    { value: "4:5", label: "Portrait", width: 1080, height: 1350 },
  ] as const;

  const emptyCompositionCode = `import { AbsoluteFill } from "remotion";

export const MyAnimation = () => {
  return <AbsoluteFill style={{ backgroundColor: "white" }} />;
};`;

  const initialExample = {
  id: 'empty-audio',
  name: 'Empty Audio',
  description: '',
  category: 'Other',
  durationInFrames: 900,
  fps: 30,
  code: emptyCompositionCode
};

  const [durationInFrames, setDurationInFrames] = useState(
    initialExample?.durationInFrames ?? 150,
  );
  const [fps, setFps] = useState(initialExample?.fps ?? 30);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewRatio, setPreviewRatio] = useState(0.54); // fraction of vertical space
  const [isResizing, setIsResizing] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [activeTab, setActiveTab] = useState('image');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMediaItem[]>([]);
  const [isLoadingMediaFromGcs, setIsLoadingMediaFromGcs] = useState(false);
  const [uploadingMediaNames, setUploadingMediaNames] = useState<string[]>([]);
  const [deletingMediaIds, setDeletingMediaIds] = useState<string[]>([]);
  const [mediaFilter, setMediaFilter] = useState<"all" | MediaType>("all");
  const [selectedMediaForAction, setSelectedMediaForAction] = useState<UploadedMediaItem | null>(null);
  const [timelineVisualItems, setTimelineVisualItems] = useState<VisualTimelineItem[]>([]);
  const [timelineAudioItems, setTimelineAudioItems] = useState<AudioTimelineItem[]>([]);
  const [timelineTextItems, setTimelineTextItems] = useState<TextTimelineItem[]>([]);
  const [timelineVisualItem, setTimelineVisualItem] = useState<VisualTimelineItem | null>(null);
  const [timelineAudioItem, setTimelineAudioItem] = useState<AudioTimelineItem | null>(null);
  const [timelineTextItem, setTimelineTextItem] = useState<TextTimelineItem | null>(null);
  const [visualTransform, setVisualTransform] = useState<VisualTransform>({ x: 10, y: 10, width: 80, height: 80, rotation: 0 });
  const [isCanvasLayerSelected, setIsCanvasLayerSelected] = useState(false);
  const [isCanvasInteracting, setIsCanvasInteracting] = useState(false);
  const isSyncingRef = useRef(false);
  const [hoveredCanvasLayerId, setHoveredCanvasLayerId] = useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<(typeof aspectOptions)[number]["value"]>("16:9");
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [annotationsEnabled, setAnnotationsEnabled] = useState(true);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationOverlayStyle, setAnnotationOverlayStyle] = useState<"minimal" | "focus" | "focus-arrow">("minimal");
  const [isAspectMenuOpen, setIsAspectMenuOpen] = useState(false);
  const [clipStart, setClipStart] = useState(5);
  const [clipEnd, setClipEnd] = useState(98);
  const [layerSubTab, setLayerSubTab] = useState<"settings" | "style" | "ai">(
    "settings",
  );
  const [imageSubTab, setImageSubTab] = useState<"settings" | "style" | "ai">(
    "settings",
  );
  const [isEnterAnimationsOpen, setIsEnterAnimationsOpen] = useState(true);
  const [isExitAnimationsOpen, setIsExitAnimationsOpen] = useState(true);

  // 'C' key toggles caption/text overlay visibility on the canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "c" || e.key === "C") {
        setCaptionsEnabled((prev) => !prev);
      }
      if (e.key === "a" || e.key === "A") {
        setAnnotationsEnabled((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const makeDefaultAppearance = useCallback(
    (): AppearanceOptions => ({
      fit: "contain",
      filterPreset: "none",
      borderRadius: 0,
      brightness: 100,
      padding: 0,
      paddingBackground: "white",
    }),
    [],
  );

  const makeDefaultLayout3d = useCallback(
    (): Layout3dOptions => ({
      preset: "none",
      intensity: 1,
    }),
    [],
  );

  const makeDefaultAnimation = useCallback(
    (): AnimationSettings => ({
      preset: "none",
      durationFrames: 15,
      delayFrames: 0,
    }),
    [],
  );

  const makeStickerDataUrl = useCallback(
    (glyph: string, bg: string, fg: string) => {
      const safeGlyph = glyph.length > 5 ? glyph.slice(0, 5) : glyph;
      const fontSize = safeGlyph.length > 2 ? 28 : 42;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect x="28" y="28" width="456" height="456" rx="96" fill="${bg}"/><text x="256" y="286" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="${fg}">${safeGlyph}</text></svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },
    [],
  );

  const makeShapeDataUrl = useCallback(
    (shape: VisualTimelineItem["shapePreset"], fill: string) => {
      const body = (() => {
        if (shape === "circle") {
          return `<circle cx="256" cy="256" r="196" fill="${fill}"/>`;
        }
        if (shape === "square") {
          return `<rect x="76" y="76" width="360" height="360" rx="24" fill="${fill}"/>`;
        }
        if (shape === "diamond") {
          return `<polygon points="256,56 456,256 256,456 56,256" fill="${fill}"/>`;
        }
        if (shape === "triangle") {
          return `<polygon points="256,56 456,426 56,426" fill="${fill}"/>`;
        }
        return `<rect x="56" y="156" width="400" height="200" rx="100" fill="${fill}"/>`;
      })();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${body}</svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    },
    [],
  );

  const enterPresets: { id: AnimationPreset; label: string }[] = [
    { id: "none", label: "None" },
    { id: "fade", label: "Fade" },
    { id: "scale", label: "Scale" },
    { id: "bounce", label: "Bounce" },
    { id: "flip", label: "Flip" },
    { id: "zoom", label: "Zoom" },
    { id: "slide", label: "Slide" },
    { id: "snap", label: "Snap" },
    { id: "glitch", label: "Glitch" },
    { id: "swipe", label: "Swipe" },
    { id: "float", label: "Float" },
    { id: "spin", label: "Spin" },
    { id: "slideD", label: "Slide D" },
    { id: "slideL", label: "Slide L" },
    { id: "diagonal", label: "Diagonal" },
    { id: "wobble", label: "Wobble" },
    { id: "flipY", label: "Flip Y" },
    { id: "pulse", label: "Pulse" },
    { id: "drop", label: "Drop" },
    { id: "squeeze", label: "Squeeze" },
    { id: "roll", label: "Roll" },
    { id: "swing", label: "Swing" },
    { id: "expand", label: "Expand" },
    { id: "twist", label: "Twist" },
    { id: "blur", label: "Blur" },
    { id: "spiral", label: "Spiral" },
    { id: "shake", label: "Shake" },
    { id: "curtain", label: "Curtain" },
    { id: "fold", label: "Fold" },
    { id: "zigzag", label: "Zigzag" },
    { id: "elastic", label: "Elastic" },
    { id: "slingshot", label: "Slingshot" },
    { id: "rotate", label: "Rotate" },
    { id: "skew", label: "Skew" },
    { id: "peek", label: "Peek" },
    { id: "vortex", label: "Vortex" },
    { id: "typing", label: "Typing" },
  ];
  const exitPresets = enterPresets;

  const selectedImageLayer = useMemo(() => {
    if (!timelineVisualItem || timelineVisualItem.type !== "image") {
      return null;
    }
    return timelineVisualItem;
  }, [timelineVisualItem]);

  const currentImageAppearance = useMemo(() => {
    if (!selectedImageLayer) {
      return makeDefaultAppearance();
    }
    return {
      ...makeDefaultAppearance(),
      ...(selectedImageLayer.appearance ?? {}),
    };
  }, [selectedImageLayer, makeDefaultAppearance]);

  const updateImageAppearance = useCallback(
    (changes: Partial<AppearanceOptions>) => {
      if (!timelineVisualItem || timelineVisualItem.type !== "image") {
        return;
      }
      setTimelineVisualItems((prev) =>
        prev.map((item) =>
          item.id === timelineVisualItem.id
            ? {
                ...item,
                appearance: {
                  ...makeDefaultAppearance(),
                  ...(item.appearance ?? {}),
                  ...changes,
                },
              }
            : item,
        ),
      );
      setTimelineVisualItem((prev) =>
        prev && prev.id === timelineVisualItem.id && prev.type === "image"
          ? {
              ...prev,
              appearance: {
                ...makeDefaultAppearance(),
                ...(prev.appearance ?? {}),
                ...changes,
              },
            }
          : prev,
      );
    },
    [timelineVisualItem, makeDefaultAppearance, setTimelineVisualItems],
  );

  const updateLayerAnimation = useCallback(
    (kind: "enter" | "exit", preset: AnimationPreset) => {
      if (!timelineVisualItem) return;
      const key = kind === "enter" ? "enterAnimation" : "exitAnimation";
      const next: AnimationSettings = {
        ...makeDefaultAnimation(),
        ...(timelineVisualItem[key] ?? {}),
        preset,
      };
      setTimelineVisualItems((prev) =>
        prev.map((item) =>
          item.id === timelineVisualItem.id ? { ...item, [key]: next } : item,
        ),
      );
      setTimelineVisualItem((prev) =>
        prev && prev.id === timelineVisualItem.id
          ? { ...prev, [key]: next }
          : prev,
      );
    },
    [timelineVisualItem, makeDefaultAnimation],
  );

  const computeLayout3d = (layout3d?: Layout3dOptions) => {
    const preset = layout3d?.preset ?? "none";
    const intensity = layout3d?.intensity ?? 1;
    let rotateX = 0;
    let rotateY = 0;
    let translateZ = 0;

    switch (preset) {
      case "tiltUp":
        rotateX = -12 * intensity;
        translateZ = 20 * intensity;
        break;
      case "tiltDown":
        rotateX = 12 * intensity;
        translateZ = 20 * intensity;
        break;
      case "left":
        rotateY = -18 * intensity;
        translateZ = 30 * intensity;
        break;
      case "right":
        rotateY = 18 * intensity;
        translateZ = 30 * intensity;
        break;
      case "book":
        rotateY = -30 * intensity;
        translateZ = 40 * intensity;
        break;
      case "floating":
        rotateX = -6 * intensity;
        rotateY = 6 * intensity;
        translateZ = 40 * intensity;
        break;
      case "billboard":
        translateZ = 60 * intensity;
        break;
      case "skewed":
        rotateX = -8 * intensity;
        rotateY = -12 * intensity;
        translateZ = 35 * intensity;
        break;
      case "none":
      default:
        break;
    }

    return { rotateX, rotateY, translateZ };
  };

  const toggleImageBackgroundRemoval = useCallback(async () => {
    if (!selectedImageLayer) {
      return;
    }

    const { id, ai, url, name, mimeType } = selectedImageLayer;
    const currentlyRemoved = ai?.backgroundRemoved ?? false;

    if (currentlyRemoved && ai?.originalUrl) {
      // Restore original
      setTimelineVisualItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                url: ai.originalUrl as string,
                ai: {
                  ...item.ai,
                  backgroundRemoved: false,
                  processedUrl: item.ai?.processedUrl,
                  isProcessing: false,
                },
              }
            : item,
        ),
      );
      setTimelineVisualItem((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              url: ai.originalUrl as string,
              ai: {
                ...prev.ai,
                backgroundRemoved: false,
                processedUrl: prev.ai?.processedUrl,
                isProcessing: false,
              },
            }
          : prev,
      );
      return;
    }

    // Enable background removal
    setTimelineVisualItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ai: {
                backgroundRemoved: false,
                originalUrl: item.ai?.originalUrl ?? url,
                processedUrl: item.ai?.processedUrl ?? null,
                isProcessing: true,
              },
            }
          : item,
      ),
    );
    setTimelineVisualItem((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            ai: {
              backgroundRemoved: false,
              originalUrl: prev.ai?.originalUrl ?? url,
              processedUrl: prev.ai?.processedUrl ?? null,
              isProcessing: true,
            },
          }
        : prev,
    );

    try {
      const isGif =
        (mimeType && mimeType === "image/gif") ||
        name.toLowerCase().endsWith(".gif");
      const processedUrl = isGif
        ? await removeBackgroundFromGif(url)
        : await removeBackgroundFromImage(url);

      setTimelineVisualItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                url: processedUrl,
                ai: {
                  backgroundRemoved: true,
                  originalUrl: item.ai?.originalUrl ?? url,
                  processedUrl,
                  isProcessing: false,
                },
              }
            : item,
        ),
      );
      setTimelineVisualItem((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              url: processedUrl,
              ai: {
                backgroundRemoved: true,
                originalUrl: prev.ai?.originalUrl ?? url,
                processedUrl,
                isProcessing: false,
              },
            }
          : prev,
      );
    } catch (e) {
      console.error(e);
      setTimelineVisualItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ai: {
                  ...(item.ai ?? {}),
                  backgroundRemoved: false,
                  isProcessing: false,
                },
              }
            : item,
        ),
      );
      setTimelineVisualItem((prev) =>
        prev && prev.id === id
          ? {
              ...prev,
              ai: {
                ...(prev.ai ?? {}),
                backgroundRemoved: false,
                isProcessing: false,
              },
            }
          : prev,
      );
    }
  }, [removeBackgroundFromImage, selectedImageLayer, setTimelineVisualItems, setTimelineVisualItem]);

  const {
    code,
    Component,
    error: compilationError,
    isCompiling,
    setCode,
    compileCode,
  } = useAnimationState(initialExample?.code ?? "");

  const {
    renderMedia: renderEditorMedia,
    state: renderEditorState,
    undo: undoEditorRender,
  } = useRendering(
    {
      code,
      durationInFrames,
      fps,
    },
    "renderServer",
  );

  const playerRef = useRef<PlayerRef>(null as unknown as PlayerRef);
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const aspectMenuRef = useRef<HTMLDivElement | null>(null);
  const mediaUploadInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedMediaRef = useRef<UploadedMediaItem[]>([]);
  const canvasStageRef = useRef<HTMLDivElement | null>(null);
  const canvasInteractionRef = useRef<null | {
    mode: "move" | "resize";
    handle?: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    initial: VisualTransform;
  }>(null);
  type CropHandle = "nw" | "ne" | "sw" | "se" | "n" | "e" | "s" | "w";
  const cropInteractionRef = useRef<null | {
    handle: CropHandle;
    startX: number;
    startY: number;
    initial: CropRegion;
    itemId: string;
  }>(null);
  const rotateInteractionRef = useRef<null | {
    startAngle: number;
    initialRotation: number;
    centerX: number;
    centerY: number;
  }>(null);
  const textCanvasInteractionRef = useRef<null | {
    mode: "move" | "resize";
    handle?: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    initial: VisualTransform;
    itemId: string;
  }>(null);
  const textRotateInteractionRef = useRef<null | {
    startAngle: number;
    initialRotation: number;
    centerX: number;
    centerY: number;
    itemId: string;
  }>(null);
  const currentAspect = aspectOptions.find((option) => option.value === selectedAspect) ?? aspectOptions[0];

  const visibleVisualLayers = useMemo(() => {
    const progress = durationInFrames > 0 ? (currentFrame / durationInFrames) * 100 : 0;
    return timelineVisualItems.filter(
      (item) =>
        item.url &&
        (item.type === "image" || item.type === "video") &&
        progress >= item.start &&
        progress < item.end,
    );
  }, [timelineVisualItems, currentFrame, durationInFrames]);

  const visibleTextLayers = useMemo(() => {
    if (!captionsEnabled) return [];
    const progress = durationInFrames > 0 ? (currentFrame / durationInFrames) * 100 : 0;
    return timelineTextItems.filter((item) => progress >= item.start && progress < item.end);
  }, [timelineTextItems, currentFrame, durationInFrames, captionsEnabled]);

  const clampTransform = useCallback((next: VisualTransform): VisualTransform => {
    const minSize = 12;
    const width = Math.min(100, Math.max(minSize, next.width));
    const height = Math.min(100, Math.max(minSize, next.height));
    const x = Math.min(100 - width, Math.max(0, next.x));
    const y = Math.min(100 - height, Math.max(0, next.y));
    const rotation = next.rotation ?? 0;

    return { x, y, width, height, rotation };
  }, []);

  const formatFileSize = useCallback((size: number) => {
    if (size < 1024 * 1024) {
      return `${Math.max(1, Math.round(size / 1024))} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  const getMediaType = useCallback((file: File): MediaType | null => {
    if (file.type.startsWith("image/")) return "image";
    // TODO: video upload disabled for now
    // if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (
      file.type === "application/pdf" ||
      file.type === "text/plain" ||
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".doc") ||
      file.name.endsWith(".docx")
    ) {
      return "document";
    }
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadUploadedMedia = async () => {
      setIsLoadingMediaFromGcs(true);
      try {
        const resp = await fetch("/api/agent/media/list");
        if (!resp.ok) {
          throw new Error(`Failed to list uploads (${resp.status})`);
        }

        const data = (await resp.json()) as {
          items?: Array<{
            id: string;
            key?: string;
            gcsUri?: string;
            name: string;
            size: number;
            url: string;
            type: MediaType;
            mimeType?: string;
          }>;
        };

        const listed = (data.items ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          size: item.size,
          url: item.url,
          type: item.type,
          mimeType: item.mimeType,
          storageKey: item.key,
          gcsUri: item.gcsUri,
        }));

        if (cancelled) return;

        setUploadedMedia((previous) => {
          const byId = new Map(previous.map((item) => [item.id, item]));
          for (const item of listed) {
            if (!byId.has(item.id)) {
              byId.set(item.id, item);
            }
          }
          return Array.from(byId.values());
        });
      } catch (error) {
        console.warn("[media-list] failed to load uploaded files:", error);
      } finally {
        if (!cancelled) {
          setIsLoadingMediaFromGcs(false);
        }
      }
    };

    void loadUploadedMedia();

    return () => {
      cancelled = true;
    };
  }, []);

  const buildMultiLayerCompositionCode = useCallback((
    visualItems: VisualTimelineItem[],
    textItems: TextTimelineItem[] = [],
  ) => {
    const validItems = visualItems.filter((item) => item.url && (item.type === "image" || item.type === "video"));
    const validTextItems = textItems.filter((item) => item.text && item.id);
    
    if (validItems.length === 0 && validTextItems.length === 0) {
      return emptyCompositionCode;
    }

    const cropAspectRatioStyle = (ratio: string) => {
      const [w, h] = ratio.split(":").map(Number);
      return `aspectRatio: ${w}/${h}`;
    };

    const hasAnyAnimation = validItems.some(
      (i) =>
        (i.enterAnimation?.preset && i.enterAnimation.preset !== "none") ||
        (i.exitAnimation?.preset && i.exitAnimation.preset !== "none"),
    );
    const hasAnyTextAnimation = validTextItems.some(
      (i) =>
        (i.enterAnimation?.preset && i.enterAnimation.preset !== "none") ||
        (i.exitAnimation?.preset && i.exitAnimation.preset !== "none"),
    );
    const needsAnimatedLayer = hasAnyAnimation || hasAnyTextAnimation;
    const hasShaderLayers = validItems.some((i) => i.sourceKind === "shader");
    const hasTextMorphLayers = validTextItems.some((i) => i.diffMode === "charMorph" && i.diffTargetText);
    const hasAnimCode = validItems.some((i) => i.sourceKind === "animCode");

    // Collect inlined animation-scene component definitions (stripped of imports, renamed)
    const animCodePreambles: string[] = [];

    const visualSequences = validItems.map((item) => {
      const appearance =
        item.appearance ??
        makeDefaultAppearance();
      const startFrame = Math.max(0, Math.round((item.start / 100) * durationInFrames));
      const endFrame = Math.round((item.end / 100) * durationInFrames);
      const layerDuration = Math.max(1, endFrame - startFrame);
      const useCrop = item.crop?.enabled && item.crop?.aspectRatio;
      const cropRatio = item.crop?.aspectRatio ?? "16:9";
      const region = item.crop?.region ?? { left: 0, top: 0, right: 0, bottom: 0 };
      const clipInset = `clipPath: "inset(${region.top}% ${region.right}% ${region.bottom}% ${region.left}%)"`;
      const rotation = item.transform.rotation ?? 0;
      const { rotateX, rotateY, translateZ } = computeLayout3d(item.layout3d);
      const layerTransform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) rotate(${rotation}deg)`;
      const layerStyle = `{
            left: "${item.transform.x}%",
            top: "${item.transform.y}%",
            width: "${item.transform.width}%",
            height: "${item.transform.height}%",
            transform: "${layerTransform}",
            transformOrigin: "50% 50%",
          }`;
      const cropWrapper = useCrop
        ? `<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div style={{ ${cropAspectRatioStyle(cropRatio)}, width: "100%", height: "auto", maxHeight: "100%", overflow: "hidden", ${clipInset} }}>
            `
        : "";
      const cropWrapperEnd = useCrop ? `</div></div>` : "";
      const objectFitVal = useCrop
        ? (item.crop?.objectFit ?? "contain")
        : appearance.fit === "cover"
          ? "cover"
          : appearance.fit === "fill"
            ? "fill"
            : "contain";
      const baseFilter =
        appearance.filterPreset === "grayscale"
          ? "grayscale(1)"
          : appearance.filterPreset === "sepia"
            ? "sepia(0.9)"
            : appearance.filterPreset === "vibrant"
              ? "saturate(1.4)"
              : "none";
      const filter =
        baseFilter === "none" && appearance.brightness === 100
          ? "none"
          : baseFilter === "none"
            ? `brightness(${appearance.brightness}%)`
            : `${baseFilter} brightness(${appearance.brightness}%)`;
      const filterProp = filter === "none" ? "" : `filter: "${filter}", `;
      const mediaStyleCrop = `width: "100%", height: "100%", objectFit: "${objectFitVal}", borderRadius: "${appearance.borderRadius}px", ${filterProp}`;
      const needsPaddingWrapper =
        appearance.padding > 0 ||
        appearance.borderRadius > 0 ||
        appearance.paddingBackground !== "white";
      const paddingWrapperStart = needsPaddingWrapper
        ? `<div style={{ padding: "${appearance.padding}px", backgroundColor: "${appearance.paddingBackground}", borderRadius: "${appearance.borderRadius}px", overflow: "hidden" }}>`
        : "";
      const paddingWrapperEnd = needsPaddingWrapper ? "</div>" : "";

      const enterAnim = item.enterAnimation ?? { preset: "none", durationFrames: 15, delayFrames: 0 };
      const exitAnim = item.exitAnimation ?? { preset: "none", durationFrames: 15, delayFrames: 0 };
      const animProps = `startFrame={${startFrame}} endFrame={${endFrame}} enterPreset="${enterAnim.preset}" enterDuration={${enterAnim.durationFrames}} enterDelay={${enterAnim.delayFrames}} exitPreset="${exitAnim.preset}" exitDuration={${exitAnim.durationFrames}} exitDelay={${exitAnim.delayFrames}} baseStyle={${layerStyle}}`;

      // ---------- animCode: inline scene builder Remotion component ----------
      if (item.sourceKind === "animCode" && item.animCode) {
        const safeId = item.id.replace(/[^a-zA-Z0-9]/g, "_");
        const compName = `AnimScene_${safeId}`;
        const innerName = `_C_${safeId}`;
        // Strip imports/export-default, rename SceneComp to a private inner name,
        // then wrap in IIFE so each scene's helper constants (COLORS, etc.) are
        // scoped independently and don't clash when multiple scenes are inlined.
        const stripped = item.animCode
          .replace(/^import\s[^;]+;?\s*$/gm, "")
          .replace(/^export\s+default\s+\w+\s*;?\s*$/gm, "")
          .replace(/^registerRoot\s*\([^)]*\)\s*;?\s*$/gm, "") // strip CLI-only registerRoot calls
          .replace(/export\s+(const|function)\s+SceneComp\b/, `$1 ${innerName}`) // rename SceneComp
          .replace(/^export\s+(const|let|var|function|class|type|interface)\b/gm, "$1") // strip all remaining export keywords (invalid inside IIFE)
          .trim();
        const scopedCode = `const ${compName} = (() => {\n${stripped}\nreturn ${innerName};\n})();`;
        animCodePreambles.push(`// ── Scene: ${item.name} ──\n${scopedCode}`);
        return `      <Sequence from={${startFrame}} durationInFrames={${layerDuration}}>
        <AbsoluteFill><${compName} /></AbsoluteFill>
      </Sequence>`;
      }

      if (item.sourceKind === "shader") {
        const variant = item.shaderVariant ?? "aurora";
        const shaderSpeed = Math.max(0.2, Math.min(4, item.shaderSpeed ?? 1));
        const shaderIntensity = Math.max(0.2, Math.min(2.5, item.shaderIntensity ?? 1));
        const shaderStyle = variant === "plasma"
          ? `{
            width: "100%",
            height: "100%",
            background: ` + "`radial-gradient(circle at " + "${50 + Math.sin((dynamicFrame * " + shaderSpeed + ") / 12) * " + (22 * shaderIntensity) + "}% " + "${50 + Math.cos((dynamicFrame * " + shaderSpeed + ") / 10) * " + (18 * shaderIntensity) + "}%, rgba(236,72,153,0.85), transparent 40%), radial-gradient(circle at " + "${50 + Math.cos((dynamicFrame * " + shaderSpeed + ") / 16) * " + (26 * shaderIntensity) + "}% " + "${50 + Math.sin((dynamicFrame * " + shaderSpeed + ") / 13) * " + (20 * shaderIntensity) + "}%, rgba(59,130,246,0.82), transparent 45%), #020617`" + `,
            filter: ` + "`hue-rotate(${(dynamicFrame * " + (1.6 * shaderSpeed) + ") % 360}deg)`" + `,
          }`
          : variant === "mesh"
            ? `{
            width: "100%",
            height: "100%",
            backgroundImage: ` + "`linear-gradient(${(dynamicFrame * " + (0.9 * shaderSpeed) + ") % 360}deg, rgba(20,184,166,0.75), rgba(37,99,235,0.7), rgba(139,92,246,0.75))`" + `,
            filter: ` + "`contrast(${1 + Math.abs(Math.sin((dynamicFrame * " + shaderSpeed + ") / 24)) * " + (0.55 * shaderIntensity) + "}) saturate(" + (1.15 + shaderIntensity * 0.25) + ")`" + `,
          }`
            : `{
            width: "100%",
            height: "100%",
            background: ` + "`linear-gradient(${(dynamicFrame * " + (0.7 * shaderSpeed) + ") % 360}deg, rgba(16,185,129,0.82), rgba(14,165,233,0.78), rgba(99,102,241,0.8))`" + `,
            filter: ` + "`blur(${6 + Math.abs(Math.sin((dynamicFrame * " + shaderSpeed + ") / 18)) * " + (10 * shaderIntensity) + "}px) saturate(" + (1 + shaderIntensity * 0.2) + ")`" + `,
            transform: "scale(1.06)",
          }`;
        const shaderEl = `<div style={${shaderStyle}} />`;
        const inner = hasAnyAnimation
          ? `<AnimatedLayer ${animProps}>${shaderEl}</AnimatedLayer>`
          : `<AbsoluteFill style={${layerStyle}}>${shaderEl}</AbsoluteFill>`;
        return `      <Sequence from={${startFrame}} durationInFrames={${layerDuration}}>
        ${inner}
      </Sequence>`;
      }

      if (item.type === "image") {
        const mediaEl = `${paddingWrapperStart}<Img src="${item.url}" style={{ ${mediaStyleCrop} }} />${paddingWrapperEnd}`;
        const inner = hasAnyAnimation
          ? `<AnimatedLayer ${animProps}>${cropWrapper}${mediaEl}${cropWrapperEnd}</AnimatedLayer>`
          : `<AbsoluteFill style={${layerStyle}}>${cropWrapper}${mediaEl}${cropWrapperEnd}</AbsoluteFill>`;
        return `      <Sequence from={${startFrame}} durationInFrames={${layerDuration}}>
        ${inner}
      </Sequence>`;
      }

      if (item.type === "video") {
        const trimBefore = Math.max(0, Math.round(item.trimBeforeFrames ?? 0));
        const trimAfter = Math.max(0, Math.round(item.trimAfterFrames ?? 0));
        const trimBeforeProp = trimBefore > 0 ? ` trimBefore={${trimBefore}}` : "";
        const trimAfterProp = trimAfter > 0 ? ` trimAfter={${trimAfter}}` : "";
        const mediaEl = `${paddingWrapperStart}<Video src="${item.url}"${trimBeforeProp}${trimAfterProp} style={{ ${mediaStyleCrop} }} />${paddingWrapperEnd}`;
        const inner = hasAnyAnimation
          ? `<AnimatedLayer ${animProps}>${cropWrapper}${mediaEl}${cropWrapperEnd}</AnimatedLayer>`
          : `<AbsoluteFill style={${layerStyle}}>${cropWrapper}${mediaEl}${cropWrapperEnd}</AbsoluteFill>`;
        return `      <Sequence from={${startFrame}} durationInFrames={${layerDuration}}>
        ${inner}
      </Sequence>`;
      }

      return "";
    }).filter(Boolean);

    const textSequences = validTextItems.map((item) => {
      const startFrame = Math.max(0, Math.round((item.start / 100) * durationInFrames));
      const endFrame = Math.round((item.end / 100) * durationInFrames);
      const layerDuration = Math.max(1, endFrame - startFrame);
      const s = item.style;
      const sh = s.shadow ?? defaultTextShadow;
      const textJson = JSON.stringify(item.text);
      const shadowCss = sh.enabled
        ? `"${sh.offsetX}px ${sh.offsetY}px ${sh.blur}px ${sh.color}"`
        : '"none"';
      const layoutStyle = `{
        position: "absolute",
        left: "${item.transform.x}%",
        top: "${item.transform.y}%",
        width: "${item.transform.width}%",
        height: "${item.transform.height}%",
        display: "flex",
        alignItems: "center",
        justifyContent: "${s.textAlign === "left" ? "flex-start" : s.textAlign === "right" ? "flex-end" : "center"}",
        transform: "rotate(${item.transform.rotation ?? 0}deg)",
        transformOrigin: "50% 50%",
      }`;
      const fontAndShadow = `fontFamily: "${s.fontFamily}, sans-serif", fontWeight: "${s.fontWeight}", fontSize: ${s.fontSize}, letterSpacing: "${s.letterSpacing}px", color: "${s.color}", textShadow: ${shadowCss}`;
      const divStyle = s.highlightColor
        ? `{ width: "100%", textAlign: "${s.textAlign}", backgroundColor: "${s.highlightColor}", padding: "2px 8px", ${fontAndShadow} }`
        : `{ width: "100%", textAlign: "${s.textAlign}", ${fontAndShadow} }`;
      const enterAnim = item.enterAnimation ?? { preset: "none", durationFrames: 15, delayFrames: 0 };
      const exitAnim = item.exitAnimation ?? { preset: "none", durationFrames: 15, delayFrames: 0 };
      const hasTextAnim = enterAnim.preset !== "none" || exitAnim.preset !== "none";
      const animProps = `startFrame={${startFrame}} endFrame={${endFrame}} enterPreset="${enterAnim.preset}" enterDuration={${enterAnim.durationFrames}} enterDelay={${enterAnim.delayFrames}} exitPreset="${exitAnim.preset}" exitDuration={${exitAnim.durationFrames}} exitDelay={${exitAnim.delayFrames}} baseStyle={${layoutStyle}}`;
      const hasMorph = item.diffMode === "charMorph" && !!item.diffTargetText;
      const morphTargetJson = JSON.stringify(item.diffTargetText ?? "");
      const morphSpeed = Math.max(0.2, Math.min(3, item.diffMorphSpeed ?? 1));
      const morphProgressExpr = `Math.min(1, Math.max(0, ((dynamicFrame - ${startFrame}) / Math.max(1, ${layerDuration})) * ${morphSpeed}))`;
      const textContent = hasMorph
        ? `<div style={${divStyle}}>{morphTextByChars(${textJson}, ${morphTargetJson}, ${morphProgressExpr})}</div>`
        : `<div style={${divStyle}}>{${textJson}}</div>`;
      const inner = hasTextAnim && needsAnimatedLayer
        ? `<AnimatedLayer ${animProps}>${textContent}</AnimatedLayer>`
        : `<AbsoluteFill style={${layoutStyle}}>${textContent}</AbsoluteFill>`;
      return `      <Sequence from={${startFrame}} durationInFrames={${layerDuration}}>
        ${inner}
      </Sequence>`;
    });

    const allSequences = [...visualSequences, ...textSequences];
    if (allSequences.length === 0) {
      return emptyCompositionCode;
    }

    const hasImages = validItems.some((item) => item.type === "image" && item.sourceKind !== "animCode");
    const hasVideos = validItems.some((item) => item.type === "video");
    // Build a de-duplicated import list; animCode scenes need useCurrentFrame/useVideoConfig/interpolate/spring
    const extraImportSet = new Set<string>();
    if (hasImages) extraImportSet.add("Img");
    if (hasVideos) extraImportSet.add("Video");
    if (needsAnimatedLayer || hasShaderLayers || hasTextMorphLayers || hasAnimCode) extraImportSet.add("useCurrentFrame");
    if (hasAnimCode) {
      extraImportSet.add("useVideoConfig");
      extraImportSet.add("interpolate");
      extraImportSet.add("spring");
    }
    const extraImportStr = extraImportSet.size > 0 ? `, ${Array.from(extraImportSet).join(", ")}` : "";

    const animatedLayerComponent = needsAnimatedLayer ? ANIMATED_LAYER_SOURCE : "";
    const morphTextHelper = hasTextMorphLayers
      ? `
function morphTextByChars(fromText, toText, progress) {
  const fromChars = Array.from(fromText || "");
  const toChars = Array.from(toText || "");
  const maxLen = Math.max(fromChars.length, toChars.length);
  if (maxLen === 0) return "";
  const revealCount = Math.round(Math.min(1, Math.max(0, progress)) * maxLen);
  let out = "";
  for (let i = 0; i < maxLen; i++) {
    out += i < revealCount ? (toChars[i] ?? "") : (fromChars[i] ?? "");
  }
  return out;
}
`
      : "";

    return `import { AbsoluteFill, Sequence${extraImportStr} } from "remotion";${animatedLayerComponent}${morphTextHelper}
${animCodePreambles.length > 0 ? `\n${animCodePreambles.join("\n\n")}\n` : ""}
export const MyAnimation = () => {
  ${hasShaderLayers || hasTextMorphLayers ? "const dynamicFrame = useCurrentFrame();" : ""}
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
${allSequences.join("\n")}
    </AbsoluteFill>
  );
};`;
  }, [durationInFrames, emptyCompositionCode, makeDefaultAppearance]);
  
  const handleClipChange = useCallback((start: number, end: number) => {
    setClipStart(start);
    setClipEnd(end);

    if (timelineVisualItem) {
      setTimelineVisualItems((previous) =>
        previous.map((item) =>
          item.id === timelineVisualItem.id ? { ...item, start, end } : item
        )
      );
      setTimelineVisualItem((prev) => (prev ? { ...prev, start, end } : prev));
    }
  }, [timelineVisualItem]);

  const handleVisualTransformChange = useCallback(
    (next: VisualTransform) => {
      setVisualTransform(next);
      if (timelineVisualItem) {
        setTimelineVisualItems((previous) =>
          previous.map((item) =>
            item.id === timelineVisualItem.id ? { ...item, transform: next } : item
          )
        );
        setTimelineVisualItem((prev) => (prev ? { ...prev, transform: next } : prev));
      }
    },
    [timelineVisualItem],
  );

  const defaultCropRegion: CropRegion = { left: 0, top: 0, right: 0, bottom: 0 };

  const getCropRegion = useCallback((item: VisualTimelineItem | null): CropRegion => {
    return item?.crop?.region ?? defaultCropRegion;
  }, []);

  const clampCropRegion = useCallback((r: CropRegion): CropRegion => {
    const left = Math.max(0, Math.min(99, r.left));
    const top = Math.max(0, Math.min(99, r.top));
    const right = Math.max(0, Math.min(99, r.right));
    const bottom = Math.max(0, Math.min(99, r.bottom));
    const maxLeft = 100 - right - 1;
    const maxTop = 100 - bottom - 1;
    return {
      left: Math.min(left, maxLeft),
      top: Math.min(top, maxTop),
      right: Math.min(right, 100 - left - 1),
      bottom: Math.min(bottom, 100 - top - 1),
    };
  }, []);

  const handleCropChange = useCallback(
    (next: Partial<CropOptions>) => {
      if (!timelineVisualItem) return;
      const crop: CropOptions = {
        enabled: next.enabled ?? timelineVisualItem.crop?.enabled ?? false,
        aspectRatio: next.aspectRatio ?? timelineVisualItem.crop?.aspectRatio ?? "16:9",
        region: next.region ?? timelineVisualItem.crop?.region ?? defaultCropRegion,
        objectFit: next.objectFit ?? timelineVisualItem.crop?.objectFit ?? "contain",
      };
      setTimelineVisualItems((previous) =>
        previous.map((item) =>
          item.id === timelineVisualItem.id ? { ...item, crop } : item
        )
      );
      setTimelineVisualItem((prev) => (prev ? { ...prev, crop } : prev));
    },
    [timelineVisualItem],
  );

  const applyImageToCanvas = useCallback((name: string, objectUrl: string) => {
    setUploadedImageUrl(objectUrl);
    setUploadedImageName(name);
    setClipStart(5);
    setClipEnd(95);
    const nextTransform = { x: 10, y: 10, width: 80, height: 80, rotation: 0 };
    setVisualTransform(nextTransform);
    setIsCanvasLayerSelected(true);

    const player = playerRef.current;
    if (player) {
      player.pause();
      player.seekTo(0);
    }

    setCurrentFrame(0);
    setIsPlaying(false);
  }, []);

  const handleImageUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    let mediaUrl: string;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("/api/agent/media/upload", {
        method: "POST",
        body: fd,
      });
      if (!resp.ok) {
        throw new Error(`Upload failed (${resp.status})`);
      }
      const data = (await resp.json()) as { downloadUrl: string; fileName?: string; gsUri?: string };
      mediaUrl = data.downloadUrl;
      const storageKey = data.fileName;
      const gcsUri = data.gsUri;
      applyImageToCanvas(file.name, mediaUrl);
      setUploadedMedia((previous) => [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          url: mediaUrl,
          type: "image",
          mimeType: file.type,
          storageKey,
          gcsUri,
        },
        ...previous,
      ]);
      const visualItem: VisualTimelineItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        url: mediaUrl,
        type: "image",
        mimeType: file.type,
        start: 5,
        end: 95,
        sourceKind: "upload",
        trimBeforeFrames: 0,
        trimAfterFrames: 0,
        transform: { x: 10, y: 10, width: 80, height: 80, rotation: 0 },
        crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
        appearance: makeDefaultAppearance(),
        ai: {
          backgroundRemoved: false,
        },
        layout3d: makeDefaultLayout3d(),
        enterAnimation: makeDefaultAnimation(),
        exitAnimation: makeDefaultAnimation(),
      };
      setTimelineVisualItems((previous) => [visualItem, ...previous]);
      setTimelineVisualItem(visualItem);
      setActiveTab("image");
      input.value = "";
      return;
    } catch (err) {
      console.warn("[image-upload] GCS upload failed, using local URL fallback:", err);
      mediaUrl = URL.createObjectURL(file);
    }

    applyImageToCanvas(file.name, mediaUrl);
    setUploadedMedia((previous) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        url: mediaUrl,
        type: "image",
        mimeType: file.type,
      },
      ...previous,
    ]);
    const visualItem: VisualTimelineItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      url: mediaUrl,
      type: "image",
      mimeType: file.type,
      start: 5,
      end: 95,
      sourceKind: "upload",
      trimBeforeFrames: 0,
      trimAfterFrames: 0,
      transform: { x: 10, y: 10, width: 80, height: 80, rotation: 0 },
      crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
      appearance: makeDefaultAppearance(),
      ai: {
        backgroundRemoved: false,
      },
      layout3d: makeDefaultLayout3d(),
      enterAnimation: makeDefaultAnimation(),
      exitAnimation: makeDefaultAnimation(),
    };
    setTimelineVisualItems((previous) => [visualItem, ...previous]);
    setTimelineVisualItem(visualItem);
    setActiveTab("image");
    input.value = "";
  }, [applyImageToCanvas, makeDefaultAnimation, makeDefaultAppearance, makeDefaultLayout3d]);

  const handleMediaUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const files = input.files;
    if (!files?.length) {
      return;
    }

    const queuedUploads = Array.from(files).map((file) => ({ file }));
    const clearUploadingName = (fileName: string) => {
      setUploadingMediaNames((previous) => {
        const next = [...previous];
        const removeIndex = next.findIndex((name) => name === fileName);
        if (removeIndex >= 0) next.splice(removeIndex, 1);
        return next;
      });
    };
    setUploadingMediaNames((previous) => [
      ...queuedUploads.map((item) => item.file.name),
      ...previous,
    ]);

    const nextItems: UploadedMediaItem[] = [];
    for (const queued of queuedUploads) {
      const { file } = queued;
      const mediaType = getMediaType(file);
      if (!mediaType) {
        clearUploadingName(file.name);
        continue;
      }

      try {
        const fd = new FormData();
        fd.append("file", file);

        const resp = await fetch("/api/agent/media/upload", {
          method: "POST",
          body: fd,
        });

        if (!resp.ok) {
          throw new Error(`Upload failed (${resp.status})`);
        }

        const data = (await resp.json()) as {
          downloadUrl: string;
          fileName?: string;
          gsUri?: string;
        };

        nextItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`,
          name: file.name,
          size: file.size,
          url: data.downloadUrl,
          type: mediaType,
          mimeType: file.type,
          storageKey: data.fileName,
          gcsUri: data.gsUri,
        });
      } catch (err) {
        console.warn("[media-upload] GCS upload failed, using local URL fallback:", err);
        const objectUrl = URL.createObjectURL(file);
        nextItems.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`,
          name: file.name,
          size: file.size,
          url: objectUrl,
          type: mediaType,
          mimeType: file.type,
        });
      } finally {
        clearUploadingName(file.name);
      }
    }

    if (!nextItems.length) {
      input.value = "";
      return;
    }

    setUploadedMedia((previous) => [...nextItems, ...previous]);
    setActiveTab("media");
    input.value = "";
  }, [getMediaType]);

  const handleAddMediaToTimeline = useCallback((item: UploadedMediaItem) => {
    if (item.type === "image") {
      const visualItem: VisualTimelineItem = {
        ...item,
        id: `${item.id}-visual-${Date.now()}`,
        start: 5,
        end: 95,
        sourceKind: "upload",
        trimBeforeFrames: 0,
        trimAfterFrames: 0,
        transform: { x: 10, y: 10, width: 80, height: 80, rotation: 0 },
        crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
        appearance: makeDefaultAppearance(),
        ai: {
          backgroundRemoved: false,
        },
        layout3d: makeDefaultLayout3d(),
        enterAnimation: makeDefaultAnimation(),
        exitAnimation: makeDefaultAnimation(),
      };
      applyImageToCanvas(item.name, item.url);
      setTimelineVisualItems((previous) => [visualItem, ...previous]);
      setTimelineVisualItem(visualItem);
    }

    if (item.type === "video") {
      const nextTransform = { x: 10, y: 10, width: 80, height: 80 };
      setUploadedImageUrl(null);
      setUploadedImageName(item.name);
      setVisualTransform(nextTransform);
      setIsCanvasLayerSelected(true);
      const visualItem: VisualTimelineItem = {
        ...item,
        id: `${item.id}-visual-${Date.now()}`,
        start: clipStart,
        end: clipEnd,
        sourceKind: "upload",
        trimBeforeFrames: 0,
        trimAfterFrames: 0,
        transform: { ...nextTransform, rotation: 0 },
        crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
        layout3d: makeDefaultLayout3d(),
        appearance: makeDefaultAppearance(),
        enterAnimation: makeDefaultAnimation(),
        exitAnimation: makeDefaultAnimation(),
      };
      const audioItem: AudioTimelineItem = {
        ...item,
        id: `${item.id}-audio-${Date.now()}`,
        start: clipStart,
        end: clipEnd,
      };
      setTimelineVisualItems((previous) => [visualItem, ...previous]);
      setTimelineAudioItems((previous) => [audioItem, ...previous]);
      setTimelineVisualItem(visualItem);
      setTimelineAudioItem(audioItem);
    }

    if (item.type === "audio") {
      const audioItem: AudioTimelineItem = {
        ...item,
        id: `${item.id}-audio-${Date.now()}`,
        start: 5,
        end: 95,
      };
      setTimelineAudioItems((previous) => [audioItem, ...previous]);
      setTimelineAudioItem(audioItem);
    }

    setSelectedMediaForAction(null);
  }, [
    applyImageToCanvas,
    clipEnd,
    clipStart,
    makeDefaultAnimation,
    makeDefaultAppearance,
    makeDefaultLayout3d,
  ]);

  const addVisualAssetLayer = useCallback((input: {
    name: string;
    url: string;
    sourceKind: "sticker" | "emoji" | "shape" | "shader";
    shapePreset?: VisualTimelineItem["shapePreset"];
    shaderVariant?: VisualTimelineItem["shaderVariant"];
  }) => {
    const isShader = input.sourceKind === "shader";
    const visualItem: VisualTimelineItem = {
      id: `${input.sourceKind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: input.name,
      size: input.url.length,
      url: input.url,
      type: "image",
      start: isShader ? 0 : 10,
      end: isShader ? 100 : 90,
      sourceKind: input.sourceKind,
      shapePreset: input.shapePreset,
      shaderVariant: input.shaderVariant,
      shaderSpeed: isShader ? 1 : undefined,
      shaderIntensity: isShader ? 1 : undefined,
      trimBeforeFrames: 0,
      trimAfterFrames: 0,
      transform: isShader
        ? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
        : { x: 30, y: 25, width: 40, height: 40, rotation: 0 },
      crop: { enabled: false, aspectRatio: "1:1", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
      appearance: makeDefaultAppearance(),
      ai: {
        backgroundRemoved: false,
      },
      layout3d: makeDefaultLayout3d(),
      enterAnimation: makeDefaultAnimation(),
      exitAnimation: makeDefaultAnimation(),
    };
    setTimelineVisualItems((previous) => [visualItem, ...previous]);
    setTimelineVisualItem(visualItem);
    setTimelineAudioItem(null);
    setTimelineTextItem(null);
    setIsCanvasLayerSelected(true);
  }, [makeDefaultAnimation, makeDefaultAppearance, makeDefaultLayout3d]);

  const handleShaderSettingsChange = useCallback((changes: Partial<Pick<VisualTimelineItem, "shaderVariant" | "shaderSpeed" | "shaderIntensity">>) => {
    if (!timelineVisualItem || timelineVisualItem.sourceKind !== "shader") return;
    const nextVariant = changes.shaderVariant ?? timelineVisualItem.shaderVariant ?? "aurora";
    const nextSpeed = Math.max(0.2, Math.min(4, Number(changes.shaderSpeed ?? timelineVisualItem.shaderSpeed ?? 1)));
    const nextIntensity = Math.max(0.2, Math.min(2.5, Number(changes.shaderIntensity ?? timelineVisualItem.shaderIntensity ?? 1)));
    setTimelineVisualItems((previous) =>
      previous.map((item) =>
        item.id === timelineVisualItem.id
          ? { ...item, shaderVariant: nextVariant, shaderSpeed: nextSpeed, shaderIntensity: nextIntensity }
          : item,
      ),
    );
    setTimelineVisualItem((previous) =>
      previous && previous.id === timelineVisualItem.id
        ? { ...previous, shaderVariant: nextVariant, shaderSpeed: nextSpeed, shaderIntensity: nextIntensity }
        : previous,
    );
  }, [timelineVisualItem]);

  const handleAddSticker = useCallback((sticker: (typeof STICKER_LIBRARY)[number]) => {
    const url = makeStickerDataUrl(sticker.glyph, sticker.bg, sticker.fg);
    addVisualAssetLayer({
      name: `Sticker: ${sticker.label}`,
      url,
      sourceKind: "sticker",
    });
  }, [addVisualAssetLayer, makeStickerDataUrl]);

  const handleAddEmojiSticker = useCallback((emoji: string) => {
    const url = makeStickerDataUrl(emoji, "#111827", "#ffffff");
    addVisualAssetLayer({
      name: `Emoji: ${emoji}`,
      url,
      sourceKind: "emoji",
    });
  }, [addVisualAssetLayer, makeStickerDataUrl]);

  const handleAddShape = useCallback((shape: (typeof SHAPE_LIBRARY)[number]) => {
    const url = makeShapeDataUrl(shape.id, shape.fill);
    addVisualAssetLayer({
      name: `Shape: ${shape.label}`,
      url,
      sourceKind: "shape",
      shapePreset: shape.id,
    });
  }, [addVisualAssetLayer, makeShapeDataUrl]);

  const handleAddShader = useCallback((shader: (typeof SHADER_LIBRARY)[number]) => {
    addVisualAssetLayer({
      name: `Shader: ${shader.label}`,
      url: TRANSPARENT_PIXEL,
      sourceKind: "shader",
      shaderVariant: shader.id,
    });
  }, [addVisualAssetLayer]);

  /** Convert a data: URL to a short blob: URL to avoid embedding huge base64 strings in compiled code. */
  const toBlobUrl = useCallback((dataUrl: string, mimeType: string): string => {
    if (!dataUrl.startsWith("data:")) return dataUrl;
    const [, b64] = dataUrl.split(",");
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  }, []);

  const visualLayers = useMemo(() => 
    timelineVisualItems.map((item) => ({
      id: item.id,
      label: item.name,
      start: item.start,
      end: item.end,
      canSourceTrim: item.type === "video",
      sourceTrimBeforePct:
        item.type === "video"
          ? Math.max(0, Math.min(95, ((item.trimBeforeFrames ?? 0) / Math.max(1, Math.round(((item.end - item.start) / 100) * durationInFrames))) * 100))
          : 0,
      sourceTrimAfterPct:
        item.type === "video"
          ? Math.max(0, Math.min(95, ((item.trimAfterFrames ?? 0) / Math.max(1, Math.round(((item.end - item.start) / 100) * durationInFrames))) * 100))
          : 0,
    })), [timelineVisualItems, durationInFrames]
  );

  const audioLayers = useMemo(() => 
    timelineAudioItems.map((item) => ({
      id: item.id,
      label: item.name,
      start: item.start,
      end: item.end,
    })), [timelineAudioItems]
  );

  const textLayers = useMemo(() => 
    timelineTextItems.map((item) => ({
      id: item.id,
      label: item.diffMode === "charMorph" ? `Diff • ${item.name}` : item.name,
      start: item.start,
      end: item.end,
      isDiffText: item.diffMode === "charMorph",
    })), [timelineTextItems]
  );

  // ------------------------------------------------------------------ Agent
  const handleAgentTimelineReady = useCallback((result: StoryBuildResult) => {
    const newVisuals: VisualTimelineItem[] = [];
    const newTexts: TextTimelineItem[] = [];
    const newAudios: AudioTimelineItem[] = [];
    const denseVisualScene = (description: string): boolean =>
      /(chart|graph|histogram|bar\s*chart|line\s*chart|table|dashboard|map|route|heatmap|timeline)/i.test(description);
    const getCaptionTransform = (description: string) =>
      denseVisualScene(description)
        ? { x: 8, y: 8, width: 84, height: 16, rotation: 0 }
        : { x: 5, y: 76, width: 90, height: 20, rotation: 0 };
    const clampPct = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
    const parseTimestampToFrames = (timestamp: string): number => {
      const m = timestamp.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return 0;
      const mins = Number(m[1] ?? 0);
      const secs = Number(m[2] ?? 0);
      return Math.max(0, (mins * 60 + secs) * result.fps);
    };
    const styleFromConfidence = (confidence?: number) => {
      if (typeof confidence === "number" && confidence >= 0.82) return { color: "#22c55e", textBg: "rgba(7, 89, 40, 0.72)" };
      if (typeof confidence === "number" && confidence < 0.55) return { color: "#f59e0b", textBg: "rgba(120, 53, 15, 0.72)" };
      return { color: "#38bdf8", textBg: "rgba(3, 37, 63, 0.72)" };
    };
    const pushAnnotationOverlay = (
      annotation: { label: string; explanation: string; bbox: [number, number, number, number]; point: [number, number]; confidence?: number },
      overlayStartPct: number,
      overlayEndPct: number,
      key: string,
      annotationIdx: number = 0,
    ) => {
      const pointY = clampPct(annotation.point[0], 0, 99);
      const pointX = clampPct(annotation.point[1], 0, 99);
      const style = styleFromConfidence(annotation.confidence);

      // 1. TIMING: Stagger each annotation by 2s so they reveal sequentially
      // PERSISTENCE: Now they stay until the end of the scene window (no auto-vanish)
      const STAGGER_SECONDS = 2.0;
      const staggerFrames = annotationIdx * STAGGER_SECONDS * result.fps;
      const annotFrameStart = Math.round(((overlayStartPct / 100) * result.totalFrames) + staggerFrames);
      
      const boxStart = Math.round((annotFrameStart / result.totalFrames) * 100);
      const boxEnd   = Math.round(overlayEndPct);

      // 2. GEOMETRY: Quadrant-aware layout with sequential rotation
      // We use annotationIdx to rotate orientations (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
      // to avoid overlapping if multiple annotations exist.
      const rotationIdx = annotationIdx % 4;
      const isRight  = rotationIdx === 1 || rotationIdx === 3;
      const isBottom = rotationIdx === 2 || rotationIdx === 3;
      
      // Label box dimensions 
      const labelW = 32;
      const labelH = 12;
      const margin = 16; // Significant "cinematic" reach (16% of canvas)
      
      // Calculate card position (anchored away from point)
      // If we rotate, we might override the point's natural quadrant to ensure spread.
      const textX = isRight ? clampPct(pointX + margin, 2, 98 - labelW) : clampPct(pointX - labelW - margin, 2, 98 - labelW);
      const textY = isBottom ? clampPct(pointY + margin, 4, 96 - labelH) : clampPct(pointY - labelH - margin, 4, 96 - labelH);

      // Arrow Anchor on card (edge closest to the point)
      const anchorX = isRight ? textX + labelW : textX;
      const anchorY = textY + labelH / 2;

      // 3. UNIFIED ANIMATION COMPONENT (The "Cinematic Glass Bundle")
      const annotationCode = `
import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';

export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Multi-stage animation orchestration
  // Phase 1: Point (0-15)
  const pointProgress = spring({ frame, fps, config: { damping: 12 }, durationInFrames: 15 });
  // Phase 2: Arrow (15-45)
  const arrowProgress = spring({ frame: frame - 12, fps, config: { stiffness: 60, damping: 20 }, durationInFrames: 30 });
  // Phase 3: Card (35-55)
  const cardProgress = spring({ frame: frame - 28, fps, config: { stiffness: 80, damping: 15 }, durationInFrames: 25 });

  // Geometry (px values)
  const x1 = ${(anchorX / 100).toFixed(4)} * width;
  const y1 = ${(anchorY / 100).toFixed(4)} * height;
  const x2 = ${(pointX / 100).toFixed(4)} * width;
  const y2 = ${(pointY / 100).toFixed(4)} * height;
  
  // Curve calculation: Add a subtle midpoint offset for organic feel
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + (${isBottom ? -40 : 40}); // bulge away from point
  const path = \`M \${x1} \${y1} Q \${mx} \${my} \${x2} \${y2}\`;
  
  // Using a rough path length for dashoffset
  const dist = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
  const pathLen = dist * 1.1; // adjust for curve length
  
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {/* 1. CINEMATIC ARROW */}
      <svg 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          width: '100%', 
          height: '100%', 
          overflow: 'visible',
          filter: 'drop-shadow(0 0 12px ${style.color}44)' 
        }}
      >
        <defs>
          <marker id='head_${key}' markerWidth='10' markerHeight='10' refX='9' refY='5' orient='auto'>
            <path d='M0,0 L10,5 L0,10 Z' fill='${style.color}' />
          </marker>
        </defs>
        <path
          d={path}
          stroke='${style.color}'
          strokeWidth='3'
          fill='none'
          strokeDasharray={pathLen}
          strokeDashoffset={pathLen * (1 - arrowProgress)}
          markerEnd={arrowProgress > 0.9 ? 'url(#head_${key})' : undefined}
          strokeLinecap='round'
          opacity={0.8 * arrowProgress}
        />
      </svg>

      {/* 2. FOCAL POINT DOT */}
      <div style={{
        position: 'absolute',
        left: x2 - 8,
        top: y2 - 8,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '${style.color}',
        boxShadow: \`0 0 20px \${pointProgress * 15}px ${style.color}66\`,
        opacity: pointProgress,
        transform: \`scale(\${pointProgress})\`,
      }} />

      {/* 3. GLASSY CINEMATIC CARD */}
      <div style={{
        position: 'absolute',
        left: '${textX}%',
        top: '${textY}%',
        width: '${labelW}%',
        minHeight: '${labelH}%',
        padding: '24px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderLeft: \`4px solid ${style.color}\`,
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        transform: \`translateY(\${(1 - cardProgress) * 20}px) scale(\${0.95 + cardProgress * 0.05})\`,
        opacity: cardProgress,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        color: '#fff',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ fontSize: '32px', fontWeight: 900, color: '${style.color}', letterSpacing: '-0.02em' }}>
          ${annotation.label}
        </div>
        <div style={{ fontSize: '24px', lineHeight: '1.4', opacity: 0.85, color: '#e2e8f0' }}>
          ${annotation.explanation}
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;

      // Single consolidated visual layer
      newVisuals.push({
        id: `agent-region-bundle-${key}`,
        name: `Annotation: ${annotation.label}`,
        size: annotationCode.length,
        url: TRANSPARENT_PIXEL,
        type: "image",
        start: boxStart,
        end: boxEnd,
        sourceKind: "animCode",
        animCode: annotationCode,
        trimBeforeFrames: 0,
        trimAfterFrames: 0,
        transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
        crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
        appearance: makeDefaultAppearance(),
        ai: { backgroundRemoved: false },
        layout3d: makeDefaultLayout3d(),
        enterAnimation: { preset: 'fade', durationFrames: 10, delayFrames: 0 },
        exitAnimation: { preset: 'fade', durationFrames: 15, delayFrames: 0 },
      });
    };

    const pushSceneRegionOverlays = (
      scene: StoryBuildResult["scenes"][number],
      startPct: number,
      endPct: number,
    ) => {
      // Pass index so each annotation is staggered in time — they appear one-by-one
      (scene.regionAnnotations ?? []).forEach((region, idx) => {
        pushAnnotationOverlay(region, startPct, endPct, `${scene.index}-img-${idx}-${Date.now()}`, idx);
      });

      (scene.regionAnnotationEvents ?? []).forEach((event, idx) => {
        const eventFrameOffset = parseTimestampToFrames(event.timestamp);
        const eventStartFrame = scene.startFrame + Math.min(Math.max(scene.durationFrames - 1, 0), eventFrameOffset);
        const eventStartPct = (eventStartFrame / result.totalFrames) * 100;
        const eventEndFrame = Math.min(
          scene.startFrame + scene.durationFrames,
          eventStartFrame + Math.max(18, result.fps * 2)
        );
        const eventEndPct = (eventEndFrame / result.totalFrames) * 100;
        pushAnnotationOverlay(event, eventStartPct, eventEndPct, `${scene.index}-vid-${idx}-${Date.now()}`, idx);
      });
    };


    for (const scene of result.scenes) {
      const startPct = (scene.startFrame / result.totalFrames) * 100;
      // Compute visual end and audio end
      const visualEndPct = ((scene.startFrame + scene.durationFrames) / result.totalFrames) * 100;
      let audioOnlyEndPct = visualEndPct;
      let audioEndPct = visualEndPct;
      if (scene.audioDataUrl && scene.audioDurationSeconds && result.totalFrames && result.fps) {
        // Compute audio end based on actual narration duration
        const audioFrames = Math.ceil(scene.audioDurationSeconds * result.fps);
        audioOnlyEndPct = ((scene.startFrame + audioFrames) / result.totalFrames) * 100;
        const narrationPauseFrames = Math.max(1, Math.round(result.fps));
        audioEndPct = ((scene.startFrame + audioFrames + narrationPauseFrames) / result.totalFrames) * 100;
      }
      const endPct = Math.max(visualEndPct, audioEndPct);

      if (scene.type === "animation" || scene.type === "transition") {
        if (scene.code) {
          // Use the AI-generated Remotion code — inlined into the composition
          newVisuals.push({
            id: `agent-anim-${scene.index}-${Date.now()}`,
            name: scene.description.slice(0, 32),
            size: scene.code.length,
            url: TRANSPARENT_PIXEL,
            type: "image",
            start: Math.round(startPct),
            end: Math.round(endPct),
            sourceKind: "animCode",
            animCode: scene.code,
            trimBeforeFrames: 0,
            trimAfterFrames: 0,
            transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
            crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
            appearance: makeDefaultAppearance(),
            ai: { backgroundRemoved: false },
            layout3d: makeDefaultLayout3d(),
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });
        } else {
          // Fallback shader when no code was generated
          newVisuals.push({
            id: `agent-shader-${scene.index}-${Date.now()}`,
            name: scene.description.slice(0, 32),
            size: 0,
            url: TRANSPARENT_PIXEL,
            type: "image",
            start: Math.round(startPct),
            end: Math.round(endPct),
            sourceKind: "shader",
            shaderVariant: "aurora",
            shaderSpeed: 1,
            shaderIntensity: 1,
            trimBeforeFrames: 0,
            trimAfterFrames: 0,
            transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
            crop: { enabled: false, aspectRatio: "1:1", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
            appearance: makeDefaultAppearance(),
            ai: { backgroundRemoved: false },
            layout3d: makeDefaultLayout3d(),
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });
        }
        // Add narration audio track when the story planner provided one
        if (scene.audioDataUrl) {
          const audioBlobUrl = toBlobUrl(scene.audioDataUrl, "audio/wav");
          newAudios.push({
            id: `agent-anim-audio-${scene.index}-${Date.now()}`,
            name: `Narration ${scene.index + 1}`,
            size: scene.audioDataUrl.length,
            url: audioBlobUrl,
            type: "audio",
            mimeType: "audio/wav",
            start: Math.round(startPct),
            end: Math.round(audioOnlyEndPct),
          });
        }
        // Caption subtitle — full narration sentence explaining this scene
        if (scene.narrationText) {
          newTexts.push({
            id: `agent-anim-caption-${scene.index}-${Date.now()}`,
            name: `Caption ${scene.index + 1}`,
            text: scene.narrationText,
            start: Math.round(startPct),
            end: Math.round(endPct),
            transform: getCaptionTransform(scene.description),
            style: {
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 38,
              letterSpacing: 0,
              textAlign: "center",
              color: "#ffffff",
              highlightColor: "rgba(0,0,0,0.55)",
              shadow: { enabled: true, color: "#000000", blur: 12, offsetX: 0, offsetY: 2 },
            },
            preset: "subtitle",
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });
        }
      } else if (scene.type === "title" && scene.text) {
        newTexts.push({
          id: `agent-title-${scene.index}-${Date.now()}`,
          name: `Title: ${scene.text.slice(0, 20)}`,
          text: scene.text,
          start: Math.round(startPct),
          end: Math.round(endPct),
          transform: { x: 10, y: 35, width: 80, height: 30, rotation: 0 },
          style: {
            fontFamily: "Inter",
            fontWeight: "700",
            fontSize: 56,
            letterSpacing: 0,
            textAlign: "center",
            color: "#ffffff",
            shadow: defaultTextShadow,
          },
          preset: scene.titlePreset ?? "impact",
          enterAnimation: makeDefaultAnimation(),
          exitAnimation: makeDefaultAnimation(),
        });
      } else if ((scene.type === "video" || scene.type === "image") && scene.imageDataUrl) {
        // AI-generated image — convert to blob URL to avoid 500KB Babel embedding
        const blobUrl = toBlobUrl(scene.imageDataUrl, "image/png");
        newVisuals.push({
          id: `agent-image-${scene.index}-${Date.now()}`,
          name: scene.description.slice(0, 32),
          size: scene.imageDataUrl.length,
          url: blobUrl,
          type: "image",
          mimeType: "image/png",
          start: Math.round(startPct),
          end: Math.round(endPct),
          sourceKind: "upload",
          trimBeforeFrames: 0,
          trimAfterFrames: 0,
          transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
          crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "cover" },
          appearance: makeDefaultAppearance(),
          ai: { backgroundRemoved: false },
          layout3d: makeDefaultLayout3d(),
          enterAnimation: makeDefaultAnimation(),
          exitAnimation: makeDefaultAnimation(),
        });
        // Narration audio for AI-generated image scenes
        if (scene.audioDataUrl) {
          const audioBlobUrl = toBlobUrl(scene.audioDataUrl, "audio/wav");
          newAudios.push({
            id: `agent-img-audio-${scene.index}-${Date.now()}`,
            name: `Narration ${scene.index + 1}`,
            size: scene.audioDataUrl.length,
            url: audioBlobUrl,
            type: "audio",
            mimeType: "audio/wav",
            start: Math.round(startPct),
            end: Math.round(audioOnlyEndPct),
          });
        }
        // Caption subtitle — full narration sentence (not the AI image prompt)
        if (scene.narrationText) {
          newTexts.push({
            id: `agent-img-caption-${scene.index}-${Date.now()}`,
            name: `Caption ${scene.index + 1}`,
            text: scene.narrationText,
            start: Math.round(startPct),
            end: Math.round(endPct),
            transform: getCaptionTransform(scene.description),
            style: {
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 38,
              letterSpacing: 0,
              textAlign: "center",
              color: "#ffffff",
              highlightColor: "rgba(0,0,0,0.55)",
              shadow: { enabled: true, color: "#000000", blur: 12, offsetX: 0, offsetY: 2 },
            },
            preset: "subtitle",
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });
        }
        pushSceneRegionOverlays(scene, startPct, endPct);
      } else if ((scene.type === "video" || scene.type === "image") && scene.matchedAssetId) {
        // find asset in uploaded media
        setUploadedMedia((prev) => {
          const asset = prev.find((m) => m.id === scene.matchedAssetId);
          if (asset) {
            const visualItem: VisualTimelineItem = {
              ...asset,
              id: `agent-asset-${scene.index}-${Date.now()}`,
              start: Math.round(startPct),
              end: Math.round(endPct),
              sourceKind: "upload",
              trimBeforeFrames: 0,
              trimAfterFrames: 0,
              transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
              crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "cover" },
              appearance: makeDefaultAppearance(),
              ai: { backgroundRemoved: false },
              layout3d: makeDefaultLayout3d(),
              enterAnimation: makeDefaultAnimation(),
              exitAnimation: makeDefaultAnimation(),
            };
            newVisuals.push(visualItem);
          }
          return prev;
        });
        // Narration audio for asset-matched scenes
        if (scene.audioDataUrl) {
          const audioBlobUrl = toBlobUrl(scene.audioDataUrl, "audio/wav");
          newAudios.push({
            id: `agent-asset-audio-${scene.index}-${Date.now()}`,
            name: `Narration ${scene.index + 1}`,
            size: scene.audioDataUrl.length,
            url: audioBlobUrl,
            type: "audio",
            mimeType: "audio/wav",
            start: Math.round(startPct),
            end: Math.round(audioOnlyEndPct),
          });
        }
        // Caption subtitle — full narration sentence
        if (scene.narrationText) {
          newTexts.push({
            id: `agent-asset-caption-${scene.index}-${Date.now()}`,
            name: `Caption ${scene.index + 1}`,
            text: scene.narrationText,
            start: Math.round(startPct),
            end: Math.round(endPct),
            transform: getCaptionTransform(scene.description),
            style: {
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 38,
              letterSpacing: 0,
              textAlign: "center",
              color: "#ffffff",
              highlightColor: "rgba(0,0,0,0.55)",
              shadow: { enabled: true, color: "#000000", blur: 12, offsetX: 0, offsetY: 2 },
            },
            preset: "subtitle",
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });
        }
        pushSceneRegionOverlays(scene, startPct, endPct);
      } else if (scene.type === "audio" && scene.audioDataUrl) {
        // Convert data URL to blob URL (avoids 500KB Babel embedding + matches manual audio behavior)
        const blobUrl = toBlobUrl(scene.audioDataUrl, "audio/wav");
        newAudios.push({
          id: `agent-audio-${scene.index}-${Date.now()}`,
          name: `Narration ${scene.index + 1}`,
          size: scene.audioDataUrl.length,
          url: blobUrl,
          type: "audio",
          mimeType: "audio/wav",
          start: Math.round(startPct),
          end: Math.round(audioOnlyEndPct),
        });
        // Add an animated backing so narration scenes aren't blank white
        // Prefer AI-generated visual code; fall back to the gradient animator
        const bgId = `agent-audio-bg-${scene.index}-${Date.now()}`;
        const bgSafeId = bgId.replace(/[^a-zA-Z0-9]/g, "_");
        newVisuals.push({
          id: bgId,
          name: `BG: Narration ${scene.index + 1}`,
          size: 0,
          url: TRANSPARENT_PIXEL,
          type: "image",
          start: Math.round(startPct),
          end: Math.round(endPct),
          sourceKind: "animCode",
          animCode: scene.visualCode ?? makeNarrationBackingCode(bgSafeId),
          trimBeforeFrames: 0,
          trimAfterFrames: 0,
          transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
          crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
          appearance: makeDefaultAppearance(),
          ai: { backgroundRemoved: false },
          layout3d: makeDefaultLayout3d(),
          enterAnimation: makeDefaultAnimation(),
          exitAnimation: makeDefaultAnimation(),
        });
        // Add caption subtitle overlay when narration text is available
        if (scene.narrationText) {
          newTexts.push({
            id: `agent-caption-${scene.index}-${Date.now()}`,
            name: `Caption ${scene.index + 1}`,
            text: scene.narrationText,
            start: Math.round(startPct),
            end: Math.round(endPct),
            transform: getCaptionTransform(scene.description),
            style: {
              fontFamily: "Inter",
              fontWeight: "700",
              fontSize: 38,
              letterSpacing: 0,
              textAlign: "center",
              color: "#ffffff",
              highlightColor: "rgba(0,0,0,0.55)",
              shadow: { enabled: true, color: "#000000", blur: 12, offsetX: 0, offsetY: 2 },
            },
            preset: "subtitle",
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });
        }
      }
    }

    if (newVisuals.length > 0) {
      setTimelineVisualItems((prev) => [...newVisuals, ...prev]);
    }
    if (newTexts.length > 0) {
      setTimelineTextItems((prev) => [...newTexts, ...prev]);
    }
    if (newAudios.length > 0) {
      setTimelineAudioItems((prev) => [...newAudios, ...prev]);
    }
    setDurationInFrames((prev) => Math.max(prev, result.totalFrames));
  }, [annotationOverlayStyle, makeDefaultAnimation, makeDefaultAppearance, makeDefaultLayout3d, setUploadedMedia, toBlobUrl]);

  const handleMediaAnalyzed = useCallback((assetId: string, analysis: MediaAnalysisResult) => {
    setUploadedMedia((prev) =>
      prev.map((m) =>
        m.id === assetId
          ? {
              ...m,
              agentMetadata: {
                description: analysis.description,
                tags: analysis.tags,
                colorPalette: "colorPalette" in analysis ? analysis.colorPalette : undefined,
                suggestedOverlays: "suggestedOverlays" in analysis ? analysis.suggestedOverlays : undefined,
              },
            }
          : m,
      ),
    );
  }, []);

  /** Convert a data: URL to a short blob: URL to avoid embedding huge base64 strings in compiled code. */
  const handleNarrationReady = useCallback((audioDataUrl: string, text: string) => {
    const id = `narration-${Date.now()}`;
    const name = text ? text.slice(0, 48) : "AI Narration";
    const blobUrl = toBlobUrl(audioDataUrl, "audio/wav");
    const base: Omit<AudioTimelineItem, "end"> = {
      id, name,
      size: audioDataUrl.length,
      url: blobUrl,
      type: "audio",
      mimeType: "audio/wav",
      start: 0,
    };
    // Auto-add to media panel so it appears in Uploads
    setUploadedMedia((prev) => [{
      id,
      name,
      size: audioDataUrl.length,
      url: blobUrl,
      type: "audio" as const,
      mimeType: "audio/wav",
    }, ...prev]);
    // Detect actual audio duration so the track bar matches the clip length.
    const probe = new Audio();
    probe.src = blobUrl;
    const addItem = (endPct: number) => {
      setTimelineAudioItems((prev) => [{ ...base, end: Math.max(1, endPct) }, ...prev]);
    };
    probe.addEventListener("loadedmetadata", () => {
      const totalSec = fps > 0 ? durationInFrames / fps : 30;
      const endPct = isFinite(probe.duration) && probe.duration > 0
        ? Math.min(100, Math.round((probe.duration / totalSec) * 100))
        : 100;
      addItem(endPct);
    }, { once: true });
    probe.addEventListener("error", () => addItem(100), { once: true });
  }, [durationInFrames, fps, toBlobUrl]);

  const handleImageGenerated = useCallback((imageDataUrl: string) => {
    const id = `ai-image-${Date.now()}`;
    const name = `AI Image ${new Date().toLocaleTimeString()}`;
    const blobUrl = toBlobUrl(imageDataUrl, "image/png");
    setUploadedMedia((prev) => [{
      id,
      name,
      size: imageDataUrl.length,
      url: blobUrl,
      type: "image" as const,
      mimeType: "image/png",
    }, ...prev]);
  }, [toBlobUrl]);

  const handleAddGeneratedToTimeline = useCallback((dataUrl: string, type: "image" | "audio") => {
    if (type === "image") {
      const id = `ai-image-${Date.now()}`;
      const name = `AI Image ${new Date().toLocaleTimeString()}`;
      const blobUrl = toBlobUrl(dataUrl, "image/png");
      const item: UploadedMediaItem = { id, name, size: dataUrl.length, url: blobUrl, type: "image", mimeType: "image/png" };
      const visualItem: VisualTimelineItem = {
        ...item,
        id: `${id}-visual-${Date.now()}`,
        start: 5,
        end: 95,
        sourceKind: "upload",
        trimBeforeFrames: 0,
        trimAfterFrames: 0,
        transform: { x: 10, y: 10, width: 80, height: 80, rotation: 0 },
        crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
        appearance: makeDefaultAppearance(),
        ai: { backgroundRemoved: false },
        layout3d: makeDefaultLayout3d(),
        enterAnimation: makeDefaultAnimation(),
        exitAnimation: makeDefaultAnimation(),
      };
      applyImageToCanvas(name, dataUrl);
      setTimelineVisualItems((prev) => [visualItem, ...prev]);
      setTimelineVisualItem(visualItem);
    } else if (type === "audio") {
      const id = `ai-audio-${Date.now()}`;
      const blobUrl = toBlobUrl(dataUrl, "audio/wav");
      const audioItem: AudioTimelineItem = {
        id,
        name: "AI Narration",
        size: dataUrl.length,
        url: blobUrl,
        type: "audio",
        mimeType: "audio/wav",
        start: 0,
        end: 100,
      };
      setTimelineAudioItems((prev) => [audioItem, ...prev]);
      setTimelineAudioItem(audioItem);
    }
  }, [applyImageToCanvas, makeDefaultAnimation, makeDefaultAppearance, makeDefaultLayout3d, toBlobUrl]);
  // ---------------------------------------------------------------- /Agent

  const handleAddTextDiffTemplate = useCallback((template: (typeof DIFF_TEXT_TEMPLATES)[number]) => {
    const morphLayer: TextTimelineItem = {
      id: `text-diff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Diff: ${template.label}`,
      text: template.fromText,
      start: 8,
      end: 92,
      transform: { x: 10, y: 38, width: 80, height: 20, rotation: 0 },
      style: {
        fontFamily: "Inter",
        fontWeight: "800",
        fontSize: 56,
        letterSpacing: 0,
        textAlign: "center",
        color: "#0f172a",
        highlightColor: "#86efac",
        shadow: defaultTextShadow,
      },
      preset: "text-diff-morph",
      diffMode: "charMorph",
      diffTargetText: template.toText,
      diffMorphSpeed: 1,
      enterAnimation: { preset: "fade", durationFrames: 10, delayFrames: 0 },
      exitAnimation: { preset: "none", durationFrames: 15, delayFrames: 0 },
    };
    setTimelineTextItems((prev) => [morphLayer, ...prev]);
    setTimelineTextItem(morphLayer);
    setTimelineVisualItem(null);
    setTimelineAudioItem(null);
    setActiveTab("text");
    setIsCanvasLayerSelected(true);
  }, []);

  const handleSourceTrimChange = useCallback((changes: Partial<Pick<VisualTimelineItem, "trimBeforeFrames" | "trimAfterFrames">>) => {
    if (!timelineVisualItem || timelineVisualItem.type !== "video") return;
    const nextBefore = Math.max(0, Math.round(changes.trimBeforeFrames ?? timelineVisualItem.trimBeforeFrames ?? 0));
    const nextAfter = Math.max(0, Math.round(changes.trimAfterFrames ?? timelineVisualItem.trimAfterFrames ?? 0));
    setTimelineVisualItems((previous) =>
      previous.map((item) =>
        item.id === timelineVisualItem.id
          ? { ...item, trimBeforeFrames: nextBefore, trimAfterFrames: nextAfter }
          : item,
      ),
    );
    setTimelineVisualItem((previous) =>
      previous && previous.id === timelineVisualItem.id
        ? { ...previous, trimBeforeFrames: nextBefore, trimAfterFrames: nextAfter }
        : previous,
    );
  }, [timelineVisualItem]);

  const handleVisualSourceTrimChangeFromTimeline = useCallback((id: string, trimBeforePct: number, trimAfterPct: number) => {
    setTimelineVisualItems((previous) =>
      previous.map((item) => {
        if (item.id !== id || item.type !== "video") {
          return item;
        }
        const layerDurationFrames = Math.max(1, Math.round(((item.end - item.start) / 100) * durationInFrames));
        const maxTotalTrim = Math.max(0, layerDurationFrames - 1);
        const nextBefore = Math.max(0, Math.min(maxTotalTrim, Math.round((trimBeforePct / 100) * layerDurationFrames)));
        const nextAfterRaw = Math.max(0, Math.min(maxTotalTrim, Math.round((trimAfterPct / 100) * layerDurationFrames)));
        const nextAfter = Math.max(0, Math.min(maxTotalTrim - nextBefore, nextAfterRaw));
        return {
          ...item,
          trimBeforeFrames: nextBefore,
          trimAfterFrames: nextAfter,
        };
      }),
    );
    if (timelineVisualItem?.id === id && timelineVisualItem.type === "video") {
      const layerDurationFrames = Math.max(1, Math.round(((timelineVisualItem.end - timelineVisualItem.start) / 100) * durationInFrames));
      const maxTotalTrim = Math.max(0, layerDurationFrames - 1);
      const nextBefore = Math.max(0, Math.min(maxTotalTrim, Math.round((trimBeforePct / 100) * layerDurationFrames)));
      const nextAfterRaw = Math.max(0, Math.min(maxTotalTrim, Math.round((trimAfterPct / 100) * layerDurationFrames)));
      const nextAfter = Math.max(0, Math.min(maxTotalTrim - nextBefore, nextAfterRaw));
      setTimelineVisualItem((previous) =>
        previous && previous.id === id
          ? {
              ...previous,
              trimBeforeFrames: nextBefore,
              trimAfterFrames: nextAfter,
            }
          : previous,
      );
    }
  }, [durationInFrames, timelineVisualItem]);

  const generatedCode = useMemo(() => {
    const filteredVisuals = annotationsEnabled 
      ? timelineVisualItems 
      : timelineVisualItems.filter(item => item.sourceKind !== "animCode");

    return buildMultiLayerCompositionCode(filteredVisuals, captionsEnabled ? timelineTextItems : []);
  }, [timelineVisualItems, annotationsEnabled, timelineTextItems, captionsEnabled, buildMultiLayerCompositionCode]);

  useEffect(() => {
    if (isCanvasInteracting) return;
    setCode(generatedCode);
    compileCode(generatedCode);
  }, [generatedCode, isCanvasInteracting, setCode, compileCode]);

  useEffect(() => {
    if (!timelineVisualItem || !isCanvasLayerSelected || isCanvasInteracting) {
      return;
    }

    if (isSyncingRef.current) return;

    // Only update if the local state actually differs from what's in visualTransform
    setTimelineVisualItems((previous) => {
      let changed = false;
      const next = previous.map((item) => {
        if (item.id !== timelineVisualItem.id) return item;
        if (
          item.transform.x === visualTransform.x &&
          item.transform.y === visualTransform.y &&
          item.transform.width === visualTransform.width &&
          item.transform.height === visualTransform.height &&
          item.transform.rotation === visualTransform.rotation
        ) {
          return item;
        }
        changed = true;
        return { ...item, transform: visualTransform };
      });

      if (!changed) return previous;

      // Mark that we are broadcasting plural to singular to prevent loops
      isSyncingRef.current = true;
      // Use a microtask/timeout to clear the ref after current render/update cycle
      setTimeout(() => { isSyncingRef.current = false; }, 0);
      return next;
    });
  }, [isCanvasLayerSelected, timelineVisualItem, visualTransform, isCanvasInteracting]);

  useEffect(() => {
    if (!timelineVisualItem || isSyncingRef.current) {
      return;
    }

    // Stabilize synchronization: only update if values actually changed
    setClipStart((prev) => (prev !== timelineVisualItem.start ? timelineVisualItem.start : prev));
    setClipEnd((prev) => (prev !== timelineVisualItem.end ? timelineVisualItem.end : prev));
    setVisualTransform((prev) => {
      const next = timelineVisualItem.transform;
      if (
        prev.x === next.x &&
        prev.y === next.y &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.rotation === next.rotation
      ) {
        return prev;
      }
      return next;
    });
  }, [timelineVisualItem]);

  useEffect(() => {
    if (timelineTextItem) {
      setIsCanvasLayerSelected(true);
    }
  }, [timelineTextItem]);

  useEffect(() => {
    if (!timelineAudioItem || timelineVisualItem) {
      return;
    }

    setClipStart(timelineAudioItem.start);
    setClipEnd(timelineAudioItem.end);
  }, [timelineAudioItem, timelineVisualItem]);

  useEffect(() => {
    if (timelineVisualItem) setActiveTab(timelineVisualItem.type === "video" ? "video" : "image");
    else if (timelineAudioItem) setActiveTab("audio");
    else if (timelineTextItem) setActiveTab("text");
  }, [timelineVisualItem, timelineAudioItem, timelineTextItem]);

  const handleSelectLayer = useCallback((track: "visual" | "audio" | "text", id: string) => {
    if (track === "visual") {
      const layer = timelineVisualItems.find((item) => item.id === id) ?? null;
      setTimelineVisualItem(layer);
      setTimelineTextItem(null);
      setTimelineAudioItem(null);
      if (layer) setLayerSubTab(layer.type === "image" ? "style" : "settings");
      return;
    }
    if (track === "audio") {
      const layer = timelineAudioItems.find((item) => item.id === id) ?? null;
      setTimelineAudioItem(layer);
      setTimelineVisualItem(null);
      setTimelineTextItem(null);
      return;
    }
    if (track === "text") {
      const layer = timelineTextItems.find((item) => item.id === id) ?? null;
      setTimelineTextItem(layer);
      setTimelineVisualItem(null);
      setTimelineAudioItem(null);
      if (layer) setIsCanvasLayerSelected(true);
      return;
    }
  }, [timelineAudioItems, timelineVisualItems, timelineTextItems]);

  const handleLayerChange = useCallback((track: "visual" | "audio" | "text", id: string, start: number, end: number) => {
    if (track === "visual") {
      setTimelineVisualItems((previous) => previous.map((item) => item.id === id ? { ...item, start, end } : item));
      if (timelineVisualItem?.id === id) {
        setTimelineVisualItem((previous) => previous ? { ...previous, start, end } : previous);
      }
      return;
    }
    if (track === "audio") {
      setTimelineAudioItems((previous) => previous.map((item) => item.id === id ? { ...item, start, end } : item));
      if (timelineAudioItem?.id === id) {
        setTimelineAudioItem((previous) => previous ? { ...previous, start, end } : previous);
      }
      return;
    }
    if (track === "text") {
      setTimelineTextItems((previous) => previous.map((item) => item.id === id ? { ...item, start, end } : item));
      if (timelineTextItem?.id === id) setTimelineTextItem((previous) => previous ? { ...previous, start, end } : previous);
    }
  }, [timelineAudioItem, timelineVisualItem, timelineTextItem]);

  const handleReorderLayers = useCallback((track: "visual" | "audio" | "text", fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (track === "visual") {
      setTimelineVisualItems((previous) => {
        const next = [...previous];
        const [removed] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, removed);
        return next;
      });
    } else if (track === "audio") {
      setTimelineAudioItems((previous) => {
        const next = [...previous];
        const [removed] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, removed);
        return next;
      });
    } else if (track === "text") {
      setTimelineTextItems((previous) => {
        const next = [...previous];
        const [removed] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, removed);
        return next;
      });
    }
  }, []);

  const handleAddTextFromPreset = useCallback((preset: typeof TEXT_PRESETS[number]) => {
    const textItem: TextTimelineItem = {
      id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `T ${preset.text.slice(0, 20)}`,
      text: preset.text,
      start: 5,
      end: 90,
      transform: { ...preset.transform },
      style: { ...preset.style, shadow: preset.style.shadow ?? defaultTextShadow },
      preset: preset.id,
      enterAnimation: makeDefaultAnimation(),
      exitAnimation: makeDefaultAnimation(),
    };
    setTimelineTextItems((prev) => [textItem, ...prev]);
    setTimelineTextItem(textItem);
    setActiveTab("text");
    setIsCanvasLayerSelected(true);
  }, [makeDefaultAnimation]);

  const handleAnnotationSubmit = useCallback(async (
    bbox: [number, number, number, number],
    query: string,
  ) => {
    if (!Component) return;
    setIsAnnotating(true);
    try {
      const imageDataUrl = await captureFrame(Component, currentFrame, {
        width: currentAspect.width,
        height: currentAspect.height,
        fps,
        durationInFrames,
      });
      const res = await fetch("/api/agent/analyze-region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, bbox, query: query || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { annotations }: { annotations: RegionAnnotation[] } = await res.json();
      if (!annotations?.length) return;

      // Push returned annotations as timeline overlays at the current frame
      const clampPct = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
      const makePointDataUrl = (color: string) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="8" fill="${color}" opacity="0.9"/><circle cx="20" cy="20" r="14" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/></svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      };
      const makeArrowDataUrl = (color: string, x1: number, y1: number, x2: number, y2: number) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
              <polygon points="0 0, 8 3.5, 0 7" fill="${color}" />
            </marker>
          </defs>
          <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.2" stroke-opacity="0.85" marker-end="url(#ah)" />
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      };
      const makeFocusDataUrl = (x: number, y: number, color: string) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <radialGradient id="focusGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.34" />
              <stop offset="55%" stop-color="${color}" stop-opacity="0.12" />
              <stop offset="100%" stop-color="${color}" stop-opacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill="rgba(2,6,23,0.18)" />
          <circle cx="${x}" cy="${y}" r="16" fill="url(#focusGlow)" />
          <circle cx="${x}" cy="${y}" r="7.5" fill="none" stroke="${color}" stroke-width="1" stroke-opacity="0.6" />
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      };
      const makeCursorDataUrl = (color: string) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M12 8L24 44L31 31L45 45L49 41L35 27L48 20L12 8Z" fill="${color}" fill-opacity="0.95" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/></svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      };

      const currentPct = (currentFrame / Math.max(1, durationInFrames)) * 100;
      const windowSec = 4;
      const overlayEndPct = Math.min(100, currentPct + (windowSec / Math.max(1, durationInFrames / fps)) * 100);

      const newVisuals: VisualTimelineItem[] = [];
      const newTexts: TextTimelineItem[] = [];

      annotations.forEach((ann, idx) => {
        const key = `manual-${Date.now()}-${idx}`;
        const xmin = clampPct(ann.bbox[1]);
        const xmax = clampPct(ann.bbox[3]);
        const bx = clampPct(Math.min(xmin, xmax), 0, 98);
        // by removed (unused)
        const bw = clampPct(Math.max(2, Math.abs(xmax - xmin)), 2, 100 - bx);
        // bh removed (unused)
        const px = clampPct(ann.point[1], 0, 98);
        const py = clampPct(ann.point[0], 0, 98);
        const pointBiasX = px > 62 ? -26 : 6;
        const pointBiasY = py > 72 ? -12 : -6;
        const calloutX = clampPct(px + pointBiasX, 2, 70);
        const calloutY = clampPct(py + pointBiasY, 2, 88);
        const calloutAnchorX = clampPct(calloutX + 6, 0, 100);
        const calloutAnchorY = clampPct(calloutY + 5, 0, 100);
        const showFocus = annotationOverlayStyle === "focus-arrow";
        const showArrow = annotationOverlayStyle !== "minimal";
        const color = "#c084fc"; // purple for manual annotations
        const start = Math.round(currentPct);
        const end = Math.round(overlayEndPct);

        if (showFocus) {
          newVisuals.push({
            id: `manual-region-focus-${key}`,
            name: `Focus: ${ann.label}`,
            size: 0,
            url: makeFocusDataUrl(px, py, color),
            type: "image",
            mimeType: "image/svg+xml",
            start, end,
            sourceKind: "upload",
            trimBeforeFrames: 0,
            trimAfterFrames: 0,
            transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
            crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
            appearance: makeDefaultAppearance(),
            ai: { backgroundRemoved: false },
            layout3d: makeDefaultLayout3d(),
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });

          newVisuals.push({
            id: `manual-region-cursor-${key}`,
            name: `Cursor: ${ann.label}`,
            size: 0,
            url: makeCursorDataUrl(color),
            type: "image",
            mimeType: "image/svg+xml",
            start,
            end,
            sourceKind: "upload",
            trimBeforeFrames: 0,
            trimAfterFrames: 0,
            transform: { x: clampPct(px - 2.4, 0, 96), y: clampPct(py - 1.6, 0, 96), width: 4.8, height: 4.8, rotation: -10 },
            crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
            appearance: makeDefaultAppearance(),
            ai: { backgroundRemoved: false },
            layout3d: makeDefaultLayout3d(),
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });
        }
        newVisuals.push({
          id: `manual-region-point-${key}`,
          name: `Point: ${ann.label}`,
          size: 0,
          url: makePointDataUrl(color),
          type: "image",
          mimeType: "image/svg+xml",
          start, end,
          sourceKind: "upload",
          trimBeforeFrames: 0,
          trimAfterFrames: 0,
          transform: { x: clampPct(px - 1.2, 0, 98), y: clampPct(py - 1.2, 0, 98), width: 2.4, height: 2.4, rotation: 0 },
          crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
          appearance: makeDefaultAppearance(),
          ai: { backgroundRemoved: false },
          layout3d: makeDefaultLayout3d(),
          enterAnimation: makeDefaultAnimation(),
          exitAnimation: makeDefaultAnimation(),
        });
        if (showArrow) {
          newVisuals.push({
            id: `manual-region-arrow-${key}`,
            name: `Arrow: ${ann.label}`,
            size: 0,
            url: makeArrowDataUrl(color, calloutAnchorX, calloutAnchorY, px, py),
            type: "image",
            mimeType: "image/svg+xml",
            start, end,
            sourceKind: "upload",
            trimBeforeFrames: 0,
            trimAfterFrames: 0,
            transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
            crop: { enabled: false, aspectRatio: "16:9", region: { left: 0, top: 0, right: 0, bottom: 0 }, objectFit: "contain" },
            appearance: makeDefaultAppearance(),
            ai: { backgroundRemoved: false },
            layout3d: makeDefaultLayout3d(),
            enterAnimation: makeDefaultAnimation(),
            exitAnimation: makeDefaultAnimation(),
          });
        }
        newTexts.push({
          id: `manual-region-text-${key}`,
          name: `Callout: ${ann.label}`,
          text: `${ann.label}: ${ann.explanation}`,
          start, end,
          transform: { x: calloutX, y: calloutY, width: clampPct(Math.max(18, Math.min(28, bw + 8)), 18, 32), height: 9, rotation: 0 },
          style: {
            fontFamily: "Inter",
            fontWeight: "700",
            fontSize: 22,
            letterSpacing: 0,
            textAlign: "left",
            color: "#ffffff",
            highlightColor: "rgba(88, 28, 135, 0.75)",
            shadow: { enabled: true, color: "#000000", blur: 10, offsetX: 0, offsetY: 1 },
          },
          preset: "subtitle",
          enterAnimation: makeDefaultAnimation(),
          exitAnimation: makeDefaultAnimation(),
        });
      });

      setTimelineVisualItems((prev) => [...newVisuals, ...prev]);
      setTimelineTextItems((prev) => [...newTexts, ...prev]);
    } catch (err) {
      console.error("[annotation] failed:", err);
    } finally {
      setIsAnnotating(false);
      setAnnotationMode(false);
    }
  }, [Component, annotationOverlayStyle, currentFrame, currentAspect, fps, durationInFrames, makeDefaultAppearance, makeDefaultAnimation, makeDefaultLayout3d]);

  const handleTextChange = useCallback((changes: Partial<Pick<TextTimelineItem, "text" | "name">>) => {
    if (!timelineTextItem) return;
    setTimelineTextItems((prev) => prev.map((item) => item.id === timelineTextItem.id ? { ...item, ...changes } : item));
    setTimelineTextItem((prev) => prev && prev.id === timelineTextItem.id ? { ...prev, ...changes } : prev);
  }, [timelineTextItem]);

  const handleTextStyleChange = useCallback((changes: Partial<TextStyleOptions>) => {
    if (!timelineTextItem) return;
    setTimelineTextItems((prev) => prev.map((item) => item.id === timelineTextItem.id ? { ...item, style: { ...item.style, ...changes } } : item));
    setTimelineTextItem((prev) => prev && prev.id === timelineTextItem.id ? { ...prev, style: { ...prev.style, ...changes } } : prev);
  }, [timelineTextItem]);

  const handleTextTransformChange = useCallback((next: VisualTransform) => {
    if (!timelineTextItem) return;
    setTimelineTextItems((prev) => prev.map((item) => item.id === timelineTextItem.id ? { ...item, transform: next } : item));
    setTimelineTextItem((prev) => prev && prev.id === timelineTextItem.id ? { ...prev, transform: next } : prev);
  }, [timelineTextItem]);

  const handleDeleteMedia = useCallback(async (item: UploadedMediaItem) => {
    const storageKey = item.storageKey ?? (item.id.startsWith("uploads/") ? item.id : undefined);

    if (storageKey) {
      setDeletingMediaIds((previous) => [...previous, item.id]);
      try {
        const resp = await fetch("/api/agent/media/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: storageKey }),
        });
        if (!resp.ok) {
          throw new Error(`Delete failed (${resp.status})`);
        }
      } catch (error) {
        console.warn("[media-delete] failed to delete from GCS:", error);
        setDeletingMediaIds((previous) => previous.filter((id) => id !== item.id));
        return;
      }
      setDeletingMediaIds((previous) => previous.filter((id) => id !== item.id));
    }

    setUploadedMedia((previous) => previous.filter((media) => media.id !== item.id));
    setTimelineVisualItems((previous) => previous.filter((media) => media.url !== item.url));
    setTimelineAudioItems((previous) => previous.filter((media) => media.url !== item.url));
    if (item.url.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }

    if (uploadedImageUrl === item.url) {
      setUploadedImageUrl(null);
      setUploadedImageName(null);
      setCode(emptyCompositionCode);
      compileCode(emptyCompositionCode);
    }

    if (timelineVisualItem?.id === item.id) {
      setTimelineVisualItem(null);
    }

    if (timelineAudioItem?.id === item.id) {
      setTimelineAudioItem(null);
    }

    if (selectedMediaForAction?.id === item.id) {
      setSelectedMediaForAction(null);
    }
  }, [
    compileCode,
    deletingMediaIds,
    emptyCompositionCode,
    selectedMediaForAction?.id,
    setCode,
    timelineAudioItem?.id,
    timelineVisualItem?.id,
    uploadedImageUrl,
  ]);

  const filteredMedia = useMemo(() => {
    if (mediaFilter === "all") {
      return uploadedMedia;
    }

    return uploadedMedia.filter((item) => item.type === mediaFilter);
  }, [mediaFilter, uploadedMedia]);

  const mediaStats = useMemo(() => {
    return {
      all: uploadedMedia.length,
      image: uploadedMedia.filter((item) => item.type === "image").length,
      video: uploadedMedia.filter((item) => item.type === "video").length,
      audio: uploadedMedia.filter((item) => item.type === "audio").length,
      document: uploadedMedia.filter((item) => item.type === "document").length,
    };
  }, [uploadedMedia]);

  useEffect(() => {
    uploadedMediaRef.current = uploadedMedia;
  }, [uploadedMedia]);

  useEffect(() => {
    return () => {
      uploadedMediaRef.current.forEach((item) => {
        if (item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!isAspectMenuOpen) {
        return;
      }

      if (aspectMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsAspectMenuOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isAspectMenuOpen]);

  const handleDuplicateLayer = useCallback((track: "visual" | "audio" | "text") => {
    if (track === "text" && timelineTextItem) {
      const duplicate: TextTimelineItem = {
        ...timelineTextItem,
        id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: `${timelineTextItem.name} copy`,
      };
      setTimelineTextItems((prev) => [duplicate, ...prev]);
      setTimelineTextItem(duplicate);
      return;
    }
    if (track === "visual" && timelineVisualItem) {
      const duplicate: VisualTimelineItem = {
        ...timelineVisualItem,
        id: `${timelineVisualItem.id}-copy-${Date.now()}`,
        name: `${timelineVisualItem.name} copy`,
      };
      setUploadedMedia((previous) => [duplicate, ...previous]);
      setTimelineVisualItems((previous) => [duplicate, ...previous]);
      setTimelineVisualItem(duplicate);

      const width = clipEnd - clipStart;
      const shiftedStart = Math.min(100 - width, clipStart + 4);
      const shiftedEnd = Math.min(100, shiftedStart + width);
      setClipStart(shiftedStart);
      setClipEnd(shiftedEnd);
      handleClipChange(shiftedStart, shiftedEnd);
      return;
    }

    if (track === "audio" && timelineAudioItem) {
      const duplicate = {
        ...timelineAudioItem,
        id: `${timelineAudioItem.id}-copy-${Date.now()}`,
        name: `${timelineAudioItem.name} copy`,
      };
      setUploadedMedia((previous) => [duplicate, ...previous]);
      setTimelineAudioItems((previous) => [duplicate, ...previous]);
      setTimelineAudioItem(duplicate);
    }
  }, [
    clipEnd,
    clipStart,
    handleClipChange,
    timelineAudioItem,
    timelineVisualItem,
    timelineTextItem,
  ]);

  const handleDeleteLayer = useCallback((track: "visual" | "audio" | "text") => {
    if (track === "visual" && timelineVisualItem) {
      setTimelineVisualItems((previous) => previous.filter((item) => item.id !== timelineVisualItem.id));
      setTimelineVisualItem(null);
      setUploadedImageUrl(null);
      setUploadedImageName(null);
      setCode(emptyCompositionCode);
      compileCode(emptyCompositionCode);
    }

    if (track === "audio" && timelineAudioItem) {
      setTimelineAudioItems((previous) => previous.filter((item) => item.id !== timelineAudioItem.id));
      setTimelineAudioItem(null);
    }
    if (track === "text" && timelineTextItem) {
      setTimelineTextItems((previous) => previous.filter((item) => item.id !== timelineTextItem.id));
      setTimelineTextItem(null);
    }
  }, [compileCode, emptyCompositionCode, setCode, timelineAudioItem, timelineVisualItem, timelineTextItem]);

  const handleCutAtPlayhead = useCallback(() => {
    const progress = durationInFrames > 0 ? (currentFrame / durationInFrames) * 100 : 0;
    const framePercent = 100 / Math.max(1, durationInFrames);

    if (timelineVisualItem) {
      const item = timelineVisualItem;
      const split = Math.max(item.start + framePercent, Math.min(item.end - framePercent, progress));
      if (split <= item.start + framePercent / 2 || split >= item.end - framePercent / 2) return;

      const right: VisualTimelineItem = {
        ...item,
        id: `${item.id}-cut-${Date.now()}`,
        name: `${item.name} (2)`,
        start: split,
      };

      setTimelineVisualItems((previous) => {
        const index = previous.findIndex((entry) => entry.id === item.id);
        if (index === -1) return previous;
        const next = [...previous];
        next[index] = { ...next[index], end: split };
        next.splice(index + 1, 0, right);
        return next;
      });

      setTimelineVisualItem(right);
      setClipStart(right.start);
      setClipEnd(right.end);
      return;
    }

    if (timelineTextItem) {
      const item = timelineTextItem;
      const split = Math.max(item.start + framePercent, Math.min(item.end - framePercent, progress));
      if (split <= item.start + framePercent / 2 || split >= item.end - framePercent / 2) return;

      const right: TextTimelineItem = {
        ...item,
        id: `${item.id}-cut-${Date.now()}`,
        name: `${item.name} (2)`,
        start: split,
      };

      setTimelineTextItems((previous) => {
        const index = previous.findIndex((entry) => entry.id === item.id);
        if (index === -1) return previous;
        const next = [...previous];
        next[index] = { ...next[index], end: split };
        next.splice(index + 1, 0, right);
        return next;
      });

      setTimelineTextItem(right);
      return;
    }

    if (timelineAudioItem) {
      const item = timelineAudioItem;
      const split = Math.max(item.start + framePercent, Math.min(item.end - framePercent, progress));
      if (split <= item.start + framePercent / 2 || split >= item.end - framePercent / 2) return;

      const right: AudioTimelineItem = {
        ...item,
        id: `${item.id}-cut-${Date.now()}`,
        name: `${item.name} (2)`,
        start: split,
      };

      setTimelineAudioItems((previous) => {
        const index = previous.findIndex((entry) => entry.id === item.id);
        if (index === -1) return previous;
        const next = [...previous];
        next[index] = { ...next[index], end: split };
        next.splice(index + 1, 0, right);
        return next;
      });

      setTimelineAudioItem(right);
      setClipStart(right.start);
      setClipEnd(right.end);
    }
  }, [
    currentFrame,
    durationInFrames,
    timelineVisualItem,
    timelineTextItem,
    timelineAudioItem,
  ]);

  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  // ── Audio playback sync ──────────────────────────────────────────────────
  // Keep a hidden HTMLAudioElement per timeline track and sync it with the
  // editor's isPlaying / currentFrame React state (Remotion player events
  // fire in an unreliable order, so we drive off React state instead).

  // Create / destroy Audio elements when the track list changes.
  useEffect(() => {
    const map = audioElsRef.current;
    const ids = new Set(timelineAudioItems.map((i) => i.id));
    Array.from(map.entries()).forEach(([id, el]) => {
      if (!ids.has(id)) { el.pause(); map.delete(id); }
    });
    timelineAudioItems.forEach((item) => {
      if (!map.has(item.id)) {
        const el = new Audio();
        el.src = item.url;
        el.preload = "auto";
        map.set(item.id, el);
      }
    });
  }, [timelineAudioItems]);

  // Pause all audio tracks when isPlaying goes false (stopping or seeking).
  useEffect(() => {
    if (!isPlaying) {
      audioElsRef.current.forEach((el) => el.pause());
    }
  }, [isPlaying]);

  // As the playhead moves, start/stop each audio track when it enters/exits its range.
  // By the time the playhead reaches an audio item, the user has already clicked Play
  // (a user gesture), so the browser permits programmatic el.play() here.
  useEffect(() => {
    if (!isPlaying) return;
    const map = audioElsRef.current;
    const progress = durationInFrames > 0 ? (currentFrame / durationInFrames) * 100 : 0;
    // One-frame tolerance prevents rounding from cutting audio off at scene boundary
    const oneFramePct = durationInFrames > 0 ? (100 / durationInFrames) : 0.5;
    timelineAudioItems.forEach((item) => {
      const el = map.get(item.id);
      if (!el) return;
      const inRange = progress >= item.start && progress < item.end + oneFramePct;
      if (inRange && el.paused) {
        const startFrame = Math.round((item.start / 100) * durationInFrames);
        const targetTime = Math.max(0, (currentFrame - startFrame) / fps);
        // Guard against replay when a clip already reached its natural end.
        if (Number.isFinite(el.duration) && targetTime >= Math.max(0, el.duration - 0.02)) {
          return;
        }
        el.currentTime = targetTime;
        el.play().catch(() => {});
      } else if (!inRange && !el.paused) {
        el.pause();
      }
    });
  }, [isPlaying, currentFrame, durationInFrames, fps, timelineAudioItems]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      audioElsRef.current.forEach((el) => el.pause());
      audioElsRef.current.clear();
    };
  }, []);
  // ── /Audio playback sync ─────────────────────────────────────────────────

  const handlePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      // Pause audio directly in user gesture context
      audioElsRef.current.forEach((el) => el.pause());
    } else {
      // Start audio directly in user gesture context (avoids browser autoplay block)
      const map = audioElsRef.current;
      const progress = durationInFrames > 0 ? (currentFrame / durationInFrames) * 100 : 0;
      timelineAudioItems.forEach((item) => {
        const el = map.get(item.id);
        if (!el) return;
        if (progress >= item.start && progress < item.end) {
          const startFrame = Math.round((item.start / 100) * durationInFrames);
          el.currentTime = Math.max(0, (currentFrame - startFrame) / fps);
          el.play().catch(() => {});
        }
      });
      player.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentFrame, durationInFrames, fps, timelineAudioItems]);

  const handleStep = useCallback((direction: -1 | 1) => {
    const player = playerRef.current;
    if (!player) {
      return;
    }

    const current = player.getCurrentFrame();
    const next = Math.max(
      0,
      Math.min(
        current + direction,
        Math.max(durationInFrames - 1, 0),
      ),
    );

    player.pause();
    setIsPlaying(false);
    player.seekTo(next);
  }, [durationInFrames]);

  const seekToFrame = useCallback(
    (frame: number) => {
      const player = playerRef.current;
      if (!player) {
        return;
      }

      const clamped = Math.max(
        0,
        Math.min(frame, Math.max(durationInFrames - 1, 0)),
      );

      player.pause();
      setIsPlaying(false);
      player.seekTo(clamped);
      setCurrentFrame(clamped);
    },
    [durationInFrames],
  );

  const formatTimecode = useCallback(
    (frames: number) => {
      if (fps <= 0) return "0:00.00";
      const total = frames / fps;
      const minutes = Math.floor(total / 60);
      const seconds = Math.floor(total % 60);
      const fraction = Math.floor((total - Math.floor(total)) * 100);
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${fraction
        .toString()
        .padStart(2, "0")}`;
    },
    [fps],
  );

  const handleZoomOut = useCallback(() => {
    setTimelineZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  }, []);

  const handleZoomIn = useCallback(() => {
    setTimelineZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))));
  }, []);

  const handleZoomSlider = useCallback(
    (value: number) => {
      const normalized = 0.5 + (value / 100) * (3 - 0.5);
      setTimelineZoom(Number(normalized.toFixed(2)));
    },
    [],
  );

  const handleResizeStart: React.PointerEventHandler<HTMLDivElement> =
    useCallback((e) => {
      e.preventDefault();
      setIsResizing(true);
    }, []);

  const splitRafRef = useRef<number | null>(null);
  const splitPendingRatioRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event: PointerEvent) => {
      const container = splitContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const minTop = rect.top + 120;
      const maxTop = rect.bottom - 160;
      const y = Math.min(Math.max(event.clientY, minTop), maxTop);
      const ratio = (y - rect.top) / rect.height;
      const clamped = Math.min(0.8, Math.max(0.3, ratio));

      splitPendingRatioRef.current = clamped;
      if (splitRafRef.current === null) {
        splitRafRef.current = requestAnimationFrame(() => {
          splitRafRef.current = null;
          const next = splitPendingRatioRef.current;
          if (next !== null) {
            setPreviewRatio(next);
            splitPendingRatioRef.current = null;
          }
        });
      }
    };

    const handleUp = () => {
      if (splitRafRef.current !== null) {
        cancelAnimationFrame(splitRafRef.current);
        splitRafRef.current = null;
      }
      const next = splitPendingRatioRef.current;
      if (next !== null) {
        setPreviewRatio(next);
        splitPendingRatioRef.current = null;
      }
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      if (splitRafRef.current !== null) {
        cancelAnimationFrame(splitRafRef.current);
      }
    };
  }, [isResizing]);

  const handleSidebarTabClick = useCallback(
    (tab: typeof activeTab) => {
      // When user explicitly switches sidebar tab, treat it as switching
      // to a tool/category view rather than a specific layer.
      setActiveTab(tab);
      setTimelineVisualItem(null);
      setTimelineAudioItem(null);
      setIsCanvasLayerSelected(false);
    },
    [],
  );

  const startCanvasMove: React.PointerEventHandler<HTMLDivElement> = useCallback((event) => {
    if (!timelineVisualItem || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsCanvasLayerSelected(true);
    setIsCanvasInteracting(true);
    canvasInteractionRef.current = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      initial: visualTransform,
    };
  }, [timelineVisualItem, visualTransform]);

  const startCanvasResize = useCallback((handle: "nw" | "ne" | "sw" | "se") => {
    return (event: React.PointerEvent<HTMLDivElement>) => {
      if (!timelineVisualItem || event.button !== 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setIsCanvasLayerSelected(true);
      setIsCanvasInteracting(true);
      canvasInteractionRef.current = {
        mode: "resize",
        handle,
        startX: event.clientX,
        startY: event.clientY,
        initial: visualTransform,
      };
    };
  }, [timelineVisualItem, visualTransform]);

  const startCanvasRotate: React.PointerEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (!timelineVisualItem || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const stage = canvasStageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const layerLeft = (rect.width * visualTransform.x) / 100;
      const layerTop = (rect.height * visualTransform.y) / 100;
      const layerW = (rect.width * visualTransform.width) / 100;
      const layerH = (rect.height * visualTransform.height) / 100;
      const centerX = rect.left + layerLeft + layerW / 2;
      const centerY = rect.top + layerTop + layerH / 2;
      const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
      setIsCanvasLayerSelected(true);
      setIsCanvasInteracting(true);
      rotateInteractionRef.current = {
        startAngle,
        initialRotation: visualTransform.rotation ?? 0,
        centerX,
        centerY,
      };
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    },
    [timelineVisualItem, visualTransform],
  );

  const startTextCanvasMove: React.PointerEventHandler<HTMLDivElement> = useCallback((event) => {
    if (!timelineTextItem || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setIsCanvasLayerSelected(true);
    setIsCanvasInteracting(true);
    textCanvasInteractionRef.current = {
      mode: "move",
      startX: event.clientX,
      startY: event.clientY,
      initial: timelineTextItem.transform,
      itemId: timelineTextItem.id,
    };
  }, [timelineTextItem]);

  const startTextCanvasResize = useCallback((handle: "nw" | "ne" | "sw" | "se") => {
    return (event: React.PointerEvent<HTMLDivElement>) => {
      if (!timelineTextItem || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      setIsCanvasLayerSelected(true);
      setIsCanvasInteracting(true);
      textCanvasInteractionRef.current = {
        mode: "resize",
        handle,
        startX: event.clientX,
        startY: event.clientY,
        initial: timelineTextItem.transform,
        itemId: timelineTextItem.id,
      };
    };
  }, [timelineTextItem]);

  const startTextCanvasRotate: React.PointerEventHandler<HTMLDivElement> = useCallback((event) => {
    if (!timelineTextItem || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const stage = canvasStageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const t = timelineTextItem.transform;
    const layerLeft = (rect.width * t.x) / 100;
    const layerTop = (rect.height * t.y) / 100;
    const layerW = (rect.width * t.width) / 100;
    const layerH = (rect.height * t.height) / 100;
    const centerX = rect.left + layerLeft + layerW / 2;
    const centerY = rect.top + layerTop + layerH / 2;
    const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    setIsCanvasLayerSelected(true);
    setIsCanvasInteracting(true);
    textRotateInteractionRef.current = {
      startAngle,
      initialRotation: t.rotation ?? 0,
      centerX,
      centerY,
      itemId: timelineTextItem.id,
    };
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }, [timelineTextItem]);

  const startCropResize = useCallback(
    (handle: CropHandle) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (!timelineVisualItem || event.button !== 0 || !(timelineVisualItem.crop?.enabled)) return;
      event.preventDefault();
      event.stopPropagation();
      setIsCanvasLayerSelected(true);
      setIsCanvasInteracting(true);
      const region = getCropRegion(timelineVisualItem);
      cropInteractionRef.current = {
        handle,
        startX: event.clientX,
        startY: event.clientY,
        initial: region,
        itemId: timelineVisualItem.id,
      };
      (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    },
    [timelineVisualItem, getCropRegion],
  );

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const stage = canvasStageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const textRotateInteraction = textRotateInteractionRef.current;
      if (textRotateInteraction) {
        const currentAngle = Math.atan2(
          event.clientY - textRotateInteraction.centerY,
          event.clientX - textRotateInteraction.centerX,
        );
        const deltaDeg = ((currentAngle - textRotateInteraction.startAngle) * 180) / Math.PI;
        let rotation = textRotateInteraction.initialRotation + deltaDeg;
        rotation = ((rotation % 360) + 360) % 360;
        if (rotation > 180) rotation -= 360;
        const itemId = textRotateInteraction.itemId;
        setTimelineTextItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, transform: { ...item.transform, rotation } } : item
          )
        );
        setTimelineTextItem((prev) =>
          prev?.id === itemId ? { ...prev, transform: { ...prev.transform, rotation } } : prev
        );
        return;
      }

      const rotateInteraction = rotateInteractionRef.current;
      if (rotateInteraction) {
        const currentAngle = Math.atan2(
          event.clientY - rotateInteraction.centerY,
          event.clientX - rotateInteraction.centerX,
        );
        const deltaDeg = ((currentAngle - rotateInteraction.startAngle) * 180) / Math.PI;
        let rotation = rotateInteraction.initialRotation + deltaDeg;
        rotation = ((rotation % 360) + 360) % 360;
        if (rotation > 180) rotation -= 360;
        setVisualTransform((prev) => ({ ...prev, rotation }));
        return;
      }

      const cropInteraction = cropInteractionRef.current;
      if (cropInteraction) {
        const layerW = (rect.width * visualTransform.width) / 100;
        const layerH = (rect.height * visualTransform.height) / 100;
        const dxLayer = layerW ? ((event.clientX - cropInteraction.startX) / layerW) * 100 : 0;
        const dyLayer = layerH ? ((event.clientY - cropInteraction.startY) / layerH) * 100 : 0;
        const r = { ...cropInteraction.initial };
        switch (cropInteraction.handle) {
          case "nw":
            r.left = Math.max(0, Math.min(r.left + dxLayer, 100 - r.right - 1));
            r.top = Math.max(0, Math.min(r.top + dyLayer, 100 - r.bottom - 1));
            break;
          case "ne":
            r.right = Math.max(0, Math.min(r.right - dxLayer, 100 - r.left - 1));
            r.top = Math.max(0, Math.min(r.top + dyLayer, 100 - r.bottom - 1));
            break;
          case "sw":
            r.left = Math.max(0, Math.min(r.left + dxLayer, 100 - r.right - 1));
            r.bottom = Math.max(0, Math.min(r.bottom - dyLayer, 100 - r.top - 1));
            break;
          case "se":
            r.right = Math.max(0, Math.min(r.right - dxLayer, 100 - r.left - 1));
            r.bottom = Math.max(0, Math.min(r.bottom - dyLayer, 100 - r.top - 1));
            break;
          case "n":
            r.top = Math.max(0, Math.min(r.top + dyLayer, 100 - r.bottom - 1));
            break;
          case "s":
            r.bottom = Math.max(0, Math.min(r.bottom - dyLayer, 100 - r.top - 1));
            break;
          case "e":
            r.right = Math.max(0, Math.min(r.right - dxLayer, 100 - r.left - 1));
            break;
          case "w":
            r.left = Math.max(0, Math.min(r.left + dxLayer, 100 - r.right - 1));
            break;
        }
        const itemId = cropInteraction.itemId;
        setTimelineVisualItems((prev) =>
          prev.map((item) =>
            item.id === itemId && item.crop
              ? { ...item, crop: { ...item.crop, region: clampCropRegion(r) } }
              : item
          )
        );
        setTimelineVisualItem((prev) =>
          prev?.id === itemId && prev.crop
            ? { ...prev, crop: { ...prev.crop, region: clampCropRegion(r) } }
            : prev
        );
        return;
      }

      const textInteraction = textCanvasInteractionRef.current;
      if (textInteraction) {
        const dx = (event.clientX - textInteraction.startX) / rect.width * 100;
        const dy = (event.clientY - textInteraction.startY) / rect.height * 100;
        const itemId = textInteraction.itemId;
        const applyTransform = (next: VisualTransform) => {
          setTimelineTextItems((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, transform: next } : item))
          );
          setTimelineTextItem((prev) => (prev?.id === itemId ? { ...prev, transform: next } : prev));
        };
        if (textInteraction.mode === "move") {
          applyTransform(clampTransform({
            ...textInteraction.initial,
            x: textInteraction.initial.x + dx,
            y: textInteraction.initial.y + dy,
          }));
        } else {
          const next = { ...textInteraction.initial };
          switch (textInteraction.handle) {
            case "nw":
              next.x += dx; next.y += dy; next.width -= dx; next.height -= dy; break;
            case "ne":
              next.y += dy; next.width += dx; next.height -= dy; break;
            case "sw":
              next.x += dx; next.width -= dx; next.height += dy; break;
            case "se":
              next.width += dx; next.height += dy; break;
          }
          applyTransform(clampTransform(next));
        }
        return;
      }

      const interaction = canvasInteractionRef.current;
      if (!interaction) return;

      const dx = (event.clientX - interaction.startX) / rect.width * 100;
      const dy = (event.clientY - interaction.startY) / rect.height * 100;

      if (interaction.mode === "move") {
        setVisualTransform(clampTransform({
          ...interaction.initial,
          x: interaction.initial.x + dx,
          y: interaction.initial.y + dy,
        }));
        return;
      }

      const next = { ...interaction.initial };
      switch (interaction.handle) {
        case "nw":
          next.x += dx;
          next.y += dy;
          next.width -= dx;
          next.height -= dy;
          break;
        case "ne":
          next.y += dy;
          next.width += dx;
          next.height -= dy;
          break;
        case "sw":
          next.x += dx;
          next.width -= dx;
          next.height += dy;
          break;
        case "se":
          next.width += dx;
          next.height += dy;
          break;
      }

      setVisualTransform(clampTransform(next));
    };

    const handleUp = () => {
      rotateInteractionRef.current = null;
      textRotateInteractionRef.current = null;
      textCanvasInteractionRef.current = null;
      cropInteractionRef.current = null;
      canvasInteractionRef.current = null;
      setIsCanvasInteracting(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [clampTransform, clampCropRegion, visualTransform, timelineTextItem]);

  return (
    <PageLayout hideHeader>
      <div className="flex-1 flex flex-col min-w-0 min-h-0 px-0 pb-0 font-sans">
        {/* Main Application Container */}
        <div className="flex-1 flex bg-[#0f172a] text-slate-100 overflow-hidden">
          
          {/* Left-most Icon Sidebar */}
          <div className="w-[68px] border-r border-[#1e293b] bg-[#0f172a] flex flex-col items-center py-4 z-20">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-6 cursor-pointer">
              <Layers className="w-5 h-5" />
            </div>
            
            {/* Icons */}
            <div className="flex flex-col items-center gap-4 text-slate-400 w-full">
              <button
                onClick={() => handleSidebarTabClick("agent")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "agent"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
                title="AI Agent"
              >
                <Bot className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSidebarTabClick("video")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "video"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
              >
                <Film className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSidebarTabClick("text")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "text"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
              >
                <Type className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSidebarTabClick("audio")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "audio"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
              >
                <Music2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSidebarTabClick("elements")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "elements"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSidebarTabClick("image")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "image"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSidebarTabClick("caption")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "caption"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSidebarTabClick("media")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "media"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
              >
                <Folder className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSidebarTabClick("template")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  activeTab === "template"
                    ? "bg-[#1e293b] text-blue-400 border-l-2 border-blue-500"
                    : "hover:text-slate-200"
                }`}
              >
                <LayoutTemplate className="w-5 h-5" />
              </button>
            </div>
            
            {/* Bottom Icon */}
            <div className="mt-auto pb-2">
              <button className="w-12 h-12 rounded-lg flex items-center justify-center hover:text-slate-200 text-slate-400">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Secondary Sidebar */}
          <div className="w-[300px] min-h-0 border-r border-[#1e293b] bg-[#0f172a] flex flex-col z-10 overflow-y-auto custom-scrollbar">
            {timelineVisualItem ? (
              <>
                <div className="h-14 flex items-center justify-between px-5 border-b border-[#1e293b] shrink-0">
                  <h2 className="text-sm font-medium text-slate-200 truncate flex-1 mr-2">
                    {timelineVisualItem.type === "video"
                      ? "Video"
                      : timelineVisualItem.sourceKind === "emoji"
                        ? "Emoji"
                        : timelineVisualItem.sourceKind === "sticker"
                          ? "Sticker"
                          : timelineVisualItem.sourceKind === "shape"
                            ? "Shape"
                            : timelineVisualItem.sourceKind === "shader"
                              ? "Shader"
                              : "Image"} — {timelineVisualItem.name}
                  </h2>
                  <button
                    className="text-slate-400 hover:text-slate-200 shrink-0 p-1"
                    onClick={() => {
                      setTimelineVisualItem(null);
                      setIsCanvasLayerSelected(false);
                    }}
                    aria-label="Close properties"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex p-1 bg-[#162032] rounded-md gap-1">
                    <button
                      type="button"
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded flex items-center justify-center gap-1.5 ${
                        layerSubTab === "settings"
                          ? "bg-[#1e293b] text-slate-200 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      onClick={() => setLayerSubTab("settings")}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded flex items-center justify-center gap-1.5 ${
                        layerSubTab === "style"
                          ? "bg-[#1e293b] text-slate-200 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      onClick={() => setLayerSubTab("style")}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Style
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded flex items-center justify-center gap-1.5 ${
                        layerSubTab === "ai"
                          ? "bg-[#1e293b] text-slate-200 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      onClick={() => setLayerSubTab("ai")}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI
                    </button>
                  </div>

                  {layerSubTab === "settings" && (
                    <>
                      {/* Crop — separate from move/resize: only controls which part of the image is visible (aspect ratio), not layer position/size */}
                      <div className="flex flex-col gap-3 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300 flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            Crop
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={timelineVisualItem.crop?.enabled ?? false}
                            onClick={() =>
                              handleCropChange({
                                enabled: !(timelineVisualItem.crop?.enabled ?? false),
                              })
                            }
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                              (timelineVisualItem.crop?.enabled ?? false)
                                ? "bg-blue-600"
                                : "bg-[#1e293b]"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${
                                (timelineVisualItem.crop?.enabled ?? false)
                                  ? "translate-x-4 ml-0.5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                        {(timelineVisualItem.crop?.enabled ?? false) ? (
                          <>
                            <div>
                              <span className="text-xs text-slate-400 block mb-2">Aspect Ratios</span>
                              <div className="flex flex-wrap gap-1.5">
                                {["16:9", "9:16", "1:1", "4:5", "5:4", "4:3", "3:4", "21:9"].map((ratio) => (
                                  <button
                                    key={ratio}
                                    type="button"
                                    onClick={() => handleCropChange({ aspectRatio: ratio })}
                                    className={`px-2.5 py-1.5 rounded text-xs font-medium ${
                                      (timelineVisualItem.crop?.aspectRatio ?? "16:9") === ratio
                                        ? "bg-blue-600 text-white"
                                        : "bg-[#1e293b] text-slate-300 hover:bg-[#2a374c]"
                                    }`}
                                  >
                                    {ratio}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-slate-400 block mb-2">How image is viewed</span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCropChange({ objectFit: "contain" })}
                                  className={`flex-1 py-2 rounded text-xs font-medium ${
                                    (timelineVisualItem.crop?.objectFit ?? "contain") === "contain"
                                      ? "bg-blue-600 text-white"
                                      : "bg-[#1e293b] text-slate-300 hover:bg-[#2a374c]"
                                  }`}
                                >
                                  Fit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCropChange({ objectFit: "cover" })}
                                  className={`flex-1 py-2 rounded text-xs font-medium ${
                                    (timelineVisualItem.crop?.objectFit ?? "contain") === "cover"
                                      ? "bg-blue-600 text-white"
                                      : "bg-[#1e293b] text-slate-300 hover:bg-[#2a374c]"
                                  }`}
                                >
                                  Cover
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">Use handles to fine-tune</p>
                            <button
                              type="button"
                              onClick={() =>
                                handleCropChange({
                                  enabled: true,
                                  aspectRatio: "16:9",
                                  region: defaultCropRegion,
                                  objectFit: "contain",
                                })
                              }
                              className="w-full py-2 rounded-md bg-[#1e293b] text-slate-200 text-xs font-medium hover:bg-[#2a374c]"
                            >
                              Reset
                            </button>
                          </>
                        ) : null}
                      </div>
                      {/* Position — alignment grid + Fill Canvas */}
                      <div className="flex flex-col gap-3 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                        <span className="text-sm text-slate-300">Position</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { key: "tl", x: 0, y: 0 },
                            { key: "tc", x: 50 - visualTransform.width / 2, y: 0 },
                            { key: "tr", x: 100 - visualTransform.width, y: 0 },
                            { key: "ml", x: 0, y: 50 - visualTransform.height / 2 },
                            {
                              key: "c",
                              x: 50 - visualTransform.width / 2,
                              y: 50 - visualTransform.height / 2,
                            },
                            {
                              key: "mr",
                              x: 100 - visualTransform.width,
                              y: 50 - visualTransform.height / 2,
                            },
                            { key: "bl", x: 0, y: 100 - visualTransform.height },
                            {
                              key: "bc",
                              x: 50 - visualTransform.width / 2,
                              y: 100 - visualTransform.height,
                            },
                            {
                              key: "br",
                              x: 100 - visualTransform.width,
                              y: 100 - visualTransform.height,
                            },
                          ].map(({ key, x, y }) => {
                            const isCenter = key === "c";
                            const isActive =
                              Math.round(visualTransform.x) === Math.round(x) &&
                              Math.round(visualTransform.y) === Math.round(y);
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() =>
                                  handleVisualTransformChange({
                                    ...visualTransform,
                                    x,
                                    y,
                                  })
                                }
                                className={`aspect-square rounded-lg border flex items-center justify-center hover:border-blue-500 cursor-pointer ${
                                  isActive
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-[#1e293b] bg-[#1e293b]/50"
                                }`}
                                title={key === "c" ? "Center" : key}
                              >
                                <span className="text-slate-400 text-xs font-medium">
                                  {isCenter ? "◎" : ""}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleVisualTransformChange({
                              x: 0,
                              y: 0,
                              width: 100,
                              height: 100,
                              rotation: 0,
                            })
                          }
                          className="w-full py-2 rounded-md bg-[#1e293b] text-slate-200 text-xs font-medium hover:bg-[#2a374c]"
                        >
                          Fill Canvas
                        </button>
                      </div>
                      <div
                        className="flex items-center justify-between p-3 bg-[#162032] rounded-lg border border-[#1e293b] cursor-pointer hover:bg-[#1e293b]"
                        onClick={() =>
                          setIsEnterAnimationsOpen((open) => !open)
                        }
                      >
                        <span className="text-sm text-slate-300">
                          Enter Animations (37)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            isEnterAnimationsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {timelineVisualItem.type === "video" ? (
                        <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                          <span className="text-sm text-slate-300 flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            Source Trim (frames)
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-xs text-slate-400 flex flex-col gap-1">
                              Trim Before
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={Math.max(0, Math.round(timelineVisualItem.trimBeforeFrames ?? 0))}
                                onChange={(event) => {
                                  const parsed = Number(event.target.value);
                                  if (!Number.isNaN(parsed)) {
                                    handleSourceTrimChange({ trimBeforeFrames: parsed });
                                  }
                                }}
                                className="w-full rounded bg-[#0f172a] border border-[#1e293b] px-2 py-1.5 text-slate-100 text-xs"
                              />
                            </label>
                            <label className="text-xs text-slate-400 flex flex-col gap-1">
                              Trim After
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={Math.max(0, Math.round(timelineVisualItem.trimAfterFrames ?? 0))}
                                onChange={(event) => {
                                  const parsed = Number(event.target.value);
                                  if (!Number.isNaN(parsed)) {
                                    handleSourceTrimChange({ trimAfterFrames: parsed });
                                  }
                                }}
                                className="w-full rounded bg-[#0f172a] border border-[#1e293b] px-2 py-1.5 text-slate-100 text-xs"
                              />
                            </label>
                          </div>
                        </div>
                      ) : null}
                      {timelineVisualItem.sourceKind === "shader" ? (
                        <div className="flex flex-col gap-3 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                          <span className="text-sm text-slate-300">Shader Controls</span>
                          <label className="text-xs text-slate-400 flex flex-col gap-1">
                            Variant
                            <select
                              className="rounded-md bg-[#1e293b] border border-[#1e293b] px-2 py-1.5 text-xs text-slate-200"
                              value={timelineVisualItem.shaderVariant ?? "aurora"}
                              onChange={(event) => handleShaderSettingsChange({ shaderVariant: event.target.value as VisualTimelineItem["shaderVariant"] })}
                            >
                              {SHADER_LIBRARY.map((shader) => (
                                <option key={shader.id} value={shader.id}>
                                  {shader.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Speed</span>
                              <span>{(timelineVisualItem.shaderSpeed ?? 1).toFixed(2)}x</span>
                            </div>
                            <input
                              type="range"
                              min={0.2}
                              max={4}
                              step={0.1}
                              value={timelineVisualItem.shaderSpeed ?? 1}
                              onChange={(event) => handleShaderSettingsChange({ shaderSpeed: Number(event.target.value) })}
                              className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <span>Intensity</span>
                              <span>{(timelineVisualItem.shaderIntensity ?? 1).toFixed(2)}x</span>
                            </div>
                            <input
                              type="range"
                              min={0.2}
                              max={2.5}
                              step={0.05}
                              value={timelineVisualItem.shaderIntensity ?? 1}
                              onChange={(event) => handleShaderSettingsChange({ shaderIntensity: Number(event.target.value) })}
                              className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
                            />
                          </div>
                        </div>
                      ) : null}
                      {isEnterAnimationsOpen ? (
                        <div className="grid grid-cols-4 gap-2 px-3 pb-2">
                          {enterPresets.map(({ id, label }) => {
                            const isActive =
                              (timelineVisualItem?.enterAnimation?.preset ?? "none") === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => updateLayerAnimation("enter", id)}
                                className={`text-xs px-2 py-2 rounded-md border transition-colors text-center leading-tight min-h-[2.25rem] ${
                                  isActive
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-[#101827] text-slate-300 hover:bg-[#1d283a] border-[#1e293b]"
                                }`}
                                title={label}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      <div
                        className="flex items-center justify-between p-3 bg-[#162032] rounded-lg border border-[#1e293b] cursor-pointer hover:bg-[#1e293b]"
                        onClick={() =>
                          setIsExitAnimationsOpen((open) => !open)
                        }
                      >
                        <span className="text-sm text-slate-300">
                          Exit Animations (37)
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            isExitAnimationsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {isExitAnimationsOpen ? (
                        <div className="grid grid-cols-4 gap-2 px-3 pb-2">
                          {exitPresets.map(({ id, label }) => {
                            const isActive =
                              (timelineVisualItem?.exitAnimation?.preset ?? "none") === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => updateLayerAnimation("exit", id)}
                                className={`text-xs px-2 py-2 rounded-md border transition-colors text-center leading-tight min-h-[2.25rem] ${
                                  isActive
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-[#101827] text-slate-300 hover:bg-[#1d283a] border-[#1e293b]"
                                }`}
                                title={label}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center justify-between cursor-pointer">
                          <span className="text-sm font-medium text-slate-200">
                            3D Layout Effects (9)
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-500 transform rotate-180" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { key: "none", label: "None" },
                              { key: "tiltUp", label: "Tilt Up" },
                              { key: "tiltDown", label: "Tilt Down" },
                              { key: "left", label: "Left" },
                              { key: "right", label: "Right" },
                              { key: "book", label: "Book" },
                              { key: "floating", label: "Floating" },
                              { key: "billboard", label: "Billboard" },
                              { key: "skewed", label: "Skewed" },
                            ] as { key: Layout3dPreset; label: string }[]
                          ).map(({ key, label }) => {
                            const isActive =
                              (timelineVisualItem.layout3d?.preset ?? "none") === key;
                            const baseClasses =
                              "aspect-square rounded-lg border bg-[#162032] flex flex-col items-center justify-center gap-2 cursor-pointer";
                            const activeClasses = isActive
                              ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.35)]"
                              : "border-[#1e293b] hover:border-blue-500";
                            return (
                              <button
                                key={key}
                                type="button"
                                className={`${baseClasses} ${activeClasses}`}
                                onClick={() => {
                                  const nextLayout: Layout3dOptions = {
                                    preset: key,
                                    intensity:
                                      timelineVisualItem.layout3d?.intensity ?? 1,
                                  };
                                  setTimelineVisualItems((prev) =>
                                    prev.map((item) =>
                                      item.id === timelineVisualItem.id
                                        ? { ...item, layout3d: nextLayout }
                                        : item,
                                    ),
                                  );
                                  setTimelineVisualItem((prev) =>
                                    prev && prev.id === timelineVisualItem.id
                                      ? { ...prev, layout3d: nextLayout }
                                      : prev,
                                  );
                                }}
                              >
                                <div className="w-8 h-8 bg-blue-500 rounded shadow-md opacity-80" />
                                <span
                                  className={`text-[10px] ${
                                    isActive ? "text-blue-300" : "text-slate-400"
                                  }`}
                                >
                                  {label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {layerSubTab === "style" && timelineVisualItem.type === "image" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                        <span className="text-sm text-slate-300">Fit</span>
                        <select
                          className="mt-1 rounded-md bg-[#1e293b] border border-[#1e293b] px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={currentImageAppearance.fit}
                          onChange={(e) =>
                            updateImageAppearance({
                              fit: e.target.value as AppearanceOptions["fit"],
                            })
                          }
                        >
                          <option value="contain">Contain</option>
                          <option value="cover">Cover</option>
                          <option value="fill">Fill</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                        <span className="text-sm text-slate-300">Filter preset</span>
                        <select
                          className="mt-1 rounded-md bg-[#1e293b] border border-[#1e293b] px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={currentImageAppearance.filterPreset}
                          onChange={(e) =>
                            updateImageAppearance({
                              filterPreset: e.target.value as AppearanceOptions["filterPreset"],
                            })
                          }
                        >
                          <option value="none">None</option>
                          <option value="grayscale">Grayscale</option>
                          <option value="sepia">Sepia</option>
                          <option value="vibrant">Vibrant</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                        <div className="flex items-center justify-between text-sm text-slate-300">
                          <span>Border radius</span>
                          <span className="text-xs text-slate-400">
                            {Math.round(currentImageAppearance.borderRadius)} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={64}
                          value={currentImageAppearance.borderRadius}
                          onChange={(e) =>
                            updateImageAppearance({
                              borderRadius: Number(e.target.value),
                            })
                          }
                          className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                        />
                      </div>

                      <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                        <div className="flex items-center justify-between text-sm text-slate-300">
                          <span>Brightness</span>
                          <span className="text-xs text-slate-400">
                            {Math.round(currentImageAppearance.brightness)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={200}
                          value={currentImageAppearance.brightness}
                          onChange={(e) =>
                            updateImageAppearance({
                              brightness: Number(e.target.value),
                            })
                          }
                          className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                        />
                      </div>

                      <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                        <div className="flex items-center justify-between text-sm text-slate-300">
                          <span>Padding</span>
                          <span className="text-xs text-slate-400">
                            {Math.round(currentImageAppearance.padding)} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={48}
                          value={currentImageAppearance.padding}
                          onChange={(e) =>
                            updateImageAppearance({
                              padding: Number(e.target.value),
                            })
                          }
                          className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                        />
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-slate-400">Padding background</span>
                          <input
                            type="color"
                            className="h-5 w-9 rounded border border-[#1e293b] bg-transparent p-0"
                            value={currentImageAppearance.paddingBackground}
                            onChange={(e) =>
                              updateImageAppearance({
                                paddingBackground: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {layerSubTab === "ai" && timelineVisualItem.type === "image" && (
                    <div className="flex flex-col gap-3">
                      {!selectedImageLayer ? (
                        <div className="p-3 rounded-lg border border-dashed border-[#1e293b] bg-[#050b1a] text-xs text-slate-400">
                          Select an <span className="font-medium text-slate-200">image layer</span> on the canvas or
                          timeline to use AI tools like background removal.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm text-slate-200">Remove background</span>
                              <span className="text-xs text-slate-500">
                                Runs in the browser, no upload required.
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled={selectedImageLayer.ai?.isProcessing}
                              onClick={toggleImageBackgroundRemoval}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors ${
                                selectedImageLayer.ai?.backgroundRemoved
                                  ? "bg-blue-600"
                                  : "bg-[#1e293b]"
                              } ${
                                selectedImageLayer.ai?.isProcessing ? "opacity-60 cursor-wait" : ""
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${
                                  selectedImageLayer.ai?.backgroundRemoved
                                    ? "translate-x-5 ml-0.5"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </div>
                          {selectedImageLayer.ai?.isProcessing && (
                            <p className="text-xs text-slate-400 mt-1">Removing background…</p>
                          )}
                          {selectedImageLayer.ai?.backgroundRemoved &&
                            !selectedImageLayer.ai?.isProcessing && (
                              <>
                                <p className="text-xs text-slate-400 mt-1">
                                  Background removed. Toggle off to restore the original image.
                                </p>
                                {selectedImageLayer.ai?.processedUrl && (
                                  <a
                                    href={selectedImageLayer.ai.processedUrl}
                                    download={
                                      selectedImageLayer.name
                                        ? `${selectedImageLayer.name.replace(/\.[^.]+$/, "")}-cutout.png`
                                        : "cutout.png"
                                    }
                                    className="mt-2 inline-flex"
                                  >
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="text-xs font-medium"
                                    >
                                      Download cutout
                                    </Button>
                                  </a>
                                )}
                              </>
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : timelineTextItem ? (
              <>
                <div className="h-14 flex items-center justify-between px-5 border-b border-[#1e293b] shrink-0">
                  <h2 className="text-sm font-medium text-slate-200 truncate flex-1 mr-2">Text — {timelineTextItem.name}</h2>
                  <button
                    className="text-slate-400 hover:text-slate-200 shrink-0 p-1"
                    onClick={() => setTimelineTextItem(null)}
                    aria-label="Close properties"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <span className="text-sm text-slate-300">Text content</span>
                    <textarea
                      className="rounded-md bg-[#1e293b] px-3 py-2 text-sm text-slate-200 w-full min-h-[80px] resize-y border border-transparent focus:border-blue-500 focus:outline-none"
                      value={timelineTextItem.text}
                      onChange={(e) => handleTextChange({ text: e.target.value, name: `T ${e.target.value.slice(0, 20)}` })}
                    />
                  </div>
                  <div className="flex flex-col gap-3 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Text Diff Char Morph</span>
                      <button
                        type="button"
                        role="switch"
                        onClick={() => {
                          if (!timelineTextItem) return;
                          const nextMode = timelineTextItem.diffMode === "charMorph" ? "none" : "charMorph";
                          setTimelineTextItems((prev) =>
                            prev.map((item) =>
                              item.id === timelineTextItem.id
                                ? {
                                    ...item,
                                    diffMode: nextMode,
                                    diffTargetText:
                                      nextMode === "charMorph"
                                        ? item.diffTargetText ?? item.text
                                        : item.diffTargetText,
                                    diffMorphSpeed: item.diffMorphSpeed ?? 1,
                                  }
                                : item,
                            ),
                          );
                          setTimelineTextItem((prev) =>
                            prev && prev.id === timelineTextItem.id
                              ? {
                                  ...prev,
                                  diffMode: nextMode,
                                  diffTargetText:
                                    nextMode === "charMorph"
                                      ? prev.diffTargetText ?? prev.text
                                      : prev.diffTargetText,
                                  diffMorphSpeed: prev.diffMorphSpeed ?? 1,
                                }
                              : prev,
                          );
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${timelineTextItem.diffMode === "charMorph" ? "bg-blue-600" : "bg-[#1e293b]"}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${timelineTextItem.diffMode === "charMorph" ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    {timelineTextItem.diffMode === "charMorph" ? (
                      <>
                        <label className="text-xs text-slate-400 flex flex-col gap-1">
                          Target Text
                          <textarea
                            className="rounded-md bg-[#1e293b] px-3 py-2 text-sm text-slate-200 w-full min-h-20 resize-y border border-transparent focus:border-blue-500 focus:outline-none"
                            value={timelineTextItem.diffTargetText ?? ""}
                            onChange={(event) => {
                              const value = event.target.value;
                              setTimelineTextItems((prev) =>
                                prev.map((item) =>
                                  item.id === timelineTextItem.id
                                    ? { ...item, diffTargetText: value }
                                    : item,
                                ),
                              );
                              setTimelineTextItem((prev) =>
                                prev && prev.id === timelineTextItem.id
                                  ? { ...prev, diffTargetText: value }
                                  : prev,
                              );
                            }}
                          />
                        </label>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Morph Speed</span>
                            <span>{(timelineTextItem.diffMorphSpeed ?? 1).toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min={0.2}
                            max={3}
                            step={0.1}
                            value={timelineTextItem.diffMorphSpeed ?? 1}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setTimelineTextItems((prev) =>
                                prev.map((item) =>
                                  item.id === timelineTextItem.id
                                    ? { ...item, diffMorphSpeed: value }
                                    : item,
                                ),
                              );
                              setTimelineTextItem((prev) =>
                                prev && prev.id === timelineTextItem.id
                                  ? { ...prev, diffMorphSpeed: value }
                                  : prev,
                              );
                            }}
                            className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <span className="text-sm text-slate-300">Clip (start / end %)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(timelineTextItem.start)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v)) handleLayerChange("text", timelineTextItem.id, Math.min(100, Math.max(0, v)), timelineTextItem.end);
                        }}
                        className="rounded bg-[#1e293b] px-2 py-1.5 text-sm text-slate-200 w-full"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(timelineTextItem.end)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v)) handleLayerChange("text", timelineTextItem.id, timelineTextItem.start, Math.min(100, Math.max(0, v)));
                        }}
                        className="rounded bg-[#1e293b] px-2 py-1.5 text-sm text-slate-200 w-full"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <span className="text-sm text-slate-300">Font Family</span>
                    <select
                      className="rounded-md bg-[#1e293b] px-3 py-2 text-sm text-slate-200 w-full border border-transparent focus:border-blue-500 focus:outline-none"
                      value={timelineTextItem.style.fontFamily}
                      onChange={(e) => handleTextStyleChange({ fontFamily: e.target.value })}
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="monospace">Monospace</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <span className="text-sm text-slate-300">Font Weight</span>
                    <select
                      className="rounded-md bg-[#1e293b] px-3 py-2 text-sm text-slate-200 w-full border border-transparent focus:border-blue-500 focus:outline-none"
                      value={timelineTextItem.style.fontWeight}
                      onChange={(e) => handleTextStyleChange({ fontWeight: e.target.value })}
                    >
                      <option value="300">Light</option>
                      <option value="400">Regular</option>
                      <option value="600">Semibold</option>
                      <option value="700">Bold</option>
                      <option value="900">Black</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Font Size</span>
                      <span>{timelineTextItem.style.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      value={timelineTextItem.style.fontSize}
                      onChange={(e) => handleTextStyleChange({ fontSize: Number(e.target.value) })}
                      className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Letter Spacing</span>
                      <span>{timelineTextItem.style.letterSpacing}px</span>
                    </div>
                    <input
                      type="range"
                      min={-4}
                      max={20}
                      value={timelineTextItem.style.letterSpacing}
                      onChange={(e) => handleTextStyleChange({ letterSpacing: Number(e.target.value) })}
                      className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <span className="text-sm text-slate-300">Alignment</span>
                    <div className="flex gap-2">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => handleTextStyleChange({ textAlign: align })}
                          className={`flex-1 py-2 rounded border text-xs font-medium ${
                            timelineTextItem.style.textAlign === align
                              ? "border-blue-500 bg-blue-600/20 text-blue-400"
                              : "border-[#1e293b] bg-[#1e293b] text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {align === "left" ? "Left" : align === "center" ? "Center" : "Right"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <span className="text-sm text-slate-300">Text Color</span>
                    <input
                      type="color"
                      className="h-9 w-full rounded border border-[#1e293b] bg-transparent p-0 cursor-pointer"
                      value={timelineTextItem.style.color}
                      onChange={(e) => handleTextStyleChange({ color: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <span className="text-sm text-slate-300">Position</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(["nw", "n", "ne", "w", "c", "e", "sw", "s", "se"] as const).map((key) => {
                        const isActive =
                          key === "c"
                            ? timelineTextItem.transform.x === 50 - timelineTextItem.transform.width / 2 && timelineTextItem.transform.y === 50 - timelineTextItem.transform.height / 2
                            : false;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const w = timelineTextItem.transform.width;
                              const h = timelineTextItem.transform.height;
                              let x = 0,
                                y = 0;
                              if (key.includes("w")) x = 5;
                              else if (key.includes("e")) x = 100 - w - 5;
                              else x = 50 - w / 2;
                              if (key.includes("n")) y = 5;
                              else if (key.includes("s")) y = 100 - h - 5;
                              else y = 50 - h / 2;
                              handleTextTransformChange({ ...timelineTextItem.transform, x, y });
                            }}
                            className={`aspect-square rounded border flex items-center justify-center text-xs ${
                              isActive ? "border-blue-500 bg-blue-600/20" : "border-[#1e293b] bg-[#1e293b] hover:border-blue-500"
                            }`}
                          >
                            {key === "c" ? "◎" : ""}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTextTransformChange({ x: 0, y: 0, width: 100, height: 100, rotation: 0 })}
                      className="w-full py-2 rounded-md bg-[#1e293b] text-slate-200 text-xs font-medium hover:bg-[#2a374c]"
                    >
                      Fill Canvas
                    </button>
                  </div>
                  <div
                    className="flex items-center justify-between p-3 bg-[#162032] rounded-lg border border-[#1e293b] cursor-pointer hover:bg-[#1e293b]"
                    onClick={() => setIsEnterAnimationsOpen((open) => !open)}
                  >
                    <span className="text-sm text-slate-300">
                      Enter Animations (37)
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isEnterAnimationsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isEnterAnimationsOpen ? (
                    <div className="grid grid-cols-4 gap-2 px-3 pb-2">
                      {enterPresets.map(({ id, label }) => {
                        const isActive = (timelineTextItem?.enterAnimation?.preset ?? "none") === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              if (!timelineTextItem) return;
                              const next = { ...makeDefaultAnimation(), ...(timelineTextItem.enterAnimation ?? {}), preset: id };
                              setTimelineTextItems((prev) => prev.map((item) => item.id === timelineTextItem.id ? { ...item, enterAnimation: next } : item));
                              setTimelineTextItem((prev) => prev && prev.id === timelineTextItem.id ? { ...prev, enterAnimation: next } : prev);
                            }}
                            className={`text-xs px-2 py-2 rounded-md border transition-colors text-center leading-tight min-h-9 ${
                              isActive ? "bg-blue-600 text-white border-blue-500" : "bg-[#101827] text-slate-300 hover:bg-[#1d283a] border-[#1e293b]"
                            }`}
                            title={label}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  <div
                    className="flex items-center justify-between p-3 bg-[#162032] rounded-lg border border-[#1e293b] cursor-pointer hover:bg-[#1e293b]"
                    onClick={() => setIsExitAnimationsOpen((open) => !open)}
                  >
                    <span className="text-sm text-slate-300">
                      Exit Animations (37)
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isExitAnimationsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isExitAnimationsOpen ? (
                    <div className="grid grid-cols-4 gap-2 px-3 pb-2">
                      {exitPresets.map(({ id, label }) => {
                        const isActive = (timelineTextItem?.exitAnimation?.preset ?? "none") === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              if (!timelineTextItem) return;
                              const next = { ...makeDefaultAnimation(), ...(timelineTextItem.exitAnimation ?? {}), preset: id };
                              setTimelineTextItems((prev) => prev.map((item) => item.id === timelineTextItem.id ? { ...item, exitAnimation: next } : item));
                              setTimelineTextItem((prev) => prev && prev.id === timelineTextItem.id ? { ...prev, exitAnimation: next } : prev);
                            }}
                            className={`text-xs px-2 py-2 rounded-md border transition-colors text-center leading-tight min-h-9 ${
                              isActive ? "bg-blue-600 text-white border-blue-500" : "bg-[#101827] text-slate-300 hover:bg-[#1d283a] border-[#1e293b]"
                            }`}
                            title={label}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Shadow</span>
                      <button
                        type="button"
                        role="switch"
                        onClick={() => {
                          if (!timelineTextItem) return;
                          const sh = timelineTextItem.style.shadow ?? defaultTextShadow;
                          handleTextStyleChange({ shadow: { ...sh, enabled: !sh.enabled } });
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${(timelineTextItem?.style?.shadow?.enabled ?? false) ? "bg-blue-600" : "bg-[#1e293b]"}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow mt-0.5 ${(timelineTextItem?.style?.shadow?.enabled ?? false) ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                    {(timelineTextItem?.style?.shadow?.enabled ?? false) && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-xs text-slate-400">Color</span>
                          <input
                            type="color"
                            className="mt-1 h-8 w-full rounded border border-[#1e293b] bg-transparent p-0"
                            value={timelineTextItem?.style?.shadow?.color ?? "#000000"}
                            onChange={(e) => handleTextStyleChange({ shadow: { ...(timelineTextItem?.style?.shadow ?? defaultTextShadow), color: e.target.value } })}
                          />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Blur {timelineTextItem?.style?.shadow?.blur ?? 4}px</span>
                          <input
                            type="range"
                            min={0}
                            max={20}
                            value={timelineTextItem?.style?.shadow?.blur ?? 4}
                            onChange={(e) => handleTextStyleChange({ shadow: { ...(timelineTextItem?.style?.shadow ?? defaultTextShadow), blur: Number(e.target.value) } })}
                            className="w-full h-1 bg-[#1e293b] rounded-full"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Offset X</span>
                          <input
                            type="range"
                            min={-20}
                            max={20}
                            value={timelineTextItem?.style?.shadow?.offsetX ?? 0}
                            onChange={(e) => handleTextStyleChange({ shadow: { ...(timelineTextItem?.style?.shadow ?? defaultTextShadow), offsetX: Number(e.target.value) } })}
                            className="w-full h-1 bg-[#1e293b] rounded-full"
                          />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Offset Y</span>
                          <input
                            type="range"
                            min={-20}
                            max={20}
                            value={timelineTextItem?.style?.shadow?.offsetY ?? 2}
                            onChange={(e) => handleTextStyleChange({ shadow: { ...(timelineTextItem?.style?.shadow ?? defaultTextShadow), offsetY: Number(e.target.value) } })}
                            className="w-full h-1 bg-[#1e293b] rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : timelineAudioItem ? (
              <>
                <div className="h-14 flex items-center justify-between px-5 border-b border-[#1e293b] shrink-0">
                  <h2 className="text-sm font-medium text-slate-200 truncate flex-1 mr-2">Audio — {timelineAudioItem.name}</h2>
                  <button
                    className="text-slate-400 hover:text-slate-200 shrink-0 p-1"
                    onClick={() => setTimelineAudioItem(null)}
                    aria-label="Close properties"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <Scissors className="w-4 h-4" />
                      Clip (start / end %)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round(clipStart)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v)) handleLayerChange("audio", timelineAudioItem.id, Math.min(100, Math.max(0, v)), clipEnd);
                        }}
                        className="rounded bg-[#1e293b] px-2 py-1.5 text-sm text-slate-200 w-full"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round(clipEnd)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (!Number.isNaN(v)) handleLayerChange("audio", timelineAudioItem.id, clipStart, Math.min(100, Math.max(0, v)));
                        }}
                        className="rounded bg-[#1e293b] px-2 py-1.5 text-sm text-slate-200 w-full"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === 'image' ? (
              <>
                <div className="h-14 flex items-center justify-between px-5 border-b border-[#1e293b] shrink-0">
                  <h2 className="text-sm font-medium text-slate-200">Image</h2>
                  <button className="text-slate-400 hover:text-slate-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  {/* Upload Area */}
                  <div className="border border-dashed border-[#1e293b] rounded-lg bg-[#162032] p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#1e293b] transition-colors relative overflow-hidden">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                    />
                    {uploadedImageUrl ? (
                      <img
                        src={uploadedImageUrl}
                        alt={uploadedImageName ?? "Uploaded image preview"}
                        className="mb-3 h-24 w-full rounded-md object-cover opacity-90"
                      />
                    ) : (
                      <Image className="w-8 h-8 text-slate-400 mb-2" />
                    )}
                    <p className="text-sm text-slate-200 font-medium">Upload Image</p>
                    <p className="text-xs text-slate-500 mt-1">{uploadedImageName ?? "Drag and drop or click"}</p>
                  </div>

                  {/* Tabs */}
                  <div className="flex p-1 bg-[#162032] rounded-md gap-1">
                    <button
                      type="button"
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded flex items-center justify-center gap-1.5 ${
                        imageSubTab === "settings"
                          ? "bg-[#1e293b] text-slate-200 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      onClick={() => setImageSubTab("settings")}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded flex items-center justify-center gap-1.5 ${
                        imageSubTab === "style"
                          ? "bg-[#1e293b] text-slate-200 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      onClick={() => setImageSubTab("style")}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Style
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-1.5 px-2 text-xs font-medium rounded flex items-center justify-center gap-1.5 ${
                        imageSubTab === "ai"
                          ? "bg-[#1e293b] text-slate-200 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      onClick={() => setImageSubTab("ai")}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI
                    </button>
                  </div>

                  {imageSubTab === "settings" && (
                    <>
                      {/* Crop (placeholder – main crop controls live in the properties panel when a layer is selected) */}
                      <div className="flex items-center justify-between p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <Scissors className="w-4 h-4" />
                          Crop
                        </div>
                        <div className="w-8 h-4 bg-[#1e293b] rounded-full relative cursor-not-allowed opacity-60">
                          <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-slate-500 rounded-full" />
                        </div>
                      </div>

                      {/* Position Dropdown */}
                      <div className="flex items-center justify-between p-3 bg-[#162032] rounded-lg border border-[#1e293b] cursor-default">
                        <span className="text-sm text-slate-300">Position</span>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </div>

                      {/* Enter Animations */}
                      <div
                        className="flex items-center justify-between p-3 bg-[#162032] rounded-lg border border-[#1e293b] cursor-pointer hover:bg-[#1e293b]"
                        onClick={() =>
                          setIsEnterAnimationsOpen((open) => !open)
                        }
                      >
                        <span className="text-sm text-slate-300">
                          Enter Animations{" "}
                          <span className="text-slate-500 text-xs ml-1">
                            (37)
                          </span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            isEnterAnimationsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {isEnterAnimationsOpen ? (
                        <div className="grid grid-cols-4 gap-2 px-3 pb-2">
                          {enterPresets.map(({ id, label }) => {
                            const layer = timelineVisualItem ?? selectedImageLayer;
                            const isActive =
                              (layer?.enterAnimation?.preset ?? "none") === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => updateLayerAnimation("enter", id)}
                                className={`text-xs px-2 py-2 rounded-md border transition-colors text-center leading-tight min-h-[2.25rem] ${
                                  isActive
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-[#101827] text-slate-300 hover:bg-[#1d283a] border-[#1e293b]"
                                }`}
                                title={label}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* Exit Animations */}
                      <div
                        className="flex items-center justify-between p-3 bg-[#162032] rounded-lg border border-[#1e293b] cursor-pointer hover:bg-[#1e293b]"
                        onClick={() =>
                          setIsExitAnimationsOpen((open) => !open)
                        }
                      >
                        <span className="text-sm text-slate-300">
                          Exit Animations{" "}
                          <span className="text-slate-500 text-xs ml-1">
                            (37)
                          </span>
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            isExitAnimationsOpen ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {isExitAnimationsOpen ? (
                        <div className="grid grid-cols-4 gap-2 px-3 pb-2">
                          {exitPresets.map(({ id, label }) => {
                            const layer = timelineVisualItem ?? selectedImageLayer;
                            const isActive =
                              (layer?.exitAnimation?.preset ?? "none") === id;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() => updateLayerAnimation("exit", id)}
                                className={`text-xs px-2 py-2 rounded-md border transition-colors text-center leading-tight min-h-[2.25rem] ${
                                  isActive
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-[#101827] text-slate-300 hover:bg-[#1d283a] border-[#1e293b]"
                                }`}
                                title={label}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* 3D Layout Effects */}
                      <div className="flex flex-col gap-3 mt-2">
                        <div className="flex items-center justify-between cursor-default">
                          <span className="text-sm font-medium text-slate-200">
                            3D Layout Effects <span className="text-slate-500 text-xs font-normal ml-1">(9)</span>
                          </span>
                          <ChevronDown className="w-4 h-4 text-slate-500 transform rotate-180" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="aspect-square rounded-lg border border-[#1e293b] bg-[#162032] flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded shadow-md opacity-80" />
                            <span className="text-[10px] text-slate-400">None</span>
                          </div>
                          <div className="aspect-square rounded-lg border border-[#1e293b] bg-[#162032] flex flex-col items-center justify-center gap-2 opacity-60">
                            <div className="w-8 h-8 bg-blue-500 rounded shadow-md opacity-80 transform -skew-y-12" />
                            <span className="text-[10px] text-slate-400">Tilt Up</span>
                          </div>
                          <div className="aspect-square rounded-lg border border-[#1e293b] bg-[#162032] flex flex-col items-center justify-center gap-2 opacity-60">
                            <div className="w-8 h-8 bg-blue-500 rounded shadow-md opacity-80 transform skew-y-12" />
                            <span className="text-[10px] text-slate-400">Tilt Down</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {imageSubTab === "style" && (
                    <div className="flex flex-col gap-3">
                      {!selectedImageLayer ? (
                        <div className="p-3 rounded-lg border border-dashed border-[#1e293b] bg-[#050b1a] text-xs text-slate-400">
                          Select an <span className="font-medium text-slate-200">image layer</span> on the canvas or timeline to edit
                          its appearance.
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                            <span className="text-sm text-slate-300">Fit</span>
                            <select
                              className="mt-1 rounded-md bg-[#1e293b] border border-[#1e293b] px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={currentImageAppearance.fit}
                              onChange={(e) =>
                                updateImageAppearance({
                                  fit: e.target.value as AppearanceOptions["fit"],
                                })
                              }
                            >
                              <option value="contain">Contain</option>
                              <option value="cover">Cover</option>
                              <option value="fill">Fill</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                            <span className="text-sm text-slate-300">Filter preset</span>
                            <select
                              className="mt-1 rounded-md bg-[#1e293b] border border-[#1e293b] px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={currentImageAppearance.filterPreset}
                              onChange={(e) =>
                                updateImageAppearance({
                                  filterPreset: e.target.value as AppearanceOptions["filterPreset"],
                                })
                              }
                            >
                              <option value="none">None</option>
                              <option value="grayscale">Grayscale</option>
                              <option value="sepia">Sepia</option>
                              <option value="vibrant">Vibrant</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                            <div className="flex items-center justify-between text-sm text-slate-300">
                              <span>Border radius</span>
                              <span className="text-xs text-slate-400">
                                {Math.round(currentImageAppearance.borderRadius)} px
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={64}
                              value={currentImageAppearance.borderRadius}
                              onChange={(e) =>
                                updateImageAppearance({
                                  borderRadius: Number(e.target.value),
                                })
                              }
                              className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                            />
                          </div>

                          <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                            <div className="flex items-center justify-between text-sm text-slate-300">
                              <span>Brightness</span>
                              <span className="text-xs text-slate-400">
                                {Math.round(currentImageAppearance.brightness)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={200}
                              value={currentImageAppearance.brightness}
                              onChange={(e) =>
                                updateImageAppearance({
                                  brightness: Number(e.target.value),
                                })
                              }
                              className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                            />
                          </div>

                          <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                            <div className="flex items-center justify-between text-sm text-slate-300">
                              <span>Padding</span>
                              <span className="text-xs text-slate-400">
                                {Math.round(currentImageAppearance.padding)} px
                              </span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={48}
                              value={currentImageAppearance.padding}
                              onChange={(e) =>
                                updateImageAppearance({
                                  padding: Number(e.target.value),
                                })
                              }
                              className="w-full h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                            />
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-slate-400">Padding background</span>
                              <input
                                type="color"
                                className="h-5 w-9 rounded border border-[#1e293b] bg-transparent p-0"
                                value={currentImageAppearance.paddingBackground}
                                onChange={(e) =>
                                  updateImageAppearance({
                                    paddingBackground: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {imageSubTab === "ai" && (
                    <div className="flex flex-col gap-3">
                      {!selectedImageLayer ? (
                        <div className="p-3 rounded-lg border border-dashed border-[#1e293b] bg-[#050b1a] text-xs text-slate-400">
                          Select an <span className="font-medium text-slate-200">image layer</span> on the canvas or
                          timeline to use AI tools like background removal.
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-2 p-3 bg-[#162032] rounded-lg border border-[#1e293b]">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-sm text-slate-200">Remove background</span>
                                <span className="text-xs text-slate-500">
                                  Runs in the browser, no upload required.
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={selectedImageLayer.ai?.isProcessing}
                                onClick={toggleImageBackgroundRemoval}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors ${
                                  selectedImageLayer.ai?.backgroundRemoved
                                    ? "bg-blue-600"
                                    : "bg-[#1e293b]"
                                } ${selectedImageLayer.ai?.isProcessing ? "opacity-60 cursor-wait" : ""}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${
                                    selectedImageLayer.ai?.backgroundRemoved ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            </div>
                            {selectedImageLayer.ai?.isProcessing && (
                              <p className="text-xs text-slate-400 mt-1">Removing background…</p>
                            )}
                            {selectedImageLayer.ai?.backgroundRemoved && !selectedImageLayer.ai?.isProcessing && (
                              <p className="text-xs text-slate-400 mt-1">
                                Background removed. Toggle off to restore the original image.
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === 'media' ? (
              <>
                <div className="h-14 flex items-center px-5 border-b border-[#1e293b] shrink-0">
                  <h2 className="text-sm font-medium text-slate-200">Uploads</h2>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-200">Saved Uploads</p>
                    <button
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      onClick={() => mediaUploadInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload
                    </button>
                    {/* video/* disabled for now — add video/* back to accept string to re-enable */}
                    <input
                      ref={mediaUploadInputRef}
                      type="file"
                      multiple
                      accept="image/*,audio/*,application/pdf,text/plain,.doc,.docx"
                      className="hidden"
                      onChange={handleMediaUpload}
                    />
                  </div>

                  {uploadingMediaNames.length > 0 && (
                    <div className="rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
                      Uploading {uploadingMediaNames.length} file{uploadingMediaNames.length > 1 ? "s" : ""}...
                      <div className="mt-1 text-[11px] text-blue-300/90 truncate">
                        {uploadingMediaNames.slice(0, 3).join(", ")}
                        {uploadingMediaNames.length > 3 ? ` +${uploadingMediaNames.length - 3} more` : ""}
                      </div>
                    </div>
                  )}

                  {isLoadingMediaFromGcs && (
                    <div className="rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2 text-xs text-slate-300">
                      Loading files from GCS...
                    </div>
                  )}

                  <div className="rounded-md bg-[#1b2b46] p-1 flex gap-1 text-xs">
                    <button
                      className={`rounded px-2.5 py-1.5 ${mediaFilter === "all" ? "bg-[#0f172a] text-slate-100 border border-blue-400/60" : "text-slate-300 hover:bg-[#223655]"}`}
                      onClick={() => setMediaFilter("all")}
                    >
                      All ({mediaStats.all})
                    </button>
                    <button
                      className={`rounded px-2.5 py-1.5 ${mediaFilter === "image" ? "bg-[#0f172a] text-slate-100 border border-blue-400/60" : "text-slate-300 hover:bg-[#223655]"}`}
                      onClick={() => setMediaFilter("image")}
                    >
                      Images ({mediaStats.image})
                    </button>
                    <button
                      className={`rounded px-2.5 py-1.5 ${mediaFilter === "video" ? "bg-[#0f172a] text-slate-100 border border-blue-400/60" : "text-slate-300 hover:bg-[#223655]"}`}
                      onClick={() => setMediaFilter("video")}
                    >
                      Videos ({mediaStats.video})
                    </button>
                    <button
                      className={`rounded px-2.5 py-1.5 ${mediaFilter === "audio" ? "bg-[#0f172a] text-slate-100 border border-blue-400/60" : "text-slate-300 hover:bg-[#223655]"}`}
                      onClick={() => setMediaFilter("audio")}
                    >
                      Audio ({mediaStats.audio})
                    </button>
                    <button
                      className={`rounded px-2.5 py-1.5 ${mediaFilter === "document" ? "bg-[#0f172a] text-slate-100 border border-blue-400/60" : "text-slate-300 hover:bg-[#223655]"}`}
                      onClick={() => setMediaFilter("document")}
                    >
                      Docs ({mediaStats.document})
                    </button>
                  </div>

                  {filteredMedia.length === 0 ? (
                    <div className="mt-8 flex flex-col items-center text-center text-slate-400 px-2">
                      <Upload className="w-10 h-10 mb-3 text-slate-500" />
                      <p className="text-lg text-slate-200">No media files</p>
                      <p className="mt-1 text-sm">Upload your first media file to get started</p>
                      <button
                        className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        onClick={() => mediaUploadInputRef.current?.click()}
                      >
                        Upload Media
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {filteredMedia.map((item) => (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          className="group rounded-lg border border-[#1e293b] bg-[#10213d] p-2 text-left hover:border-blue-500/70"
                          onClick={() => {
                            setSelectedMediaForAction(item);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedMediaForAction(item);
                            }
                          }}
                        >
                          <div className="relative mb-2 h-20 w-full overflow-hidden rounded-md bg-[#0b172d]">
                            {item.type === "image" ? (
                              <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                            ) : item.type === "video" ? (
                              <video src={item.url} className="h-full w-full object-cover" />
                            ) : item.type === "document" ? (
                              <div className="h-full w-full flex flex-col items-center justify-center gap-1 text-slate-300">
                                <FileText className="h-8 w-8 text-amber-400" />
                                <span className="text-[10px] text-slate-500 uppercase">
                                  {item.name.split(".").pop()}
                                </span>
                              </div>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-slate-300">
                                <Music2 className="h-8 w-8" />
                              </div>
                            )}
                            <button
                              className="absolute right-1 top-1 rounded-full bg-rose-400/90 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              disabled={deletingMediaIds.includes(item.id)}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void handleDeleteMedia(item);
                              }}
                            >
                              <Trash2 className={`h-3.5 w-3.5 ${deletingMediaIds.includes(item.id) ? "opacity-60" : ""}`} />
                            </button>
                          </div>
                          <p className="truncate text-sm text-slate-100">{item.name}</p>
                          <p className="text-xs text-slate-400">{formatFileSize(item.size)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === "text" ? (
              <>
                <div className="h-14 flex items-center px-5 border-b border-[#1e293b] shrink-0">
                  <h2 className="text-sm font-medium text-slate-200">Text</h2>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <p className="text-xs text-slate-400">Choose a style to add a text layer</p>
                  {TEXT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleAddTextFromPreset(preset)}
                      className="flex flex-col gap-1 p-4 rounded-lg border border-[#1e293b] bg-[#162032] hover:border-blue-500 hover:bg-[#1e293b] text-left transition-colors"
                    >
                      <div
                        className="text-lg font-medium text-slate-100 truncate"
                        style={{
                          fontFamily: `${preset.style.fontFamily}, sans-serif`,
                          fontWeight: preset.style.fontWeight,
                          fontSize: Math.min(preset.style.fontSize, 20),
                          letterSpacing: preset.style.letterSpacing,
                          color: preset.style.color,
                          backgroundColor: preset.style.highlightColor,
                          padding: preset.style.highlightColor ? "2px 4px" : 0,
                        }}
                      >
                        {preset.text}
                      </div>
                      <p className="text-xs text-slate-500">{preset.description}</p>
                    </button>
                  ))}
                  <div className="mt-2 pt-3 border-t border-[#1e293b] flex flex-col gap-2">
                    <p className="text-xs text-slate-400">Text Diff Templates</p>
                    {DIFF_TEXT_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleAddTextDiffTemplate(template)}
                        className="flex flex-col gap-1 p-3 rounded-lg border border-[#1e293b] bg-[#162032] hover:border-emerald-500/70 hover:bg-[#1e293b] text-left transition-colors"
                      >
                        <span className="text-xs text-slate-400">{template.label}</span>
                        <span className="text-sm text-slate-400 line-through">{template.fromText}</span>
                        <span className="text-sm text-emerald-300">{template.toText}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : activeTab === "elements" ? (
              <>
                <div className="h-14 flex items-center px-5 border-b border-[#1e293b] shrink-0">
                  <h2 className="text-sm font-medium text-slate-200">Elements</h2>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-slate-400">Stickers</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STICKER_LIBRARY.map((sticker) => (
                        <button
                          key={sticker.id}
                          type="button"
                          onClick={() => handleAddSticker(sticker)}
                          className="rounded-lg border border-[#1e293b] bg-[#162032] hover:border-blue-500/70 p-3 text-left"
                        >
                          <div className="h-10 rounded-md mb-2 flex items-center justify-center font-bold" style={{ backgroundColor: sticker.bg, color: sticker.fg }}>
                            {sticker.glyph}
                          </div>
                          <span className="text-xs text-slate-300">{sticker.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#1e293b]">
                    <p className="text-xs text-slate-400">Shapes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {SHAPE_LIBRARY.map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => handleAddShape(shape)}
                          className="rounded-lg border border-[#1e293b] bg-[#162032] hover:border-purple-500/70 p-3 text-left"
                        >
                          <div className="h-10 rounded-md mb-2 flex items-center justify-center font-semibold" style={{ backgroundColor: shape.fill, color: "#ffffff" }}>
                            {shape.label}
                          </div>
                          <span className="text-xs text-slate-300">{shape.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#1e293b]">
                    <p className="text-xs text-slate-400">Shaders</p>
                    <div className="grid grid-cols-3 gap-2">
                      {SHADER_LIBRARY.map((shader) => (
                        <button
                          key={shader.id}
                          type="button"
                          onClick={() => handleAddShader(shader)}
                          className="h-11 rounded-lg border border-[#1e293b] bg-[#162032] hover:border-cyan-500/70 text-xs text-slate-200"
                        >
                          {shader.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-[#1e293b]">
                    <p className="text-xs text-slate-400">Emoji Stickers</p>
                    <div className="grid grid-cols-4 gap-2">
                      {EMOJI_LIBRARY.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddEmojiSticker(emoji)}
                          className="h-11 rounded-lg border border-[#1e293b] bg-[#162032] hover:border-blue-500/70 text-xl"
                          title={`Add ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : activeTab === "agent" ? (
              <AgentPanel
                uploadedMedia={uploadedMedia}
                uploadingMediaNames={uploadingMediaNames}
                fps={fps}
                durationInFrames={durationInFrames}
                onTimelineReady={handleAgentTimelineReady}
                onMediaAnalyzed={handleMediaAnalyzed}
                onNarrationReady={handleNarrationReady}
                onImageGenerated={handleImageGenerated}
                onAddToTimeline={handleAddGeneratedToTimeline}
              />
            ) : (
              <>
                <div className="h-14 flex items-center px-5 border-b border-[#1e293b] shrink-0">
                  <h2 className="text-sm font-medium text-slate-200 capitalize">{activeTab}</h2>
                </div>
                <div className="p-4 flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center rounded-md bg-[#1e293b] px-3 py-2 text-sm text-slate-200">
                      <input
                        className="bg-transparent outline-none border-none flex-1 placeholder:text-slate-400"
                        placeholder={`Search ${activeTab}s`}
                      />
                    </div>
                    <Button size="icon" className="h-9 w-10 rounded-md bg-blue-600 hover:bg-blue-700">
                      <Search className="w-4 h-4 text-white" />
                    </Button>
                  </div>

                  <div className="flex flex-col items-center justify-center mt-12 text-center text-slate-400">
                    <Search className="w-8 h-8 mb-4 text-slate-500 font-light" strokeWidth={1.5} />
                    <p className="text-sm mb-2 text-slate-300">Use the search to find {activeTab}s</p>
                    <p className="text-xs">
                      Enter a search term above
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
{/* Right Main Area */}
          <div className="flex-1 flex min-h-0 flex-col bg-[#162032]">
            {/* Top Navbar */}
            <div className="h-14 border-b border-[#1e293b] flex items-center justify-between px-4 bg-[#0f172a]">
              <div className="flex items-center gap-4">
                <button className="text-slate-400 hover:text-slate-200">
                  <PanelLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 rounded-full border border-[#1e293b] bg-[#1e293b]/50 px-3 py-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-medium text-slate-300">RVE</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-slate-200">
                  <Save className="w-4 h-4" />
                </button>
                <button className="text-slate-400 hover:text-slate-200">
                  <Bell className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="bg-[#1e293b] hover:bg-[#2a374c] text-slate-200 border border-[#2a374c] h-8 px-4 text-xs font-medium"
                    onClick={renderEditorMedia}
                    disabled={
                      !code ||
                      renderEditorState.status === "invoking" ||
                      renderEditorState.status === "rendering"
                    }
                  >
                    {renderEditorState.status === "invoking"
                      ? "Starting render..."
                      : renderEditorState.status === "rendering"
                        ? "Rendering..."
                        : "Render Video"}
                  </Button>
                  {renderEditorState.status === "rendering" && (
                    <div className="w-32">
                      <ProgressBar progress={renderEditorState.progress} />
                    </div>
                  )}
                  {renderEditorState.status === "done" && (
                    <DownloadButton
                      state={renderEditorState}
                      undo={undoEditorRender}
                    />
                  )}
                  {renderEditorState.status === "error" && (
                    <ErrorComp message={renderEditorState.error.message} />
                  )}
                </div>
              </div>
            </div>

            {/* Canvas + Timeline Split */}
            <div
              ref={splitContainerRef}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Canvas Area (Player) */}
              <div
                className="flex items-center justify-center overflow-hidden relative min-h-0"
                style={{ 
                  flexBasis: `${previewRatio * 100}%`,
                  backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }}
              >
                <div
                  ref={canvasStageRef}
                  className="relative w-[min(50vw,640px)] max-w-[640px] shrink-0 bg-white shadow-2xl"
                  style={{ aspectRatio: `${currentAspect.width} / ${currentAspect.height}` }}
                  onPointerDown={() => {
                    setIsCanvasLayerSelected(false);
                    setTimelineVisualItem(null);
                    setTimelineTextItem(null);
                  }}
                >
                  <AnimationPlayer
                    Component={compilationError ? null : Component}
                    durationInFrames={durationInFrames}
                    fps={fps}
                    compositionWidth={currentAspect.width}
                    compositionHeight={currentAspect.height}
                    onDurationChange={setDurationInFrames}
                    onFpsChange={setFps}
                    isCompiling={isCompiling}
                    isStreaming={false}
                    error={compilationError}
                    errorType="compilation"
                    code={code}
                    onRuntimeError={undefined}
                    onFrameChange={setCurrentFrame}
                    playerRef={playerRef}
                  />
                  <div className="absolute inset-0 z-10 pointer-events-none">
                    {visibleVisualLayers.map((item) => (
                      <div
                        key={item.id}
                        className="absolute cursor-pointer pointer-events-auto transition-[border-color,box-shadow] duration-150"
                        style={{
                          left: `${item.transform.x}%`,
                          top: `${item.transform.y}%`,
                          width: `${item.transform.width}%`,
                          height: `${item.transform.height}%`,
                          borderWidth: hoveredCanvasLayerId === item.id ? 2 : 0,
                          borderStyle: "solid",
                          borderColor: "rgba(59, 130, 246, 0.6)",
                          boxShadow: hoveredCanvasLayerId === item.id ? "0 0 0 1px rgba(59, 130, 246, 0.3)" : "none",
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          handleSelectLayer("visual", item.id);
                          setIsCanvasLayerSelected(true);
                        }}
                        onPointerEnter={() => setHoveredCanvasLayerId(item.id)}
                        onPointerLeave={() => setHoveredCanvasLayerId(null)}
                      />
                    ))}
                    {visibleTextLayers.map((item) => (
                      <div
                        key={item.id}
                        className="absolute cursor-pointer pointer-events-auto transition-[border-color,box-shadow] duration-150"
                        style={{
                          left: `${item.transform.x}%`,
                          top: `${item.transform.y}%`,
                          width: `${item.transform.width}%`,
                          height: `${item.transform.height}%`,
                          borderWidth: hoveredCanvasLayerId === item.id || timelineTextItem?.id === item.id ? 2 : 0,
                          borderStyle: "solid",
                          borderColor: "rgba(59, 130, 246, 0.6)",
                          boxShadow: hoveredCanvasLayerId === item.id || timelineTextItem?.id === item.id ? "0 0 0 1px rgba(59, 130, 246, 0.3)" : "none",
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          handleSelectLayer("text", item.id);
                          setIsCanvasLayerSelected(true);
                        }}
                        onPointerEnter={() => setHoveredCanvasLayerId(item.id)}
                        onPointerLeave={() => setHoveredCanvasLayerId(null)}
                      />
                    ))}
                  </div>
                  {annotationMode ? (
                    <AnnotationOverlay
                      onSubmit={handleAnnotationSubmit}
                      onCancel={() => setAnnotationMode(false)}
                      isLoading={isAnnotating}
                    />
                  ) : null}
                  {timelineTextItem ? (
                    <div className="absolute inset-0 z-20">
                      <div
                        className={`absolute border-2 ${isCanvasLayerSelected ? "border-blue-500" : "border-transparent"}`}
                        style={{
                          left: `${timelineTextItem.transform.x}%`,
                          top: `${timelineTextItem.transform.y}%`,
                          width: `${timelineTextItem.transform.width}%`,
                          height: `${timelineTextItem.transform.height}%`,
                          transform: `rotate(${timelineTextItem.transform.rotation ?? 0}deg)`,
                          transformOrigin: "50% 50%",
                        }}
                        onPointerDown={startTextCanvasMove}
                      >
                        {isCanvasLayerSelected ? (
                          <>
                            {([
                              ["nw", "-left-2 -top-2 cursor-nwse-resize"],
                              ["ne", "-right-2 -top-2 cursor-nesw-resize"],
                              ["sw", "-left-2 -bottom-2 cursor-nesw-resize"],
                              ["se", "-right-2 -bottom-2 cursor-nwse-resize"],
                            ] as const).map(([handle, className]) => (
                              <div
                                key={handle}
                                className={`absolute h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow ${className}`}
                                onPointerDown={startTextCanvasResize(handle)}
                              />
                            ))}
                            <div className="absolute left-1/2 -top-8 -translate-x-1/2 h-7 w-7 rounded-full border-2 border-blue-500 bg-white shadow flex items-center justify-center cursor-grab" onPointerDown={startTextCanvasRotate} title="Rotate">
                              <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {timelineVisualItem ? (
                    <div className="absolute inset-0 z-20">
                      <div
                        className={`absolute border-2 ${isCanvasLayerSelected ? "border-blue-500" : "border-transparent"}`}
                        style={{
                          left: `${visualTransform.x}%`,
                          top: `${visualTransform.y}%`,
                          width: `${visualTransform.width}%`,
                          height: `${visualTransform.height}%`,
                          transform: (() => {
                            const { rotateX, rotateY, translateZ } = computeLayout3d(
                              timelineVisualItem.layout3d,
                            );
                            const rotation = visualTransform.rotation ?? 0;
                            return `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) rotate(${rotation}deg)`;
                          })(),
                          transformOrigin: "50% 50%",
                        }}
                        onPointerDown={startCanvasMove}
                      >
                        {isCanvasLayerSelected ? (
                          (timelineVisualItem.crop?.enabled ?? false) ? (
                            /* Corners = resize layer; edge centers = crop; inner rect = crop boundary (moves with region) */
                            <>
                              {/* Crop boundary overlay — moves with crop region */}
                              {(() => {
                                const reg = timelineVisualItem.crop?.region ?? defaultCropRegion;
                                const w = Math.max(1, 100 - reg.left - reg.right);
                                const h = Math.max(1, 100 - reg.top - reg.bottom);
                                return (
                                  <div
                                    className="absolute pointer-events-none border-2 border-dashed border-amber-400/80"
                                    style={{
                                      left: `${reg.left}%`,
                                      top: `${reg.top}%`,
                                      width: `${w}%`,
                                      height: `${h}%`,
                                    }}
                                  />
                                );
                              })()}
                              {/* 4 corner handles — resizing */}
                              {([
                                ["nw", "-left-2 -top-2 cursor-nwse-resize"],
                                ["ne", "-right-2 -top-2 cursor-nesw-resize"],
                                ["sw", "-left-2 -bottom-2 cursor-nesw-resize"],
                                ["se", "-right-2 -bottom-2 cursor-nwse-resize"],
                              ] as const).map(([handle, className]) => (
                                <div
                                  key={handle}
                                  className={`absolute h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow ${className}`}
                                  onPointerDown={startCanvasResize(handle)}
                                />
                              ))}
                              {/* 4 edge-center handles — cropping */}
                              <div className="absolute left-1/2 -top-2 -translate-x-1/2 h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow cursor-n-resize" onPointerDown={startCropResize("n")} title="Crop top" />
                              <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow cursor-e-resize" onPointerDown={startCropResize("e")} title="Crop right" />
                              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow cursor-s-resize" onPointerDown={startCropResize("s")} title="Crop bottom" />
                              <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow cursor-w-resize" onPointerDown={startCropResize("w")} title="Crop left" />
                              {/* Rotate handle at top center */}
                              <div
                                className="absolute left-1/2 -top-8 -translate-x-1/2 h-7 w-7 rounded-full border-2 border-blue-500 bg-white shadow flex items-center justify-center cursor-grab"
                                onPointerDown={startCanvasRotate}
                                title="Rotate"
                              >
                                <RotateCw className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-blue-500/60" />
                              <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-blue-500/60" />
                            </>
                          ) : (
                            /* Move/resize handles */
                            <>
                              {([
                                ["nw", "-left-2 -top-2 cursor-nwse-resize"],
                                ["ne", "-right-2 -top-2 cursor-nesw-resize"],
                                ["sw", "-left-2 -bottom-2 cursor-nesw-resize"],
                                ["se", "-right-2 -bottom-2 cursor-nwse-resize"],
                              ] as const).map(([handle, className]) => (
                                <div
                                  key={handle}
                                  className={`absolute h-3.5 w-3.5 rounded-sm border-2 border-blue-500 bg-white shadow ${className}`}
                                  onPointerDown={startCanvasResize(handle)}
                                />
                              ))}
                              <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-blue-500/60" />
                              <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-blue-500/60" />
                            </>
                          )
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Resize Handle */}
              <div
                className="group h-3 flex flex-col justify-center cursor-row-resize z-10 shrink-0 bg-transparent"
                onPointerDown={handleResizeStart}
              >
                <div className="h-[2px] w-full bg-[#1e293b] group-hover:bg-blue-500 transition-colors" />
              </div>

              {/* Timeline Area */}
              <div
                className="flex flex-col bg-[#0f172a] min-h-0 overflow-hidden shrink"
                style={{ flexBasis: `${(1 - previewRatio) * 100}%` }}
              >
                {/* Timeline Controls */}
                <div className="h-12 border-b border-[#1e293b] flex items-center justify-between px-4 text-slate-400">
                  {/* Left: Undo/Redo/Cut */}
                  <div className="flex items-center gap-4">
                    <button className="hover:text-slate-200"><Undo2 className="w-4 h-4" /></button>
                    <button className="hover:text-slate-200"><Redo2 className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-[#1e293b]" />
                    <button
                      className="hover:text-slate-200 disabled:text-slate-600 disabled:cursor-not-allowed"
                      onClick={handleCutAtPlayhead}
                      disabled={!timelineVisualItem && !timelineTextItem && !timelineAudioItem}
                      title="Cut selected layer at playhead"
                    >
                      <Scissors className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Center: Playback */}
                  <div className="flex items-center gap-4">
                    <button className="px-2 py-1 rounded text-xs border border-[#1e293b] hover:bg-[#1e293b]">1x</button>
                    <button onClick={() => handleStep(-1)} className="hover:text-slate-200"><SkipBack className="w-4 h-4" /></button>
                    <button onClick={handlePlayPause} className="hover:text-slate-200">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleStep(1)} className="hover:text-slate-200"><SkipForward className="w-4 h-4" /></button>
                    <div className="text-xs tracking-wider flex items-center gap-1 font-mono">
                      <span className="text-slate-200">{formatTimecode(currentFrame)}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-slate-500">{formatTimecode(durationInFrames)}</span>
                    </div>
                  </div>

                  {/* Right: Aspect, Zoom, Settings */}
                  <div className="flex items-center gap-4">
                    {(() => {
                      const styleLabel =
                        annotationOverlayStyle === "minimal"
                          ? "Point"
                          : annotationOverlayStyle === "focus"
                            ? "Callout"
                            : "Cursor";
                      return (
                        <button
                          title="Overlay style: Point / Callout / Cursor"
                          onClick={() =>
                            setAnnotationOverlayStyle((prev) =>
                              prev === "minimal"
                                ? "focus"
                                : prev === "focus"
                                  ? "focus-arrow"
                                  : "minimal"
                            )
                          }
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border border-[#1e293b] text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                        >
                          <span>OVR</span>
                          <span className="text-[10px] text-slate-300">{styleLabel}</span>
                        </button>
                      );
                    })()}
                    <div className="relative" ref={aspectMenuRef}>
                      <button
                        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs border border-[#1e293b] hover:bg-[#1e293b]"
                        onClick={() => setIsAspectMenuOpen((open) => !open)}
                      >
                        <Monitor className="w-3.5 h-3.5 text-blue-400" />
                        <span>{currentAspect.value}</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {isAspectMenuOpen ? (
                        <div className="absolute right-0 bottom-12 w-56 rounded-lg border border-[#1e293b] bg-[#07132c] shadow-2xl z-50 overflow-hidden">
                          <div className="px-3 py-2 border-b border-[#1e293b] text-xs text-slate-300">Aspect Ratio</div>
                          <div className="p-1.5">
                            {aspectOptions.map((option) => {
                              const isSelected = option.value === selectedAspect;
                              return (
                                <button
                                  key={option.value}
                                  className={`w-full flex items-center justify-between rounded-md px-2.5 py-2 text-left ${isSelected ? "bg-[#1e293b] text-slate-100" : "text-slate-300 hover:bg-[#12213f]"}`}
                                  onClick={() => {
                                    setSelectedAspect(option.value);
                                    setIsAspectMenuOpen(false);
                                  }}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Monitor className={`w-3.5 h-3.5 ${isSelected ? "text-blue-400" : "text-slate-500"}`} />
                                    <div className="flex flex-col">
                                      <span className="text-sm leading-tight">{option.value}</span>
                                      <span className="text-xs text-slate-500 leading-tight">{option.label}</span>
                                    </div>
                                  </div>
                                  {isSelected ? <Check className="w-3.5 h-3.5 text-blue-400" /> : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></button>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        className="w-20 h-1 bg-[#1e293b] rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                        value={Math.round(((timelineZoom - 0.5) / (3 - 0.5)) * 100)}
                        onChange={(e) => handleZoomSlider(Number(e.target.value))}
                      />
                      <button onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></button>
                    </div>
                    <button
                      title={annotationMode ? "Exit annotation mode" : "Draw region to analyze (Annotate)"}
                      onClick={() => setAnnotationMode((v) => !v)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-colors ${
                        annotationMode
                          ? "border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10"
                          : "border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <Scan className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-[#1e293b]" />
                    <button
                      title={captionsEnabled ? "Hide captions" : "Show captions"}
                      onClick={() => setCaptionsEnabled((v) => !v)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-colors ${
                        captionsEnabled
                          ? "border-blue-500 text-blue-400 bg-blue-500/10"
                          : "border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <Captions className="w-3.5 h-3.5" />
                      <span>CC</span>
                    </button>
                    <button
                      title={annotationsEnabled ? "Hide cinematic annotations (A)" : "Show cinematic annotations (A)"}
                      onClick={() => setAnnotationsEnabled((v) => !v)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-colors ${
                        annotationsEnabled
                          ? "border-fuchsia-500 text-fuchsia-400 bg-fuchsia-500/10"
                          : "border-[#1e293b] text-slate-500 hover:text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <MousePointer2 className="w-3.5 h-3.5" />
                      <span>A</span>
                    </button>
                    <button className="hover:text-slate-200"><SlidersHorizontal className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Tracks Area */}
                <div className="flex-1 overflow-hidden relative">
                  <TimelineEditor
                    durationInFrames={durationInFrames}
                    currentFrame={currentFrame}
                    onSeek={seekToFrame}
                    zoom={timelineZoom}
                    visualLayers={visualLayers}
                    audioLayers={audioLayers}
                    textLayers={textLayers}
                    selectedVisualLayerId={timelineVisualItem?.id ?? null}
                    selectedAudioLayerId={timelineAudioItem?.id ?? null}
                    selectedTextLayerId={timelineTextItem?.id ?? null}
                    onSelectLayer={handleSelectLayer}
                    onLayerChange={handleLayerChange}
                    onVisualSourceTrimChange={handleVisualSourceTrimChangeFromTimeline}
                    onReorderLayers={handleReorderLayers}
                    onDuplicateLayer={handleDuplicateLayer}
                    onDeleteLayer={handleDeleteLayer}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedMediaForAction ? (
        <div className="absolute inset-0 z-80 flex items-center justify-center bg-[#020617]/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-xl border border-[#1e293b] bg-[#0b1730] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#1e293b] px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">{selectedMediaForAction.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedMediaForAction.type} - {formatFileSize(selectedMediaForAction.size)}
                </p>
              </div>
              <button
                className="rounded-md p-1.5 text-slate-400 hover:bg-[#1b2b46] hover:text-slate-200"
                onClick={() => setSelectedMediaForAction(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              <div className="h-[280px] overflow-hidden rounded-lg border border-[#223655] bg-[#081126]">
                {selectedMediaForAction.type === "image" ? (
                  <img
                    src={selectedMediaForAction.url}
                    alt={selectedMediaForAction.name}
                    className="h-full w-full object-contain"
                  />
                ) : selectedMediaForAction.type === "video" ? (
                  <video src={selectedMediaForAction.url} controls className="h-full w-full object-contain" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-300">
                    <Music2 className="h-10 w-10 text-blue-400" />
                    <audio src={selectedMediaForAction.url} controls className="w-[85%]" />
                  </div>
                )}
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  onClick={() => handleAddMediaToTimeline(selectedMediaForAction)}
                >
                  Add to Timeline
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </PageLayout>
  );
};

export default EditorPage;
