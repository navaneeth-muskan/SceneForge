"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  Clapperboard,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mic,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Search,
  Video,
  Wand2,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useGeminiAgent } from "@/hooks/useGeminiAgent";
import { AgentSkillCard } from "./AgentSkillCard";
import type { StoryBuildResult, BuiltScene, MediaAnalysisResult, AgentCapabilities } from "@/lib/gemini/types";
import type { WebSearchResult } from "@/hooks/useGeminiAgent";

// ─── Props ───────────────────────────────────────────────────────────────────

interface UploadedMediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "audio" | "document";
  mimeType?: string;
  gcsUri?: string;
}

export interface AgentPanelProps {
  uploadedMedia: UploadedMediaItem[];
  uploadingMediaNames?: string[];
  fps: number;
  durationInFrames: number;
  onTimelineReady: (result: StoryBuildResult) => void;
  onMediaAnalyzed?: (assetId: string, analysis: MediaAnalysisResult) => void;
  onNarrationReady?: (audioDataUrl: string, text: string) => void;
  onImageGenerated?: (imageDataUrl: string) => void;
  onAddToTimeline?: (dataUrl: string, type: "image" | "audio") => void;
}

// ─── Scene status badge ──────────────────────────────────────────────────────

function SceneBadge({ scene }: { scene: BuiltScene }) {
  const typeColors: Record<string, string> = {
    animation: "bg-purple-500/20 text-purple-300",
    title: "bg-blue-500/20 text-blue-300",
    video: "bg-green-500/20 text-green-300",
    image: "bg-yellow-500/20 text-yellow-300",
    audio: "bg-orange-500/20 text-orange-300",
    transition: "bg-slate-500/20 text-slate-300",
  };

  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-slate-800/50 border border-slate-700/50">
      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${typeColors[scene.type] ?? "bg-slate-500/20 text-slate-300"}`}
          >
            {scene.type}
          </span>
          <span className="text-[10px] text-slate-500">
            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
            {(scene.durationFrames / 30).toFixed(1)}s
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug truncate">
          {scene.description}
        </p>
      </div>
    </div>
  );
}

// ─── Skill asset picker dialog ───────────────────────────────────────────────

interface SkillDialogProps {
  skill: "analyze_image" | "understand_video" | "read_pdf" | "generate_narration" | "generate_image" | "edit_image" | "web_search";
  uploadedMedia: UploadedMediaItem[];
  onClose: () => void;
  onRun: (assetId?: string, text?: string, voice?: string, extra?: Record<string, string>) => void;
  onAddToTimeline?: (dataUrl: string, type: "image" | "audio") => void;
  isRunning: boolean;
  result: MediaAnalysisResult | null;
  ttsUrl: string | null;
  generatedImageUrl: string | null;
  webSearchResult: WebSearchResult | null;
  error: string | null;
}

function SkillDialog({
  skill,
  uploadedMedia,
  onClose,
  onRun,
  onAddToTimeline,
  isRunning,
  result,
  ttsUrl,
  generatedImageUrl,
  webSearchResult,
  error,
}: SkillDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(uploadedMedia[0]?.id ?? "");
  const [narrationText, setNarrationText] = useState("");
  const [voice, setVoice] = useState("Aoede");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageModel, setImageModel] = useState("imageFlash");
  const [imageAspectRatio, setImageAspectRatio] = useState("16:9");
  const [imageNegativePrompt, setImageNegativePrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const voices = ["Aoede", "Charon", "Fenrir", "Kore", "Puck", "Zephyr"];

  const filterType: "image" | "video" | "document" | null =
    skill === "analyze_image" || skill === "edit_image" ? "image" :
    skill === "understand_video" ? "video" :
    skill === "read_pdf" ? "document" :
    null;

  const eligibleAssets = filterType
    ? uploadedMedia.filter((m) => m.type === filterType)
    : uploadedMedia;

  const skillLabels: Record<string, string> = {
    analyze_image: "Analyze Image",
    understand_video: "Understand Video",
    read_pdf: "Read PDF",
    generate_narration: "Generate Narration",
    generate_image: "Generate Image",
    edit_image: "Edit Image",
    web_search: "Live Web Search",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              {skillLabels[skill]}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Progress indicator */}
          {isRunning && (
            <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Generating, please wait…</span>
            </div>
          )}
          {/* TTS-specific */}
          {skill === "generate_narration" ? (
            <>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Narration text
                </label>
                <textarea
                  value={narrationText}
                  onChange={(e) => setNarrationText(e.target.value)}
                  placeholder="Enter the text to speak…"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 p-3 resize-none h-28 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Voice</label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 p-2 focus:outline-none"
                >
                  {voices.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </>
          ) : skill === "generate_image" ? (
            <>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Image prompt</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe the image in detail…&#10;e.g. Aerial city skyline at night, neon signs, cinematic, 16:9"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 p-3 resize-none h-24 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Model</label>
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-200 p-2 focus:outline-none"
                  >
                    <option value="imageFlash">Flash — balanced</option>
                    <option value="imagePro">Pro — complex</option>
                    <option value="imageLite">Lite — fastest</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Aspect ratio</label>
                  <select
                    value={imageAspectRatio}
                    onChange={(e) => setImageAspectRatio(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-200 p-2 focus:outline-none"
                  >
                    <option value="16:9">16:9 — landscape</option>
                    <option value="9:16">9:16 — portrait</option>
                    <option value="1:1">1:1 — square</option>
                    <option value="4:3">4:3</option>
                    <option value="3:4">3:4</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Negative prompt <span className="text-slate-600">(optional)</span></label>
                <input
                  value={imageNegativePrompt}
                  onChange={(e) => setImageNegativePrompt(e.target.value)}
                  placeholder="text, arrows, callouts, boxes, watermark, blurry, distorted..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          ) : skill === "web_search" ? (
            <>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Search query</label>
                <textarea
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask for current info, comparisons, or recent updates…"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 p-3 resize-none h-24 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          ) : skill === "edit_image" ? (
            <>
              {eligibleAssets.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No images uploaded yet.
                </p>
              ) : (
                <div className="mb-4">
                  <label className="text-xs text-slate-400 mb-1.5 block">Select reference image</label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {eligibleAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedId(asset.id)}
                        className={`w-full text-left flex items-center gap-2 p-2 rounded-md text-xs transition-all ${
                          selectedId === asset.id
                            ? "bg-blue-500/20 border border-blue-500/50 text-blue-200"
                            : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <ImageIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{asset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Edit prompt</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe how to transform the image... e.g. 'Make it cinematic cyberpunk'"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 p-3 resize-none h-24 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              {eligibleAssets.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No {filterType === "document" ? "PDF / text documents" : filterType ?? "media"} uploaded yet.{" "}
                  {filterType === "document" && (
                    <span className="text-slate-400">Upload a .pdf, .txt, .doc, or .docx file from the Uploads tab.</span>
                  )}
                </p>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">
                    Select {filterType ?? "file"}
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {eligibleAssets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => setSelectedId(asset.id)}
                        className={`w-full text-left flex items-center gap-2 p-2 rounded-md text-xs transition-all ${
                          selectedId === asset.id
                            ? "bg-blue-500/20 border border-blue-500/50 text-blue-200"
                            : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        <span className="w-4 h-4 shrink-0">
                          {asset.type === "video" ? (
                            <Video className="w-4 h-4" />
                          ) : asset.type === "document" ? (
                            <FileText className="w-4 h-4 text-amber-400" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </span>
                        <span className="truncate">{asset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              {error}
            </div>
          )}

          {/* Result: media analysis */}
          {result && !ttsUrl && !generatedImageUrl && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2 max-h-52 overflow-y-auto">
              <p className="text-xs text-slate-300 leading-relaxed">{result.description}</p>
              {result.tags && result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {result.tags.slice(0, 8).map((t) => (
                    <span key={t} className="text-[10px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {Array.isArray((result as Record<string, unknown>).suggestedOverlays) && (((result as Record<string, unknown>).suggestedOverlays as unknown[]).every((s) => typeof s === "string")) && (((result as Record<string, unknown>).suggestedOverlays as string[]).length > 0) && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">Suggested overlays:</p>
                  {((result as Record<string, unknown>).suggestedOverlays as string[]).slice(0, 3).map((s, i) => (
                    <p key={i} className="text-[10px] text-slate-400">{s}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Result: TTS */}
          {ttsUrl && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-2">Audio generated:</p>
              <audio controls className="w-full" src={ttsUrl} />
            </div>
          )}

          {/* Result: Generated image */}
          {generatedImageUrl && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg overflow-hidden">
              <div className="max-h-48 flex items-center justify-center bg-black/30 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={generatedImageUrl} alt="Generated" className="max-w-full max-h-48 object-contain" />
              </div>
              <div className="px-3 py-1.5 flex items-center justify-between border-t border-slate-700/60">
                <span className="text-[10px] text-slate-500">Image generated</span>
                <a
                  href={generatedImageUrl}
                  download="generated-image.png"
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                >
                  Download
                </a>
              </div>
            </div>
          )}

          {/* Result: Web search */}
          {webSearchResult && (
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-3 max-h-64 overflow-y-auto">
              <p className="text-xs text-slate-300 leading-relaxed">{webSearchResult.answer}</p>
              <div
                className="text-xs text-slate-300 leading-relaxed [&_a]:text-blue-400 [&_a]:underline [&_h3]:text-slate-200 [&_h3]:font-semibold [&_h3]:mt-2 [&_ul]:list-disc [&_ul]:pl-4"
                // HTML is generated server-side by our own search agent.
                dangerouslySetInnerHTML={{ __html: webSearchResult.renderedContent }}
              />
              {webSearchResult.searchSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-500">Sources</p>
                  {webSearchResult.searchSuggestions.map((s) => (
                    <a
                      key={`${s.url}-${s.title}`}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[11px] text-blue-300 hover:text-blue-200"
                    >
                      {s.title || s.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-slate-700 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg"
          >
            {result || ttsUrl || generatedImageUrl ? "Close" : "Cancel"}
          </button>
          {generatedImageUrl && onAddToTimeline && (
            <button
              onClick={() => onAddToTimeline(generatedImageUrl, "image")}
              className="px-3 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Timeline
            </button>
          )}
          {ttsUrl && onAddToTimeline && (
            <button
              onClick={() => onAddToTimeline(ttsUrl, "audio")}
              className="px-3 py-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Timeline
            </button>
          )}
          {(skill === "generate_image" || skill === "edit_image" || skill === "generate_narration" || skill === "web_search") ? (
            <button
              onClick={() => {
                if (skill === "generate_narration") {
                  onRun(undefined, narrationText, voice);
                } else if (skill === "web_search") {
                  onRun(undefined, searchQuery);
                } else {
                  onRun(skill === "edit_image" ? selectedId : undefined, imagePrompt, undefined, {
                    model: imageModel,
                    aspectRatio: imageAspectRatio,
                    negativePrompt: imageNegativePrompt,
                  });
                }
              }}
              disabled={
                isRunning ||
                (skill === "generate_narration"
                  ? !narrationText.trim()
                  : skill === "web_search"
                    ? !searchQuery.trim()
                    : !imagePrompt.trim() || (skill === "edit_image" && !selectedId))
              }
              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Running…
                </>
              ) : (generatedImageUrl || ttsUrl || webSearchResult) ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run
                </>
              )}
            </button>
          ) : (
            !result && (
              <button
                onClick={() => onRun(selectedId)}
                disabled={isRunning || !selectedId}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Run
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main AgentPanel ─────────────────────────────────────────────────────────

export function AgentPanel({
  uploadedMedia,
  uploadingMediaNames = [],
  fps,
  durationInFrames,
  onTimelineReady,
  onMediaAnalyzed,
  onNarrationReady,
  onImageGenerated,
  onAddToTimeline,
}: AgentPanelProps) {
  const {
    phase,
    error,
    plannerSummary,
    result,
    skillResult,
    ttsAudioUrl,
    generatedImageUrl,
    webSearchResult,
    isRunning,
    runStory,
    runSkill,
    reset,
    capabilities,
    setCapabilities,
  } = useGeminiAgent();

  const [storyPrompt, setStoryPrompt] = useState("");
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const [activeSkillDialog, setActiveSkillDialog] = useState<
    "analyze_image" | "understand_video" | "read_pdf" | "generate_narration" | "generate_image" | "edit_image" | "web_search" | null
  >(null);
  const [includedAssetIds, setIncludedAssetIds] = useState<Set<string>>(new Set());
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false);
  const [sourceSelectedIds, setSourceSelectedIds] = useState<Set<string>>(new Set());
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Keep track of which assets we've already "seen" so we don't auto-add the same asset twice if the user explicitly removed it.
  const seenAssetIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIncludedAssetIds((previous) => {
      const next = new Set<string>();

      // Keep previously included items that still exist
      const availableIds = new Set(uploadedMedia.map((item) => item.id));
      Array.from(previous).forEach((id) => {
        if (availableIds.has(id)) next.add(id);
      });

      // Automatically include any NEW assets that we haven't seen before
      uploadedMedia.forEach((item) => {
        if (!seenAssetIds.current.has(item.id)) {
          next.add(item.id);
          seenAssetIds.current.add(item.id);
        }
      });

      const unchanged =
        next.size === previous.size && Array.from(next).every((id) => previous.has(id));
      return unchanged ? previous : next;
    });
  }, [uploadedMedia]);

  const storyEligibleMedia = uploadedMedia;
  const includedStoryMedia = storyEligibleMedia.filter((item) => includedAssetIds.has(item.id));
  const includedEligibleCount = storyEligibleMedia.filter((item) => includedAssetIds.has(item.id)).length;

  const toggleIncludedAsset = (assetId: string) => {
    setIncludedAssetIds((previous) => {
      const next = new Set(previous);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const includeAllAssets = () => {
    setIncludedAssetIds(new Set(uploadedMedia.map((item) => item.id)));
  };

  const clearAllAssets = () => {
    setIncludedAssetIds(new Set());
  };

  const toggleSourceSelection = (assetId: string) => {
    setSourceSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const addSelectedSources = () => {
    if (!sourceSelectedIds.size) return;
    setIncludedAssetIds((previous) => {
      const next = new Set(previous);
      Array.from(sourceSelectedIds).forEach((id) => next.add(id));
      return next;
    });
    setSourceSelectedIds(new Set());
    setIsSourcePickerOpen(false);
  };

  // Convert uploaded media to AssetRef format for the agent
  const assetRefs = uploadedMedia
    .filter((m) => includedAssetIds.has(m.id))
    .map((m) => ({
    id: m.id,
    name: m.name,
    url: m.url,
    mediaType: m.type,
    gcsUri: m.gcsUri,
    }));

  async function handleBuildStory() {
    if (!storyPrompt.trim() || isRunning) return;
    const storyResult = await runStory(storyPrompt, assetRefs, fps, durationInFrames);
    if (storyResult) {
      onTimelineReady(storyResult);
    }
  }

  /** Convert a blob: or object URL to a base64 data string the server can use */
  async function resolveFileData(url: string, mimeType: string): Promise<{ base64Data: string } | { fileUrl: string }> {
    if (url.startsWith("blob:") || url.startsWith("data:")) {
      const resp = await fetch(url);
      const buffer = await resp.arrayBuffer();
      // Safe chunked base64 encoding (avoids call-stack overflow on large files)
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunkSize)));
      }
      return { base64Data: `data:${mimeType};base64,${btoa(binary)}` };
    }
    return { fileUrl: url };
  }

  async function handleSkillRun(assetId?: string, text?: string, voice?: string, extra?: Record<string, string>) {
    if (!activeSkillDialog) return;
    const skill = activeSkillDialog;

    if (skill === "generate_narration") {
      const audioUrl = await runSkill({ skill, text: text ?? "", voice });
      if (audioUrl && typeof audioUrl === "string" && onNarrationReady) {
        onNarrationReady(audioUrl, text ?? "");
      }
    } else if (skill === "generate_image" || skill === "edit_image") {
      let fileData = {};
      let resolvedMimeType = "image/jpeg";
      
      if (skill === "edit_image" && assetId) {
        const asset = uploadedMedia.find((m) => m.id === assetId);
        if (asset) {
          resolvedMimeType = asset.mimeType ?? "image/jpeg";
          fileData = await resolveFileData(asset.url, resolvedMimeType);
        }
      }

      const imgUrl = await runSkill({
        skill,
        text: text ?? "",
        assetId: skill === "edit_image" ? assetId : undefined,
        ...fileData,
        mimeType: resolvedMimeType,
        imageModel: extra?.model,
        imageAspectRatio: extra?.aspectRatio,
        negativePrompt: extra?.negativePrompt,
      });
      if (imgUrl && typeof imgUrl === "string" && onImageGenerated) {
        onImageGenerated(imgUrl);
      }
    } else if (skill === "web_search") {
      await runSkill({ skill, text: text ?? "" });
    } else {
      const asset = uploadedMedia.find((m) => m.id === assetId);
      if (!asset) return;
      const resolvedMimeType = asset.mimeType ?? (
        asset.type === "video" ? "video/mp4" :
        asset.type === "document" ? "application/pdf" :
        "image/jpeg"
      );
      const fileData = await resolveFileData(asset.url, resolvedMimeType);
      const analysis = await runSkill({
        skill,
        ...fileData,
        mimeType: resolvedMimeType,
        fileType: skill === "understand_video" ? "video" : skill === "read_pdf" ? "pdf" : "image",
      });
      if (analysis && typeof analysis === "object" && onMediaAnalyzed && assetId) {
        onMediaAnalyzed(assetId, analysis as MediaAnalysisResult);
      }
    }
  }

  const phaseLabels: Record<string, string> = {
    idle: "",
    planning: "Gemini 2.5 Pro is planning your story…",
    building: "Building scenes in parallel…",
    composing: "Composing timeline…",
    done: "Story ready!",
    error: "Something went wrong.",
  };

  return (
    <div className="flex flex-col h-full text-slate-300">
      {/* Header */}
      <div className="h-14 flex items-center gap-2 px-5 border-b border-[#1e293b] shrink-0">
        <Bot className="w-4 h-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-slate-200">Gemini Agent</h2>
        <span className="ml-auto text-[10px] bg-blue-500/15 text-blue-300 px-1.5 py-0.5 rounded-full">
          ADK
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* ── Story Builder ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clapperboard className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-slate-300">Story Builder</span>
          </div>

          <div className="mb-2 rounded-lg border border-slate-700 bg-slate-800/40 p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-300">Story files</span>
              <span className="text-[10px] text-slate-400">
                Included {includedEligibleCount}/{storyEligibleMedia.length}
              </span>
            </div>

            {uploadingMediaNames.length > 0 && (
              <p className="mt-1 text-[10px] text-blue-300">
                Uploading {uploadingMediaNames.length} file{uploadingMediaNames.length > 1 ? "s" : ""}...
              </p>
            )}

            {uploadedMedia.length === 0 ? (
              <p className="mt-2 text-[11px] text-slate-500">No uploaded files yet.</p>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSourcePickerOpen((prev) => !prev)}
                    className="rounded border border-blue-500/40 px-2 py-1 text-[10px] text-blue-300 hover:border-blue-400"
                  >
                    + Add from source
                  </button>
                  <button
                    type="button"
                    onClick={clearAllAssets}
                    disabled={includedStoryMedia.length === 0}
                    className="rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-400 disabled:opacity-40"
                  >
                    Clear all
                  </button>
                </div>

                {isSourcePickerOpen && (
                  <div className="mt-2 rounded-md border border-slate-700 bg-slate-900/60 p-2">
                    <p className="mb-1 text-[10px] text-slate-400">Select files to include in story</p>
                    <div className="max-h-36 space-y-1 overflow-y-auto">
                      {uploadedMedia.map((asset) => {
                        const selected = sourceSelectedIds.has(asset.id);
                        return (
                          <button
                            type="button"
                            key={asset.id}
                            onClick={() => {
                              toggleSourceSelection(asset.id);
                            }}
                            className={`w-full flex items-center gap-2 rounded border px-2 py-1.5 text-[11px] ${
                              selected
                                ? "border-blue-500/40 bg-blue-500/10 text-blue-200"
                                : "border-slate-700 bg-slate-900/30 text-slate-300"
                            } hover:border-slate-500`}
                          >
                            <span
                              className={`flex h-3.5 w-3.5 items-center justify-center rounded border text-[9px] font-semibold ${
                                selected
                                  ? "border-blue-400 bg-blue-500/80 text-white"
                                  : "border-slate-600 bg-slate-800 text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <span className="w-4 h-4 shrink-0">
                              {asset.type === "video" ? (
                                <Video className="w-4 h-4" />
                              ) : asset.type === "audio" ? (
                                <Mic className="w-4 h-4" />
                              ) : asset.type === "document" ? (
                                <FileText className="w-4 h-4 text-amber-400" />
                              ) : (
                                <ImageIcon className="w-4 h-4" />
                              )}
                            </span>
                            <span className="truncate flex-1 text-left">{asset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSourceSelectedIds(new Set());
                          setIsSourcePickerOpen(false);
                        }}
                        className="rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addSelectedSources}
                        disabled={sourceSelectedIds.size === 0}
                        className="rounded border border-blue-500/50 bg-blue-500/20 px-2 py-1 text-[10px] text-blue-200 hover:border-blue-400 disabled:opacity-40"
                      >
                        Add selected
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                  {includedStoryMedia.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No files added yet. Use "Add from source".</p>
                  ) : (
                    includedStoryMedia.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 text-[11px] text-blue-200"
                      >
                        <span className="w-4 h-4 shrink-0">
                          {asset.type === "video" ? (
                            <Video className="w-4 h-4" />
                          ) : asset.type === "audio" ? (
                            <Mic className="w-4 h-4" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </span>
                        <span className="truncate flex-1">{asset.name}</span>
                        <button
                          type="button"
                          onClick={() => toggleIncludedAsset(asset.id)}
                          className="rounded border border-blue-400/40 px-1.5 py-0.5 text-[10px] text-blue-100 hover:border-blue-300"
                          title="Remove from story"
                        >
                          x
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={includeAllAssets}
                    disabled={storyEligibleMedia.length === 0}
                    className="rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-300 hover:border-slate-400 disabled:opacity-40"
                  >
                    Select all
                  </button>
                </div>
              </>
            )}
          </div>

          <textarea
            ref={promptRef}
            value={storyPrompt}
            onChange={(e) => setStoryPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) handleBuildStory();
            }}
            placeholder={'Describe your story or video idea... e.g. "A product launch for a new AI laptop with cinematic title cards and demo footage"'}
            disabled={isRunning}
            rows={5}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 p-3 resize-none focus:outline-none focus:border-blue-500 disabled:opacity-60"
          />

          {/* Agent Capabilities */}
          <div className="mt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Wand2 className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Agent capabilities</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { key: "generateImages" as const, label: "Images", icon: "🎨" },
                { key: "generateAudio" as const, label: "Audio", icon: "🔊" },
                { key: "useCharts" as const, label: "Charts", icon: "📊" },
                { key: "use3D" as const, label: "3D", icon: "🌀" },
                { key: "useMaps" as const, label: "Maps", icon: "🗺️" },
                { key: "useComponents" as const, label: "Components", icon: "🧩" },
              ] as { key: keyof AgentCapabilities; label: string; icon: string }[]).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }))}
                  disabled={isRunning}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] border transition-all ${
                    capabilities[key]
                      ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                      : "bg-slate-800/60 border-slate-700 text-slate-500 hover:border-slate-500"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleBuildStory}
              disabled={isRunning || !storyPrompt.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {phaseLabels[phase] || "Building..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Build Story
                </>
              )}
            </button>
            {(result || error) && (
              <button
                onClick={reset}
                className="px-2 py-2 border border-slate-700 rounded-lg hover:border-slate-400 text-slate-400 hover:text-slate-200"
                title="Reset"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              {error}
            </div>
          )}
        </div>

        {/* ── Planner Reasoning ────────────────────────────────────── */}
        {plannerSummary && (
          <div className="rounded-lg border border-slate-700/70 bg-slate-800/30 overflow-hidden">
            <button
              onClick={() => setReasoningExpanded((p) => !p)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              <div className="flex items-center gap-1.5">
                <Bot className="w-3 h-3" />
                Agent Reasoning
              </div>
              {reasoningExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            {reasoningExpanded && (
              <p className="px-3 pb-3 text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">
                {plannerSummary}
              </p>
            )}
          </div>
        )}

        {/* ── Scene Results ─────────────────────────────────────────── */}
        {result && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-semibold text-slate-300">
                  {result.plan.title}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {result.scenes.length} scenes · {(result.totalFrames / fps).toFixed(1)}s
              </span>
            </div>
            <div className="space-y-1.5">
              {result.scenes.map((s) => (
                <SceneBadge key={s.index} scene={s} />
              ))}
            </div>
            <button
              onClick={() => onTimelineReady(result)}
              className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 text-xs font-medium rounded-lg transition-all"
            >
              <Clapperboard className="w-3.5 h-3.5" />
              Apply to Timeline
            </button>
          </div>
        )}

        {/* ── Agent Skills ──────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-semibold text-slate-300">Agent Skills</span>
          </div>
          <div className="space-y-2">
            <AgentSkillCard
              icon={Video}
              label="Understand Video"
              description="Transcribe, describe, and extract tags from uploaded videos"
              badge="2.0 Flash"
              onClick={() => { reset(); setActiveSkillDialog("understand_video"); }}
              disabled={!uploadedMedia.some((m) => m.type === "video")}
            />
            <AgentSkillCard
              icon={ImageIcon}
              label="Analyze Image"
              description="Detect content, palette, and suggest overlay text for images"
              badge="2.0 Flash"
              onClick={() => { reset(); setActiveSkillDialog("analyze_image"); }}
              disabled={!uploadedMedia.some((m) => m.type === "image")}
            />
            <AgentSkillCard
              icon={FileText}
              label="Read PDF / Document"
              description="Extract key points and text overlay ideas from a document"
              badge="2.0 Flash"
              onClick={() => { reset(); setActiveSkillDialog("read_pdf"); }}
            />
            <AgentSkillCard
              icon={Mic}
              label="Generate Narration"
              description="Convert text to natural speech and add it as an audio track"
              badge="TTS"
              onClick={() => { reset(); setActiveSkillDialog("generate_narration"); }}
            />
            <AgentSkillCard
              icon={Wand2}
              label="Generate Image"
              description="Create AI-generated images from a text prompt for image scenes"
              badge="Imagen"
              onClick={() => { reset(); setActiveSkillDialog("generate_image"); }}
            />
            <AgentSkillCard
              icon={Wand2}
              label="Edit Image"
              description="Transform an uploaded reference image using AI"
              badge="Imagen"
              onClick={() => { reset(); setActiveSkillDialog("edit_image"); }}
              disabled={!uploadedMedia.some((m) => m.type === "image")}
            />
            <AgentSkillCard
              icon={Search}
              label="Live Web Search"
              description="Get grounded, current web answers with source links"
              badge="Grounded"
              onClick={() => { reset(); setActiveSkillDialog("web_search"); }}
            />
          </div>
        </div>

        {/* ── Model info ────────────────────────────────────────────── */}
        <div className="text-[10px] text-slate-600 text-center pt-1 pb-2">
          Story planner: Gemini 2.5 Pro · Scene builder: Gemini 2.0 Flash
          <br />
          Powered by Google ADK (TypeScript)
        </div>
      </div>

      {/* ── Skill Dialog — rendered via portal to escape overflow/transform parents ── */}
      {activeSkillDialog && typeof document !== "undefined" && createPortal(
        <SkillDialog
          skill={activeSkillDialog}
          uploadedMedia={uploadedMedia}
          onClose={() => setActiveSkillDialog(null)}
          onRun={handleSkillRun}
          onAddToTimeline={onAddToTimeline}
          isRunning={isRunning}
          result={activeSkillDialog !== "generate_narration" && activeSkillDialog !== "generate_image" && activeSkillDialog !== "edit_image" && activeSkillDialog !== "web_search" ? skillResult : null}
          ttsUrl={activeSkillDialog === "generate_narration" ? ttsAudioUrl : null}
          generatedImageUrl={activeSkillDialog === "generate_image" || activeSkillDialog === "edit_image" ? generatedImageUrl : null}
          webSearchResult={activeSkillDialog === "web_search" ? webSearchResult : null}
          error={error}
        />,
        document.body
      )}
    </div>
  );
}
