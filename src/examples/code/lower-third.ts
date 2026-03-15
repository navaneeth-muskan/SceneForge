import type { RemotionExample } from "./index";

export const lowerThirdCode = `
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barScale = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const textOpacity = interpolate(frame, [8, 22], [0, 1], { extrapolateRight: "clamp" });
  const slideX = interpolate(frame, [0, 14], [-50, 0], { extrapolateRight: "clamp" });

  // Exit animation in last 20 frames
  const exitOpacity = interpolate(frame, [70, 85], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ACCENT_COLOR = "#3b82f6";
  const NAME = "Alexandra Chen";
  const TITLE = "Chief Product Officer";

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Decorative background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, #ffffff08 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Center content for context */}
      <div style={{ color: "#fff", fontSize: 48, fontWeight: 300, opacity: 0.15, letterSpacing: 8 }}>
        INTERVIEW
      </div>

      {/* Lower Third container */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          left: 100,
          opacity: exitOpacity,
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: \`\${barScale * 260}px\`,
            height: 5,
            backgroundColor: ACCENT_COLOR,
            borderRadius: 3,
            marginBottom: 12,
            boxShadow: \`0 0 20px \${ACCENT_COLOR}80\`,
          }}
        />

        {/* Name and Title */}
        <div
          style={{
            opacity: textOpacity,
            transform: \`translateX(\${slideX}px)\`,
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}
          >
            {NAME}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#94a3b8",
              marginTop: 6,
              fontWeight: 400,
              letterSpacing: "0.5px",
            }}
          >
            {TITLE}
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            width: \`\${barScale * 180}px\`,
            height: 1,
            backgroundColor: "#ffffff20",
            marginTop: 14,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
`;

export const lowerThirdExample: RemotionExample = {
  id: "lower-third",
  name: "Lower Third",
  description: "Broadcast-style animated name/title overlay with slide-in accent bar and exit animation",
  code: lowerThirdCode,
  durationInFrames: 90,
  fps: 30,
  category: "Text",
};
