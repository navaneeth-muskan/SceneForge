"use client";

import { useEffect, useRef, useState } from "react";
import { MousePointer2, Send, X } from "lucide-react";

interface DrawBox {
  xmin: number;
  ymin: number;
  width: number;
  height: number;
  /** [ymin, xmin, ymax, xmax] normalised 0-100 */
  bbox: [number, number, number, number];
}

export interface AnnotationOverlayProps {
  /** Fired when the user submits a box + optional query */
  onSubmit: (bbox: [number, number, number, number], query: string) => void;
  /** Called when the user presses Escape or clicks the close button */
  onCancel: () => void;
  /** Whether the AI is currently processing the request */
  isLoading?: boolean;
}

export function AnnotationOverlay({ onSubmit, onCancel, isLoading = false }: AnnotationOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const [completedBox, setCompletedBox] = useState<DrawBox | null>(null);
  const [query, setQuery] = useState("");

  // Focus the text input once it appears
  useEffect(() => {
    if (completedBox && inputRef.current) {
      inputRef.current.focus();
    }
  }, [completedBox]);

  const toRelative = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (completedBox || isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = toRelative(e.clientX, e.clientY);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!startPos || completedBox || isLoading) return;
    e.preventDefault();
    setCurrentPos(toRelative(e.clientX, e.clientY));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (completedBox || isLoading) return;
    if (!startPos || !currentPos) return;
    e.preventDefault();

    const xmin = Math.min(startPos.x, currentPos.x);
    const xmax = Math.max(startPos.x, currentPos.x);
    const ymin = Math.min(startPos.y, currentPos.y);
    const ymax = Math.max(startPos.y, currentPos.y);

    if (xmax - xmin > 0.015 && ymax - ymin > 0.015) {
      setCompletedBox({
        xmin, ymin,
        width: xmax - xmin,
        height: ymax - ymin,
        bbox: [ymin * 100, xmin * 100, ymax * 100, xmax * 100],
      });
    }
    setStartPos(null);
    setCurrentPos(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!completedBox || isLoading) return;
    onSubmit(completedBox.bbox, query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      if (completedBox) {
        setCompletedBox(null);
        setQuery("");
      } else {
        onCancel();
      }
    }
  };

  // Determine where to show the floating input (below the box, flipped if near bottom)
  const inputPosition = completedBox
    ? {
        left: `${completedBox.xmin * 100}%`,
        top: completedBox.ymin + completedBox.height > 0.8
          ? `${completedBox.ymin * 100 - 2}%`
          : `${(completedBox.ymin + completedBox.height) * 100 + 1.5}%`,
      }
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-50 outline-none select-none ${
        isLoading
          ? "cursor-wait"
          : completedBox
          ? "cursor-default"
          : "cursor-crosshair"
      }`}
      style={{ pointerEvents: "auto" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Cancel button */}
      <button
        type="button"
        className="absolute top-2 right-2 z-[60] p-1.5 bg-black/70 border border-white/20 rounded-full text-white hover:bg-black/90 transition-colors"
        onMouseDown={(e) => { e.stopPropagation(); onCancel(); }}
        title="Cancel (Esc)"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Guide hint */}
      {!completedBox && !isLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border border-white/20 backdrop-blur pointer-events-none z-[60]">
          <MousePointer2 className="w-3 h-3 text-blue-400 shrink-0" />
          Drag to draw a box around the region you want to analyze
          <span className="text-slate-400 border-l border-white/20 pl-2 ml-1">Esc to cancel</span>
        </div>
      )}

      {/* Loading hint */}
      {isLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 border border-white/20 backdrop-blur pointer-events-none z-[60]">
          <svg className="w-3 h-3 animate-spin text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" className="opacity-75" />
          </svg>
          Analyzing region…
        </div>
      )}

      {/* Live drawing box */}
      {startPos && currentPos && (
        <div
          className="absolute border-2 border-blue-400 bg-blue-500/15 pointer-events-none"
          style={{
            left: `${Math.min(startPos.x, currentPos.x) * 100}%`,
            top: `${Math.min(startPos.y, currentPos.y) * 100}%`,
            width: `${Math.abs(currentPos.x - startPos.x) * 100}%`,
            height: `${Math.abs(currentPos.y - startPos.y) * 100}%`,
          }}
        />
      )}

      {/* Completed box */}
      {completedBox && !isLoading && (
        <div
          className="absolute border-2 border-fuchsia-400 bg-fuchsia-500/15 shadow-[0_0_18px_rgba(217,70,239,0.35)] pointer-events-none"
          style={{
            left: `${completedBox.xmin * 100}%`,
            top: `${completedBox.ymin * 100}%`,
            width: `${completedBox.width * 100}%`,
            height: `${completedBox.height * 100}%`,
          }}
        />
      )}

      {/* Completed box during loading */}
      {completedBox && isLoading && (
        <div
          className="absolute border-2 border-fuchsia-400/60 bg-fuchsia-500/10 pointer-events-none animate-pulse"
          style={{
            left: `${completedBox.xmin * 100}%`,
            top: `${completedBox.ymin * 100}%`,
            width: `${completedBox.width * 100}%`,
            height: `${completedBox.height * 100}%`,
          }}
        />
      )}

      {/* Floating query input — appears below/above the drawn box */}
      {completedBox && !isLoading && inputPosition && (
        <div
          className="absolute z-[60] min-w-[220px] max-w-[300px]"
          style={inputPosition}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <form
            onSubmit={handleSubmit}
            className="bg-black/85 backdrop-blur-md border border-fuchsia-500/40 rounded-lg p-1.5 shadow-2xl flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to know?"
              className="bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none w-44 px-1.5"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setCompletedBox(null);
                  setQuery("");
                }
              }}
            />
            <button
              type="button"
              title="Redraw"
              className="p-1 text-slate-400 hover:text-white transition-colors shrink-0"
              onClick={() => { setCompletedBox(null); setQuery(""); }}
            >
              <X className="w-3 h-3" />
            </button>
            <button
              type="submit"
              className="p-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded transition-colors shrink-0"
              title="Analyze region"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
