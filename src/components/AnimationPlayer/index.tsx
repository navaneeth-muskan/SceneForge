"use client";

import { Player, type ErrorFallback, type PlayerRef } from "@remotion/player";
import React, { useEffect, useRef } from "react";
import { ErrorDisplay, type ErrorType } from "../ErrorDisplay";

const errorTitles: Record<ErrorType, string> = {
  validation: "Invalid Prompt",
  api: "API Error",
  compilation: "Compilation Error",
};

const renderErrorFallback: ErrorFallback = ({ error }) => {
  return (
    <ErrorDisplay
      error={error.message || "An error occurred while rendering"}
      title="Runtime Error"
      variant="fullscreen"
      size="lg"
    />
  );
};

interface AnimationPlayerProps {
  Component: React.ComponentType | null;
  durationInFrames: number;
  fps: number;
  compositionWidth?: number;
  compositionHeight?: number;
  onDurationChange: (duration: number) => void;
  onFpsChange: (fps: number) => void;
  isCompiling: boolean;
  isStreaming: boolean;
  error: string | null;
  errorType?: ErrorType;
  code: string;
  onRuntimeError?: (error: string) => void;
  onFrameChange?: (frame: number) => void;
  playerRef?: React.RefObject<PlayerRef>;
}

export const AnimationPlayer: React.FC<AnimationPlayerProps> = ({
  Component,
  durationInFrames,
  fps,
  compositionWidth = 1920,
  compositionHeight = 1080,
  onDurationChange,
  onFpsChange,
  isCompiling,
  isStreaming,
  error,
  errorType = "compilation",
  code,
  onRuntimeError,
  onFrameChange,
  playerRef: externalPlayerRef,
}) => {
  const internalPlayerRef = useRef<PlayerRef>(null);
  const playerRef = externalPlayerRef ?? internalPlayerRef;
  const lastReportedFrameRef = useRef<number | null>(null);

  // Listen for runtime errors from the Player's error boundary.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !onRuntimeError) return;

    const handleError = (e: { detail: { error: Error } }) => {
      onRuntimeError(e.detail.error.message);
    };

    player.addEventListener("error", handleError);
    return () => {
      player.removeEventListener("error", handleError);
    };
  }, [onRuntimeError, Component]);

  // Listen for frame changes and report to parent.
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !onFrameChange) return;

    // Ensure first frame event after a new component mount is never skipped.
    lastReportedFrameRef.current = null;

    const handleFrameUpdate = (e: { detail: { frame: number } }) => {
      const frame = e.detail.frame;
      if (lastReportedFrameRef.current === frame) return;
      lastReportedFrameRef.current = frame;
      onFrameChange(frame);
    };

    player.addEventListener("frameupdate", handleFrameUpdate);
    return () => {
      player.removeEventListener("frameupdate", handleFrameUpdate);
    };
  }, [onFrameChange, Component]);

  const renderContent = () => {
    if (isStreaming) {
      return (
        <div className="w-full aspect-video max-h-[calc(100%-80px)] flex flex-col justify-center items-center gap-4 bg-background-elevated rounded-lg overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">
            Waiting for code generation to finish...
          </p>
        </div>
      );
    }

    if (isCompiling) {
      return (
        <div className="w-full aspect-video max-h-[calc(100%-80px)] flex justify-center items-center bg-background-elevated rounded-lg overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <ErrorDisplay
          error={error}
          title={errorTitles[errorType]}
          variant="fullscreen"
          size="lg"
        />
      );
    }

    if (!Component) {
      return (
        <div className="w-full aspect-video max-h-[calc(100%-80px)] flex justify-center items-center bg-background-elevated rounded-lg overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)] text-muted-foreground-dim text-lg font-sans">
          Select an example to get started
        </div>
      );
    }

    return (
      <div className="w-full h-full rounded-lg overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <Player
          ref={playerRef}
          key="editor-player"
          component={Component}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionHeight={compositionHeight}
          compositionWidth={compositionWidth}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
          controls={false}
          autoPlay={false}
          loop={false}
          errorFallback={renderErrorFallback}
          spaceKeyToPlayOrPause={false}
          clickToPlay={false}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col bg-background min-w-0 h-full">
      <div className="w-full h-full flex flex-col">{renderContent()}</div>
    </div>
  );
};
