import type { RemotionExample } from "./index";

export const gradientBgCode = `
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Slowly shifting gradient angle
  const angle = interpolate(frame, [0, durationInFrames], [120, 280], { extrapolateRight: "clamp" });

  // Hue shift over time for the gradient colors
  const hue1 = interpolate(frame, [0, durationInFrames], [230, 270], { extrapolateRight: "clamp" });
  const hue2 = interpolate(frame, [0, durationInFrames], [260, 300], { extrapolateRight: "clamp" });
  const hue3 = interpolate(frame, [0, durationInFrames], [200, 240], { extrapolateRight: "clamp" });

  // Floating orb positions
  const orb1Y = Math.sin(frame * 0.02) * 80;
  const orb2Y = Math.cos(frame * 0.015) * 100;
  const orb1X = Math.cos(frame * 0.018) * 60;

  // Text entrance
  const textEntrance = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 120 } });
  const subEntrance = spring({ frame: frame - 25, fps, config: { damping: 16, stiffness: 100 } });

  return (
    <AbsoluteFill
      style={{
        background: \`linear-gradient(\${angle}deg, hsl(\${hue1}, 60%, 12%) 0%, hsl(\${hue2}, 55%, 18%) 50%, hsl(\${hue3}, 70%, 8%) 100%)\`,
        overflow: "hidden",
      }}
    >
      {/* Floating orb 1 */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: \`radial-gradient(circle, hsla(\${hue1}, 70%, 45%, 0.15) 0%, transparent 70%)\`,
          top: \`calc(30% + \${orb1Y}px)\`,
          left: \`calc(20% + \${orb1X}px)\`,
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
        }}
      />

      {/* Floating orb 2 */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: \`radial-gradient(circle, hsla(\${hue2}, 60%, 50%, 0.12) 0%, transparent 70%)\`,
          top: \`calc(65% + \${orb2Y}px)\`,
          right: "15%",
          transform: "translate(50%, -50%)",
          filter: "blur(50px)",
        }}
      />

      {/* Noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: \`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")\`,
          backgroundSize: "200px 200px",
          opacity: 0.6,
        }}
      />

      {/* Center content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 20,
        }}
      >
        <div
          style={{
            opacity: textEntrance,
            transform: \`scale(\${0.85 + textEntrance * 0.15}) translateY(\${(1 - textEntrance) * 40}px)\`,
            fontSize: 100,
            fontWeight: 900,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            letterSpacing: "-3px",
          }}
        >
          Gradient
        </div>
        <div
          style={{
            opacity: subEntrance,
            transform: \`translateY(\${(1 - subEntrance) * 20}px)\`,
            fontSize: 40,
            fontWeight: 300,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            letterSpacing: "4px",
          }}
        >
          ANIMATED BACKGROUND
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;

export const gradientBgExample: RemotionExample = {
  id: "gradient-bg",
  name: "Animated Gradient Background",
  description: "Smoothly animating gradient background with floating orbs, hue shifts and atmospheric depth",
  code: gradientBgCode,
  durationInFrames: 180,
  fps: 30,
  category: "Animation",
};
