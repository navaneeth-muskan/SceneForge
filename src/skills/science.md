---
title: Science Microscope & Labeling
impact: HIGH
impactDescription: improves biology and technical explainers with zoom + labeled callouts
tags: science, biology, microscope, magnify, diagram, label, education
---

# Science Explainer Patterns

Use this when prompts mention biology, microscope views, scientific structures, engineering internals, or deep-dive technical labeling.

---

## MicroscopeZoomLabeler

Magnifying lens expands over a subject, reveals zoomed detail, then draws callout labels.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const lensSpring = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const lensSize = interpolate(lensSpring, [0, 1], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelSpring = spring({ frame: frame - 45, fps, config: { damping: 18 } });

  const targetX = width / 2;
  const targetY = height / 2;
  const zoomLevel = 2.5;
  const labelX = interpolate(labelSpring, [0, 1], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#020617", fontFamily: "Inter, sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 200, height: 200, background: "radial-gradient(circle, #22c55e, #14532d)", borderRadius: "40% 60% 70% 30%", filter: "blur(10px)" }} />
      </div>

      <div style={{ position: "absolute", left: targetX - lensSize / 2, top: targetY - lensSize / 2, width: lensSize, height: lensSize, borderRadius: "50%", border: "4px solid #4ade80", boxShadow: "0 0 60px rgba(74, 222, 128, 0.4), inset 0 0 40px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 200 * zoomLevel, height: 200 * zoomLevel, background: "radial-gradient(circle, #22c55e, #14532d)", borderRadius: "40% 60% 70% 30%", filter: "blur(4px)" }}>
          <div style={{ width: 80, height: 40, background: "#bef264", borderRadius: 20, margin: "150px 0 0 100px" }} />
          <div style={{ width: 120, height: 120, background: "#166534", borderRadius: "50%", margin: "-20px 0 0 300px" }} />
        </div>
      </div>

      <div style={{ position: "absolute", inset: 0, opacity: labelSpring }}>
        <svg style={{ width: "100%", height: "100%", position: "absolute" }}>
          <polyline points={`${targetX + 150},${targetY - 50} ${targetX + 300},${targetY - 150} ${targetX + 500},${targetY - 150}`} fill="none" stroke="#4ade80" strokeWidth="3" />
        </svg>
        <div style={{ position: "absolute", left: targetX + 520, top: targetY - 180, color: "#4ade80", transform: `translateX(${labelX}px)` }}>
          <div style={{ fontSize: 36, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}>Chloroplast</div>
          <div style={{ fontSize: 26, color: "#a3e635", marginTop: 8 }}>Conducts photosynthesis</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```
