"use client";

import { Player } from "@remotion/player";
import type { PlayerRef } from "@remotion/player";
import { useEffect, useMemo, useRef, useState } from "react";
import { compileCode } from "@/remotion/compiler";

const EDITOR_PREVIEW_STORAGE_KEY = "videoai:editor-preview-payload";

interface PreviewPayload {
  code: string;
  codeWithCaptions?: string;
  codeWithoutCaptions?: string;
  fps: number;
  durationInFrames: number;
  width: number;
  height: number;
  aspect?: string;
  audioTracks?: PreviewAudioTrack[];
  updatedAt: number;
}

interface PreviewAudioTrack {
  id: string;
  name: string;
  url: string;
  start: number;
  end: number;
}

const readPreviewPayload = (): PreviewPayload | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(EDITOR_PREVIEW_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PreviewPayload;
    if (
      typeof parsed?.code !== "string" ||
      typeof parsed?.fps !== "number" ||
      typeof parsed?.durationInFrames !== "number" ||
      typeof parsed?.width !== "number" ||
      typeof parsed?.height !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export default function EditorPreviewPage() {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const playerRef = useRef<PlayerRef>(null);
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    setPayload(readPreviewPayload());
    const sync = () => setPayload(readPreviewPayload());
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const activeCode = useMemo(() => {
    if (!payload) return "";
    if (showCaptions) {
      return payload.codeWithCaptions ?? payload.code;
    }
    return payload.codeWithoutCaptions ?? payload.code;
  }, [payload, showCaptions]);

  const compilation = useMemo(() => {
    if (!activeCode) return { Component: null, error: "No composition found. Open preview from editor." };
    return compileCode(activeCode);
  }, [activeCode]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFrame = (event: { detail: { frame: number } }) => {
      setCurrentFrame(event.detail.frame ?? 0);
    };

    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    player.addEventListener("frameupdate", onFrame);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("frameupdate", onFrame);
    };
  }, [payload?.updatedAt]);

  useEffect(() => {
    const map = audioElsRef.current;
    const tracks = payload?.audioTracks ?? [];
    const ids = new Set(tracks.map((track) => track.id));

    Array.from(map.entries()).forEach(([id, el]) => {
      if (!ids.has(id)) {
        el.pause();
        map.delete(id);
      }
    });

    tracks.forEach((track) => {
      if (map.has(track.id)) return;
      const el = new Audio();
      el.src = track.url;
      el.preload = "auto";
      map.set(track.id, el);
    });
  }, [payload?.audioTracks, payload?.updatedAt]);

  useEffect(() => {
    if (isPlaying) return;
    audioElsRef.current.forEach((el) => el.pause());
  }, [isPlaying]);

  useEffect(() => {
    if (!payload || !isPlaying) return;

    const tracks = payload.audioTracks ?? [];
    const map = audioElsRef.current;
    const progress = payload.durationInFrames > 0 ? (currentFrame / payload.durationInFrames) * 100 : 0;
    const oneFramePct = payload.durationInFrames > 0 ? 100 / payload.durationInFrames : 0.5;

    tracks.forEach((track) => {
      const el = map.get(track.id);
      if (!el) return;

      const inRange = progress >= track.start && progress < track.end + oneFramePct;
      if (inRange && el.paused) {
        const startFrame = Math.round((track.start / 100) * payload.durationInFrames);
        const targetTime = Math.max(0, (currentFrame - startFrame) / Math.max(1, payload.fps));
        if (Number.isFinite(el.duration) && targetTime >= Math.max(0, el.duration - 0.02)) return;
        el.currentTime = targetTime;
        el.play().catch(() => {});
      } else if (!inRange && !el.paused) {
        el.pause();
      }
    });
  }, [currentFrame, isPlaying, payload]);

  useEffect(() => {
    return () => {
      audioElsRef.current.forEach((el) => el.pause());
      audioElsRef.current.clear();
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-black flex items-center justify-center p-6">
      {!payload ? (
        <div className="text-slate-400 text-sm">No preview data found. Open this page using the editor Preview button.</div>
      ) : compilation.error || !compilation.Component ? (
        <div className="w-full max-w-4xl rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-200 text-sm">
          {compilation.error ?? "Failed to compile preview composition."}
        </div>
      ) : (
        <div className="w-[min(96vw,1400px)]">
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                showCaptions
                  ? "border-blue-500/70 bg-blue-500/20 text-blue-100"
                  : "border-[#1e293b] bg-[#0b1220] text-slate-300 hover:bg-[#12213f]"
              }`}
              onClick={() => setShowCaptions((prev) => !prev)}
              title={showCaptions ? "Hide captions" : "Show captions"}
            >
              Captions: {showCaptions ? "On" : "Off"}
            </button>
          </div>
          <div
            className="max-h-[92vh] overflow-hidden rounded-xl border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.8)]"
            style={{ aspectRatio: `${payload.width} / ${payload.height}` }}
          >
          <Player
            ref={playerRef}
            component={compilation.Component}
            durationInFrames={Math.max(1, payload.durationInFrames)}
            fps={Math.max(1, payload.fps)}
            compositionWidth={Math.max(1, payload.width)}
            compositionHeight={Math.max(1, payload.height)}
            style={{ width: "100%", height: "100%", backgroundColor: "#000" }}
            controls
            autoPlay
            loop
          />
          </div>
        </div>
      )}
    </main>
  );
}
