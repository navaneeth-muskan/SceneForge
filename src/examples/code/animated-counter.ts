import type { RemotionExample } from "./index";

export const animatedCounterCode = `
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const STATS = [
    { target: 2847, suffix: "+", label: "ACTIVE USERS", color: "#3b82f6" },
    { target: 98.7, suffix: "%", label: "UPTIME SLA", color: "#10b981", decimals: 1 },
    { target: 142, suffix: "ms", label: "AVG RESPONSE", color: "#f59e0b" },
  ];

  const containerEntrance = spring({ frame, fps, config: { damping: 18, stiffness: 100 } });
  const bgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #050505 0%, #0d0d1a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 80,
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 400,
          background: "radial-gradient(ellipse, #1e3a5f40 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: bgOpacity,
        }}
      />

      {/* Header label */}
      <div
        style={{
          opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" }),
          fontSize: 22,
          fontWeight: 600,
          color: "#475569",
          letterSpacing: 8,
          textAlign: "center",
          position: "absolute",
          top: 120,
        }}
      >
        PLATFORM METRICS
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 120,
          alignItems: "flex-end",
          opacity: containerEntrance,
          transform: \`translateY(\${(1 - containerEntrance) * 40}px)\`,
        }}
      >
        {STATS.map((stat, i) => {
          const staggeredFrame = frame - i * 12;
          const countProgress = spring({
            frame: staggeredFrame,
            fps,
            from: 0,
            to: 1,
            config: { damping: 22, stiffness: 50 },
          });
          const labelOpacity = interpolate(staggeredFrame, [10, 25], [0, 1], {
            extrapolateRight: "clamp",
          });

          const rawValue = countProgress * stat.target;
          const displayValue = stat.decimals
            ? rawValue.toFixed(stat.decimals)
            : Math.round(rawValue).toLocaleString();

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              {/* Number */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 120,
                    fontWeight: 900,
                    color: stat.color,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {displayValue}
                </span>
                <span
                  style={{
                    fontSize: 60,
                    fontWeight: 700,
                    color: stat.color,
                    opacity: 0.8,
                  }}
                >
                  {stat.suffix}
                </span>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: interpolate(staggeredFrame, [15, 30], [0, 160], { extrapolateRight: "clamp" }),
                  height: 2,
                  backgroundColor: stat.color,
                  opacity: 0.4,
                  borderRadius: 1,
                }}
              />

              {/* Label */}
              <div
                style={{
                  opacity: labelOpacity,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#64748b",
                  letterSpacing: 4,
                  textAlign: "center",
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
`;

export const animatedCounterExample: RemotionExample = {
  id: "animated-counter",
  name: "Animated Counter",
  description: "Multi-stat counting animation with spring easing — great for dashboards, metrics, product stats",
  code: animatedCounterCode,
  durationInFrames: 120,
  fps: 30,
  category: "Animation",
};
