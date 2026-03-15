import type { RemotionExample } from "./index";

export const titleCardCode = `
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleEntrance = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const subtitleEntrance = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 120 } });
  const lineEntrance = spring({ frame: frame - 6, fps, config: { damping: 16, stiffness: 200 } });

  const bgAngle = interpolate(frame, [0, durationInFrames], [120, 240], { extrapolateRight: "clamp" });
  const particleOp = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const TITLE = "The Future";
  const SUBTITLE = "Is Already Here";
  const TAGLINE = "PRODUCT LAUNCH 2026";

  return (
    <AbsoluteFill
      style={{
        background: \`linear-gradient(\${bgAngle}deg, #0f0c29 0%, #302b63 50%, #24243e 100%)\`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow circles */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, #6366f130 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: particleOp,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, #3b82f620 0%, transparent 70%)",
          top: "30%",
          left: "60%",
          opacity: particleOp * 0.7,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          opacity: subtitleEntrance,
          transform: \`translateY(\${(1 - subtitleEntrance) * 20}px)\`,
          fontSize: 18,
          fontWeight: 600,
          color: "#6366f1",
          letterSpacing: 8,
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        {TAGLINE}
      </div>

      {/* Main title */}
      <div
        style={{
          opacity: titleEntrance,
          transform: \`scale(\${0.7 + titleEntrance * 0.3}) translateY(\${(1 - titleEntrance) * 60}px)\`,
          fontSize: 132,
          fontWeight: 900,
          color: "#ffffff",
          textAlign: "center",
          letterSpacing: "-4px",
          lineHeight: 0.9,
        }}
      >
        {TITLE}
      </div>

      {/* Separator line */}
      <div
        style={{
          width: \`\${lineEntrance * 320}px\`,
          height: 3,
          background: "linear-gradient(90deg, transparent, #6366f1, #3b82f6, transparent)",
          margin: "28px 0",
          borderRadius: 2,
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleEntrance,
          transform: \`translateY(\${(1 - subtitleEntrance) * 30}px)\`,
          fontSize: 64,
          fontWeight: 300,
          color: "#94a3b8",
          letterSpacing: "2px",
          textAlign: "center",
        }}
      >
        {SUBTITLE}
      </div>
    </AbsoluteFill>
  );
};
`;

export const titleCardExample: RemotionExample = {
  id: "title-card",
  name: "Title Card",
  description: "Cinematic full-screen hero title with animated gradient background, glow effects and spring entrances",
  code: titleCardCode,
  durationInFrames: 150,
  fps: 30,
  category: "Text",
};
