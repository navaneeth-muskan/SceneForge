"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Copy, GripVertical, Eye, ImageIcon, Trash2, Volume2, Type } from "lucide-react";

interface TimelineLayer {
  id: string;
  label: string;
  start: number;
  end: number;
  canSourceTrim?: boolean;
  sourceTrimBeforePct?: number;
  sourceTrimAfterPct?: number;
  isDiffText?: boolean;
}

interface TimelineEditorProps {
  durationInFrames: number;
  currentFrame: number;
  onSeek: (frame: number) => void;
  zoom?: number;
  visualLayers: TimelineLayer[];
  audioLayers: TimelineLayer[];
  textLayers?: TimelineLayer[];
  selectedVisualLayerId: string | null;
  selectedAudioLayerId: string | null;
  selectedTextLayerId?: string | null;
  onSelectLayer: (track: "visual" | "audio" | "text", id: string) => void;
  onLayerChange: (track: "visual" | "audio" | "text", id: string, start: number, end: number) => void;
  onVisualSourceTrimChange?: (id: string, trimBeforePct: number, trimAfterPct: number) => void;
  onReorderLayers?: (track: "visual" | "audio" | "text", fromIndex: number, toIndex: number) => void;
  onDuplicateLayer?: (track: "visual" | "audio" | "text") => void;
  onDeleteLayer?: (track: "visual" | "audio" | "text") => void;
}

export const TimelineEditor = memo<TimelineEditorProps>(({
  durationInFrames,
  currentFrame,
  onSeek,
  zoom = 1,
  visualLayers,
  audioLayers,
  textLayers = [],
  selectedVisualLayerId,
  selectedAudioLayerId,
  selectedTextLayerId = null,
  onSelectLayer,
  onLayerChange,
  onVisualSourceTrimChange,
  onReorderLayers,
  onDuplicateLayer,
  onDeleteLayer,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const tracksColumnRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    track: "visual" | "audio" | "text";
  } | null>(null);
  const [dragState, setDragState] = useState<{
    track: "visual" | "audio" | "text";
    id: string;
    mode: "move" | "left" | "right" | "source-left" | "source-right";
    offset: number;
    width: number;
    layerStart?: number;
    layerEnd?: number;
    sourceTrimBeforePct?: number;
    sourceTrimAfterPct?: number;
  } | null>(null);
  const [reorderDragState, setReorderDragState] = useState<{
    track: "visual" | "audio" | "text";
    id: string;
    fromIndex: number;
  } | null>(null);

  const totalFrames = Math.max(durationInFrames, 1);
  const playheadPosition = totalFrames
    ? (currentFrame / (totalFrames - 1 || 1)) * 100
    : 0;
  const ticks = [0, 5, 10, 15, 20, 25, 30];

  const getPercentageFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    return rect.width === 0 ? 0 : (relativeX / rect.width) * 100;
  }, []);

  const updateFromClientX = useCallback((clientX: number) => {
    const percentage = getPercentageFromClientX(clientX);
    const frame = Math.round((percentage / 100) * (durationInFrames - 1));
    onSeek(frame);
  }, [durationInFrames, getPercentageFromClientX, onSeek]);

  const handlePointerDownPlayhead: React.PointerEventHandler<HTMLDivElement> = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    setIsScrubbing(true);
    updateFromClientX(e.clientX);
  }, [updateFromClientX]);

  const getReorderTargetFromClientY = useCallback((clientY: number): { track: "visual" | "audio" | "text"; index: number } | null => {
    const el = tracksColumnRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const headerHeight = 32;
    const rowHeight = 56;
    const relativeY = clientY - rect.top - headerHeight;
    if (relativeY < 0) return textLayers.length > 0 ? { track: "text", index: 0 } : visualLayers.length > 0 ? { track: "visual", index: 0 } : audioLayers.length > 0 ? { track: "audio", index: 0 } : null;
    const rowIndex = Math.floor(relativeY / rowHeight);
    if (rowIndex < textLayers.length) return { track: "text", index: Math.min(rowIndex, textLayers.length - 1) };
    if (rowIndex - textLayers.length < visualLayers.length) return { track: "visual", index: Math.min(rowIndex - textLayers.length, visualLayers.length - 1) };
    if (rowIndex - textLayers.length - visualLayers.length < audioLayers.length) return { track: "audio", index: Math.min(rowIndex - textLayers.length - visualLayers.length, audioLayers.length - 1) };
    return textLayers.length > 0 ? { track: "text", index: textLayers.length - 1 } : visualLayers.length > 0 ? { track: "visual", index: visualLayers.length - 1 } : null;
  }, [audioLayers.length, textLayers.length, visualLayers.length]);

  const startReorderDrag = useCallback((track: "visual" | "audio" | "text", id: string, fromIndex: number) => {
    if (!onReorderLayers) return;
    setReorderDragState({ track, id, fromIndex });
  }, [onReorderLayers]);

  useEffect(() => {
    const finalizeDrag = () => {
      setIsScrubbing(false);
      setDragState(null);
      setReorderDragState(null);
    };

    const handleMove = (e: PointerEvent) => {
      if (isScrubbing) {
        updateFromClientX(e.clientX);
        setHoverPosition(getPercentageFromClientX(e.clientX));
        return;
      }

      if (reorderDragState) {
        return;
      }

      if (!dragState) {
        return;
      }

      const percentage = getPercentageFromClientX(e.clientX);
      if (dragState.mode === "source-left" || dragState.mode === "source-right") {
        if (dragState.track !== "visual" || !onVisualSourceTrimChange) {
          return;
        }
        const layers = dragState.track === "visual" ? visualLayers : [];
        const current = layers.find((layer) => layer.id === dragState.id);
        if (!current) return;
        const layerStart = dragState.layerStart ?? current.start;
        const layerEnd = dragState.layerEnd ?? current.end;
        const layerWidth = Math.max(0.0001, layerEnd - layerStart);
        const local = Math.max(0, Math.min(100, ((percentage - layerStart) / layerWidth) * 100));
        const before = dragState.sourceTrimBeforePct ?? current.sourceTrimBeforePct ?? 0;
        const after = dragState.sourceTrimAfterPct ?? current.sourceTrimAfterPct ?? 0;
        if (dragState.mode === "source-left") {
          const nextBefore = Math.min(local, 98 - after);
          onVisualSourceTrimChange(dragState.id, Math.max(0, nextBefore), after);
        } else {
          const nextAfter = Math.min(100 - local, 98 - before);
          onVisualSourceTrimChange(dragState.id, before, Math.max(0, nextAfter));
        }
        return;
      }

      if (dragState.mode === "move") {
        const nextStart = Math.max(0, Math.min(100 - dragState.width, percentage - dragState.offset));
        onLayerChange(dragState.track, dragState.id, nextStart, nextStart + dragState.width);
        return;
      }

      const layers = dragState.track === "visual" ? visualLayers : dragState.track === "audio" ? audioLayers : textLayers;
      const current = layers.find((layer) => layer.id === dragState.id);
      if (!current) return;

      if (dragState.mode === "left") {
        onLayerChange(dragState.track, dragState.id, Math.min(percentage, current.end - 2), current.end);
      } else {
        onLayerChange(dragState.track, dragState.id, current.start, Math.max(percentage, current.start + 2));
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (reorderDragState && onReorderLayers) {
        const target = getReorderTargetFromClientY(e.clientY);
        if (target && target.track === reorderDragState.track && target.index !== reorderDragState.fromIndex) {
          onReorderLayers(reorderDragState.track, reorderDragState.fromIndex, target.index);
        }
      }
      finalizeDrag();
    };

    const handleCancel = () => {
      finalizeDrag();
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleCancel);
    window.addEventListener("blur", handleCancel);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleCancel);
      window.removeEventListener("blur", handleCancel);
    };
  }, [
    audioLayers,
    dragState,
    getPercentageFromClientX,
    getReorderTargetFromClientY,
    isScrubbing,
    onLayerChange,
    onVisualSourceTrimChange,
    onReorderLayers,
    reorderDragState,
    updateFromClientX,
    textLayers,
    visualLayers,
  ]);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener("pointerdown", closeContextMenu);
    return () => window.removeEventListener("pointerdown", closeContextMenu);
  }, []);

  // Auto-scroll the timeline horizontally to keep the playhead visible during playback.
  useEffect(() => {
    const scroll = scrollRef.current;
    const content = containerRef.current;
    if (!scroll || !content || isScrubbing) return;
    const playheadPx = (playheadPosition / 100) * content.scrollWidth;
    const viewLeft = scroll.scrollLeft;
    const viewRight = viewLeft + scroll.clientWidth;
    const margin = scroll.clientWidth * 0.15;
    if (playheadPx > viewRight - margin) {
      scroll.scrollLeft = playheadPx - scroll.clientWidth + margin;
    } else if (playheadPx < viewLeft + margin && viewLeft > 0) {
      scroll.scrollLeft = Math.max(0, playheadPx - margin);
    }
  }, [currentFrame, playheadPosition, isScrubbing]);

  const renderTrack = (
    track: "visual" | "audio" | "text",
    layers: TimelineLayer[],
    selectedId: string | null,
  ) => {
    const isAudio = track === "audio";
    const isText = track === "text";
    const barColor = isText ? "bg-blue-500" : isAudio ? "bg-amber-500" : "bg-emerald-500";
    const barColorDark = isText ? "bg-blue-600/70" : isAudio ? "bg-amber-600/70" : "bg-emerald-600/70";
    const iconColor = isText ? "text-blue-950" : isAudio ? "text-amber-950" : "text-emerald-950";
    return (
      <>
        {layers.map((layer) => {
          const isSelected = selectedId === layer.id;
          const isDiffText = track === "text" && !!layer.isDiffText;
          const beforePct = track === "visual" ? Math.max(0, Math.min(95, layer.sourceTrimBeforePct ?? 0)) : 0;
          const afterPct = track === "visual" ? Math.max(0, Math.min(95, layer.sourceTrimAfterPct ?? 0)) : 0;
          const beforeHandlePct = Math.max(1, beforePct);
          const afterHandlePct = Math.max(1, afterPct);
          const clipDurationFrames = Math.max(1, Math.round(((layer.end - layer.start) / 100) * totalFrames));
          const beforeFrames = Math.max(0, Math.round((beforePct / 100) * clipDurationFrames));
          const afterFrames = Math.max(0, Math.round((afterPct / 100) * clipDurationFrames));
          const editableSourceTrim = track === "visual" && !!layer.canSourceTrim;
          const barTone = isDiffText ? "bg-violet-500" : barColor;
          const barToneDark = isDiffText ? "bg-violet-600/70" : barColorDark;
          const textTone = isDiffText ? "text-violet-950" : iconColor;
          return (
            <div
              key={layer.id}
              className="h-14 border-b border-[#1e293b] shrink-0 relative p-1 bg-[#162032]"
              style={{
                backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px)",
                backgroundSize: "20px 100%",
              }}
            >
              <div
                className={`absolute top-1 bottom-1 flex items-center overflow-hidden rounded-sm shadow-sm ${barTone} ${isSelected ? "ring-2 ring-white/80" : ""}`}
                style={{ left: `${layer.start}%`, right: `${100 - layer.end}%` }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectLayer(track, layer.id);
                  setDragState({
                    track,
                    id: layer.id,
                    mode: "move",
                    offset: getPercentageFromClientX(e.clientX) - layer.start,
                    width: layer.end - layer.start,
                  });
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onSelectLayer(track, layer.id);
                  setContextMenu({ x: e.clientX, y: e.clientY, track });
                }}
              >
                <div
                  className={`flex h-full w-3 shrink-0 items-center justify-center cursor-ew-resize ${barToneDark}`}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectLayer(track, layer.id);
                    setDragState({ track, id: layer.id, mode: "left", offset: 0, width: layer.end - layer.start });
                  }}
                >
                  <div className={`h-3 w-[2px] rounded-full ${isText ? "bg-blue-950/40" : isAudio ? "bg-amber-950/40" : "bg-emerald-950/40"}`} />
                </div>
                <div className="relative flex flex-1 items-center px-2 pointer-events-none">
                  {isText ? (
                    <Type className={"mr-2 h-3.5 w-3.5 shrink-0 " + textTone} />
                  ) : isAudio ? (
                    <Volume2 className={"mr-2 h-3.5 w-3.5 shrink-0 " + textTone} />
                  ) : (
                    <ImageIcon className={"mr-2 h-3.5 w-3.5 shrink-0 " + textTone} />
                  )}
                  <span className={"truncate text-xs font-medium " + textTone}>
                    {isDiffText ? `Δ ${layer.label}` : layer.label}
                  </span>
                </div>
                {editableSourceTrim ? (
                  <>
                    <div className="pointer-events-none absolute inset-y-0 left-0 bg-black/20" style={{ width: `${beforePct}%` }} />
                    <div className="pointer-events-none absolute inset-y-0 right-0 bg-black/20" style={{ width: `${afterPct}%` }} />
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white/90 cursor-ew-resize"
                      style={{ left: `calc(${beforeHandlePct}% - 2px)` }}
                      title={`Source trim before: ${beforeFrames} frame${beforeFrames === 1 ? "" : "s"}`}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectLayer(track, layer.id);
                        setDragState({
                          track,
                          id: layer.id,
                          mode: "source-left",
                          offset: 0,
                          width: layer.end - layer.start,
                          layerStart: layer.start,
                          layerEnd: layer.end,
                          sourceTrimBeforePct: beforePct,
                          sourceTrimAfterPct: afterPct,
                        });
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-white/90 cursor-ew-resize"
                      style={{ right: `calc(${afterHandlePct}% - 2px)` }}
                      title={`Source trim after: ${afterFrames} frame${afterFrames === 1 ? "" : "s"}`}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        onSelectLayer(track, layer.id);
                        setDragState({
                          track,
                          id: layer.id,
                          mode: "source-right",
                          offset: 0,
                          width: layer.end - layer.start,
                          layerStart: layer.start,
                          layerEnd: layer.end,
                          sourceTrimBeforePct: beforePct,
                          sourceTrimAfterPct: afterPct,
                        });
                      }}
                    />
                  </>
                ) : null}
                <div
                  className={`flex h-full w-3 shrink-0 items-center justify-center cursor-ew-resize ${barToneDark}`}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectLayer(track, layer.id);
                    setDragState({ track, id: layer.id, mode: "right", offset: 0, width: layer.end - layer.start });
                  }}
                >
                  <div className={`h-3 w-[2px] rounded-full ${isText ? "bg-blue-950/40" : isAudio ? "bg-amber-950/40" : "bg-emerald-950/40"}`} />
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300 relative">
      <div className="flex-1 flex overflow-hidden">
        <div
          ref={tracksColumnRef}
          className={`w-[100px] flex flex-col shrink-0 border-r border-[#1e293b] bg-[#0f172a] z-20 ${reorderDragState ? "cursor-grabbing" : ""}`}
        >
          <div className="h-8 border-b border-[#1e293b] shrink-0" />
          {textLayers.map((layer, index) => (
            <div
              key={layer.id}
              className={`h-14 border-b border-[#1e293b] shrink-0 flex items-center justify-between px-2 group ${reorderDragState?.track === "text" && reorderDragState?.id === layer.id ? "opacity-60 bg-[#1e293b]/50" : ""}`}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                onSelectLayer("text", layer.id);
                if (!onReorderLayers) return;
                const target = e.target as HTMLElement;
                const onHandle = !!target.closest('[data-reorder-handle="true"]');
                if (!onHandle) return;
                startReorderDrag("text", layer.id, index);
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <GripVertical data-reorder-handle="true" className={`w-3.5 h-3.5 shrink-0 ${reorderDragState ? "cursor-grabbing" : "cursor-grab text-slate-500"}`} />
                <span className="text-xs text-slate-300 truncate">{layer.label}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          ))}
          {visualLayers.map((layer, index) => (
            <div
              key={layer.id}
              className={`h-14 border-b border-[#1e293b] shrink-0 flex items-center justify-between px-2 group ${reorderDragState?.track === "visual" && reorderDragState?.id === layer.id ? "opacity-60 bg-[#1e293b]/50" : ""}`}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                onSelectLayer("visual", layer.id);
                if (!onReorderLayers) return;
                const target = e.target as HTMLElement;
                const onHandle = !!target.closest('[data-reorder-handle="true"]');
                if (!onHandle) return;
                startReorderDrag("visual", layer.id, index);
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <GripVertical data-reorder-handle="true" className={`w-3.5 h-3.5 shrink-0 ${reorderDragState ? "cursor-grabbing" : "cursor-grab text-slate-500"}`} />
                <span className="text-xs text-slate-300 truncate">{layer.label}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          ))}
          {audioLayers.map((layer, index) => (
            <div
              key={layer.id}
              className={`h-14 border-b border-[#1e293b] shrink-0 flex items-center justify-between px-2 group ${reorderDragState?.track === "audio" && reorderDragState?.id === layer.id ? "opacity-60 bg-[#1e293b]/50" : ""}`}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                onSelectLayer("audio", layer.id);
                if (!onReorderLayers) return;
                const target = e.target as HTMLElement;
                const onHandle = !!target.closest('[data-reorder-handle="true"]');
                if (!onHandle) return;
                startReorderDrag("audio", layer.id, index);
              }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <GripVertical data-reorder-handle="true" className={`w-3.5 h-3.5 shrink-0 ${reorderDragState ? "cursor-grabbing" : "cursor-grab text-slate-500"}`} />
                <span className="text-xs text-slate-300 truncate">{layer.label}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          ))}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <div
            className={`flex flex-col relative min-h-full ${isScrubbing ? "cursor-pointer" : "cursor-default"}`}
            style={{ width: `${zoom * 100}%`, minWidth: "100%" }}
            ref={containerRef}
            onPointerMove={(e) => {
              if (!isScrubbing && !dragState) {
                setHoverPosition(getPercentageFromClientX(e.clientX));
              }
            }}
            onPointerLeave={() => {
              if (!isScrubbing && !dragState) {
                setHoverPosition(null);
              }
            }}
            onPointerDown={handlePointerDownPlayhead}
          >
            <div
              className="h-8 border-b border-[#1e293b] relative shrink-0 bg-[#162032]"
              style={{ backgroundImage: "linear-gradient(to right, #1e293b 1px, transparent 1px)", backgroundSize: "20px 100%" }}
            >
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute flex flex-col items-center top-0 bottom-0 text-[10px] text-slate-400 pointer-events-none"
                  style={{ left: `${(t / 30) * 100}%`, transform: "translateX(-50%)" }}
                >
                  <div className="h-2 w-px bg-slate-500 mb-1" />
                  <span>{t}s</span>
                </div>
              ))}
            </div>

            {renderTrack("text", textLayers, selectedTextLayerId ?? null)}
            {renderTrack("visual", visualLayers, selectedVisualLayerId)}
            {renderTrack("audio", audioLayers, selectedAudioLayerId)}

            {visualLayers.length === 0 && audioLayers.length === 0 && textLayers.length === 0 ? (
              <div className="pointer-events-none absolute inset-x-0 top-8 bottom-0 flex items-center justify-center">
                <div className="rounded-xl border border-dashed border-[#334155] bg-[#0f172a]/82 px-6 py-4 text-center shadow-[0_12px_40px_rgba(2,6,23,0.35)] backdrop-blur-sm">
                  <p className="text-sm font-medium text-slate-200">Layers are empty</p>
                  <p className="mt-1 text-xs text-slate-400">Please create a layer, image, video, or gif</p>
                </div>
              </div>
            ) : null}

            <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-30">
              {hoverPosition !== null && !isScrubbing && !dragState ? (
                <div className="absolute top-0 bottom-0 w-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ left: `${hoverPosition}%` }}>
                  <div className="absolute top-0 -left-[4px] w-2.5 h-3 bg-blue-500 rounded-b-sm" />
                </div>
              ) : null}
              <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ left: `${playheadPosition}%` }}>
                <div className="absolute top-0 -left-[4px] w-2.5 h-3 bg-red-500 rounded-b-sm" />
              </div>
            </div>

            {contextMenu ? (
              <div className="fixed z-[100] min-w-44 overflow-hidden rounded-lg border border-[#2a3b55] bg-[#0b1730] shadow-2xl" style={{ left: contextMenu.x, top: contextMenu.y }}>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-[#132544]"
                  onClick={() => {
                    onDuplicateLayer?.(contextMenu.track);
                    setContextMenu(null);
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-400 hover:bg-[#132544]"
                  onClick={() => {
                    onDeleteLayer?.(contextMenu.track);
                    setContextMenu(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
});

TimelineEditor.displayName = "TimelineEditor";
