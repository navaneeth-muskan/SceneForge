---
title: Curved Journey Timeline
impact: HIGH
impactDescription: improves roadmap and life-cycle storytelling with guided path progression
tags: timeline-path, roadmap, journey, life-cycle, milestones, curved-path
---

# Timeline Journey Patterns

Use this when prompts involve roadmaps, historical timelines, life cycles, multi-step processes, or progress journeys over time.

---

## CurvedJourneyTimeline

A curved SVG path draws first, then milestone nodes pop in with year/title labels.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { year: "2023", title: "Idea Born", x: 300, y: 300 },
    { year: "2024", title: "Seed Round", x: 960, y: 200 },
    { year: "2025", title: "Global Launch", x: 1500, y: 500 },
    { year: "2026", title: "IPO", x: 960, y: 800 },
  ];

  const pathDraw = interpolate(frame, [10, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pathLength = 3000;
  const d = "M 300 300 C 600 300, 600 200, 960 200 C 1300 200, 1500 300, 1500 500 C 1500 700, 1300 800, 960 800";

  return (
    <AbsoluteFill style={{ background: "#fafafa", fontFamily: "Inter, sans-serif" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d={d} fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
        <path d={d} fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" strokeDasharray={pathLength} strokeDashoffset={pathLength * (1 - pathDraw)} />
      </svg>

      {steps.map((step, i) => {
        const nodeFrame = Math.max(0, frame - (20 + i * 15));
        const nodePop = spring({ frame: nodeFrame, fps, config: { damping: 12 } });
        return (
          <div key={step.year} style={{ position: "absolute", left: step.x, top: step.y, transform: `translate(-50%, -50%) scale(${nodePop})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "8px solid #3b82f6", boxShadow: "0 10px 20px rgba(59, 130, 246, 0.4)" }} />
            <div style={{ position: "absolute", top: 50, textAlign: "center", width: 220 }}>
              <div style={{ color: "#64748b", fontSize: 24, fontWeight: 700 }}>{step.year}</div>
              <div style={{ color: "#0f172a", fontSize: 32, fontWeight: 900 }}>{step.title}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```
