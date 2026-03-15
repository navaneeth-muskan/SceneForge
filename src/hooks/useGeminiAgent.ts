"use client";

import { useCallback, useRef, useState } from "react";
import type React from "react";
import type { AssetRef, StoryBuildResult, MediaAnalysisResult, AgentCapabilities } from "@/lib/gemini/types";
import { DEFAULT_CAPABILITIES } from "@/lib/gemini/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AgentPhase =
  | "idle"
  | "planning"
  | "building"
  | "composing"
  | "done"
  | "error";

export interface WebSearchSuggestion {
  title: string;
  url: string;
  snippet?: string;
}

export interface WebSearchResult {
  answer: string;
  renderedContent: string;
  searchSuggestions: WebSearchSuggestion[];
}

export interface AgentSkillRunOptions {
  skill: "understand_video" | "analyze_image" | "read_pdf" | "generate_narration" | "generate_image" | "edit_image" | "web_search";
  fileUrl?: string;
  base64Data?: string;
  mimeType?: string;
  fileType?: "image" | "video" | "pdf" | "text";
  text?: string;
  voice?: string;
  question?: string;
  assetId?: string;
  /** generate_image options */
  imageModel?: string;
  imageAspectRatio?: string;
  negativePrompt?: string;
}

export interface UseGeminiAgentReturn {
  // State
  phase: AgentPhase;
  error: string | null;
  plannerSummary: string;
  result: StoryBuildResult | null;
  skillResult: MediaAnalysisResult | null;
  ttsAudioUrl: string | null;
  generatedImageUrl: string | null;
  webSearchResult: WebSearchResult | null;
  isRunning: boolean;
  capabilities: AgentCapabilities;

  // Actions
  runStory: (
    prompt: string,
    assets: AssetRef[],
    fps?: number,
    durationInFrames?: number
  ) => Promise<StoryBuildResult | null>;
  runSkill: (options: AgentSkillRunOptions) => Promise<MediaAnalysisResult | WebSearchResult | string | null>;
  setCapabilities: React.Dispatch<React.SetStateAction<AgentCapabilities>>;
  reset: () => void;
}
// ─── Hook ───────────────────────────────────────────────────────────────────

export function useGeminiAgent(): UseGeminiAgentReturn {
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [plannerSummary, setPlannerSummary] = useState("");
  const [result, setResult] = useState<StoryBuildResult | null>(null);
  const [skillResult, setSkillResult] = useState<MediaAnalysisResult | null>(null);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [webSearchResult, setWebSearchResult] = useState<WebSearchResult | null>(null);
  const [capabilities, setCapabilities] = useState<AgentCapabilities>(DEFAULT_CAPABILITIES);
  const [isSkillRunning, setIsSkillRunning] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setError(null);
    setPlannerSummary("");
    setResult(null);
    setSkillResult(null);
    setTtsAudioUrl(null);
    setGeneratedImageUrl(null);
    setWebSearchResult(null);
  }, []);

  // ── Story pipeline ────────────────────────────────────────────────────────

  const runStory = useCallback(
    async (
      prompt: string,
      assets: AssetRef[],
      fps = 30,
      durationInFrames = 900
    ): Promise<StoryBuildResult | null> => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setPhase("planning");
      setError(null);
      setPlannerSummary("Gemini is planning your story…");
      setResult(null);

      try {
        const resp = await fetch("/api/agent/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, assets, fps, durationInFrames, capabilities }),
          signal: ctrl.signal,
        });

        if (!resp.ok) {
          const errData = (await resp.json()) as { error?: string };
          throw new Error(errData.error ?? `HTTP ${resp.status}`);
        }

        setPhase("building");
        const data = (await resp.json()) as StoryBuildResult;

        setPlannerSummary(data.plannerSummary ?? "");
        setResult(data);
        setPhase("done");
        return data;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          setPhase("idle");
          return null;
        }
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        setPhase("error");
        return null;
      }
    },
    []
  );

  // ── Skill runner ─────────────────────────────────────────────────────────

  const runSkill = useCallback(
    async (
      options: AgentSkillRunOptions
    ): Promise<MediaAnalysisResult | WebSearchResult | string | null> => {
      const { skill, fileUrl, base64Data, mimeType = "image/jpeg", text, voice, question, imageModel, imageAspectRatio, negativePrompt } = options;

      setSkillResult(null);
      setTtsAudioUrl(null);
      setGeneratedImageUrl(null);
      setWebSearchResult(null);
      setError(null);
      setIsSkillRunning(true);

      try {
        if (skill === "generate_narration") {
          if (!text) throw new Error("text is required for narration");
          const resp = await fetch("/api/agent/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice }),
          });
          if (!resp.ok) {
            const e = (await resp.json()) as { error?: string };
            throw new Error(e.error ?? `HTTP ${resp.status}`);
          }
          const data = (await resp.json()) as { audioDataUrl: string };
          setTtsAudioUrl(data.audioDataUrl);
          return data.audioDataUrl;
        }

        if (skill === "generate_image" || skill === "edit_image") {
          if (!text) throw new Error("prompt is required for image generation");
          const resp = await fetch("/api/agent/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: text,
              model: imageModel ?? "imageFlash",
              aspectRatio: imageAspectRatio ?? "16:9",
              negativePrompt: negativePrompt || undefined,
              numberOfImages: 1,
              referenceImage: skill === "edit_image" ? (base64Data ?? fileUrl) : undefined,
            }),
          });
          if (!resp.ok) {
            const e = (await resp.json()) as { error?: string };
            throw new Error(e.error ?? `HTTP ${resp.status}`);
          }
          const data = (await resp.json()) as { images: { dataUrl: string }[] };
          const url = data.images?.[0]?.dataUrl;
          if (!url) throw new Error("No image returned");
          setGeneratedImageUrl(url);
          return url;
        }

        if (skill === "web_search") {
          if (!text?.trim()) throw new Error("query is required for web search");
          const resp = await fetch("/api/agent/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: text }),
          });
          if (!resp.ok) {
            const e = (await resp.json()) as { error?: string };
            throw new Error(e.error ?? `HTTP ${resp.status}`);
          }
          const data = (await resp.json()) as WebSearchResult;
          setWebSearchResult(data);
          return data;
        }

        // Media understanding
        const fileTypeMap: Record<string, string> = {
          understand_video: "video",
          analyze_image: "image",
          read_pdf: "pdf",
        };
        const fileType = fileTypeMap[skill] ?? "image";

        const resp = await fetch("/api/agent/understand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl, base64Data, mimeType, fileType, question }),
        });
        if (!resp.ok) {
          const e = (await resp.json()) as { error?: string };
          throw new Error(e.error ?? `HTTP ${resp.status}`);
        }
        const data = (await resp.json()) as MediaAnalysisResult;
        setSkillResult(data);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
        return null;
      } finally {
        setIsSkillRunning(false);
      }
    },
    []
  );

  return {
    phase,
    error,
    plannerSummary,
    result,
    skillResult,
    ttsAudioUrl,
    generatedImageUrl,
    webSearchResult,
    isRunning: phase === "planning" || phase === "building" || phase === "composing" || isSkillRunning,
    capabilities,
    runStory,
    runSkill,
    setCapabilities,
    reset,
  };
}
