import type { RemotionExample } from "./index";

export const kineticTextCode = `
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const LINES = [
    { words: ["Think"], color: "#ffffff", size: 140 },
    { words: ["Different."], color: "#6366f1", size: 140 },
    { words: ["Act", "Boldly."], color: "#ffffff", size: 96 },
    { words: ["Move", "Fast."], color: "#3b82f6", size: 96 },
  ];

  const STAGGER_PER_WORD = 8;
  const LINE_STAGGER = 10;

  let globalWordIndex = 0;
  const wordTimings: { lineIndex: number; wordIndex: number; startFrame: number; word: string; color: string; size: number }[] = [];

  LINES.forEach((line, li) => {
    line.words.forEach((word, wi) => {
      wordTimings.push({
        lineIndex: li,
        wordIndex: wi,
        startFrame: li * LINE_STAGGER + globalWordIndex * STAGGER_PER_WORD,
        word,
        color: line.color,
        size: line.size,
      });
      globalWordIndex++;
    });
  });

  const globalOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames - 5],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0a0a0a 0%, #0d1117 50%, #0a0a0a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingLeft: 160,
        opacity: globalOpacity,
        overflow: "hidden",
      }}
    >
      {/* Background texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(0deg, transparent 24%, rgba(255,255,255,.02) 25%, rgba(255,255,255,.02) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.02) 75%, rgba(255,255,255,.02) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.02) 25%, rgba(255,255,255,.02) 26%, transparent 27%)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Word by word entrance */}
      {LINES.map((line, li) => (
        <div
          key={li}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            marginBottom: li === 1 ? 32 : 16,
            alignItems: "flex-end",
          }}
        >
          {line.words.map((word, wi) => {
            const entry = wordTimings.find((t) => t.lineIndex === li && t.wordIndex === wi)!;
            const wordFrame = frame - entry.startFrame;
            const entrance = spring({
              frame: wordFrame,
              fps,
              config: { damping: 10, stiffness: 180 },
            });
            const opacity = interpolate(wordFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
            const blur = interpolate(wordFrame, [0, 12], [8, 0], { extrapolateRight: "clamp" });

            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  opacity,
                  filter: \`blur(\${blur}px)\`,
                  transform: \`translateY(\${(1 - entrance) * 80}px) scale(\${0.6 + entrance * 0.4})\`,
                  fontSize: line.size,
                  fontWeight: 900,
                  color: line.color,
                  letterSpacing: "-2px",
                  lineHeight: 1,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </AbsoluteFill>
  );
};
`;

export const kineticTextExample: RemotionExample = {
  id: "kinetic-text",
  name: "Kinetic Text",
  description: "Word-by-word kinetic typography with spring physics, blur entrance and staggered timing",
  code: kineticTextCode,
  durationInFrames: 120,
  fps: 30,
  category: "Text",
};
