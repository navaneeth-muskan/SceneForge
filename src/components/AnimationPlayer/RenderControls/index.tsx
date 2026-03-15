"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { RenderBackend, useRendering } from "../../../helpers/use-rendering";
import { DownloadButton } from "./DownloadButton";
import { ErrorComp } from "./Error";
import { ProgressBar } from "./ProgressBar";

const getDefaultBackend = (): RenderBackend => {
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_DEFAULT_RENDER_BACKEND === "renderServer"
  ) {
    return "renderServer";
  }

  return "lambda";
};

export const RenderControls: React.FC<{
  code: string;
  durationInFrames: number;
  fps: number;
}> = ({ code, durationInFrames, fps }) => {
  const [backend, setBackend] = useState<RenderBackend>(getDefaultBackend);
  const { renderMedia, state, undo } = useRendering(
    {
      code,
      durationInFrames,
      fps,
    },
    backend,
  );
  const previousPropsRef = useRef({ code, durationInFrames, fps });

  // Reset rendering state when code, duration, or fps changes
  useEffect(() => {
    const prev = previousPropsRef.current;
    const hasChanged =
      prev.code !== code ||
      prev.durationInFrames !== durationInFrames ||
      prev.fps !== fps;

    if (hasChanged && state.status !== "init") {
      undo();
    }
    previousPropsRef.current = { code, durationInFrames, fps };
  }, [code, durationInFrames, fps, state.status, undo]);

  const showPrimaryButton =
    state.status === "init" ||
    state.status === "invoking" ||
    state.status === "error";

  if (showPrimaryButton) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 text-xs">
          <span className="text-muted-foreground">Render using:</span>
          <div className="inline-flex rounded-md border p-0.5 bg-background">
            <Button
              type="button"
              variant={backend === "lambda" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBackend("lambda")}
            >
              Lambda
            </Button>
            <Button
              type="button"
              variant={backend === "renderServer" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBackend("renderServer")}
            >
              Render server
            </Button>
          </div>
        </div>
        <div>
          <Button
            disabled={state.status === "invoking" || !code}
            loading={state.status === "invoking"}
            onClick={renderMedia}
          >
            <Download className="w-4 h-4 mr-2" />
            {state.status === "invoking"
              ? "Starting render..."
              : "Render & Download"}
          </Button>
          {state.status === "error" && (
            <ErrorComp message={state.error.message} />
          )}
        </div>
      </div>
    );
  }

  if (state.status === "rendering") {
    return <ProgressBar progress={state.progress} />;
  }

  if (state.status === "done") {
    return <DownloadButton state={state} undo={undo} />;
  }

  return null;
};
