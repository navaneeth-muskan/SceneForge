---
title: Bento Grid Reveal
impact: HIGH
impactDescription: improves feature-summary scenes with modern asymmetrical card layouts
tags: bento-grid, cards, feature-summary, saas, ui, apple-style
---

# Bento Grid Patterns

Use this when prompts mention feature cards, asymmetrical grids, product capabilities, SaaS overviews, or Apple-style section reveals.

---

## BentoGridReveal

Staggered spring reveal of asymmetrical rounded cards in a 3-column bento layout.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxes = [
    { colSpan: 2, rowSpan: 1, bg: "#3b82f6", title: "Lighting Fast", icon: "⚡" },
    { colSpan: 1, rowSpan: 2, bg: "#10b981", title: "Secure", icon: "🔒" },
    { colSpan: 1, rowSpan: 1, bg: "#f59e0b", title: "Smart", icon: "🧠" },
    { colSpan: 1, rowSpan: 1, bg: "#8b5cf6", title: "Cloud", icon: "☁" },
  ];

  return (
    <AbsoluteFill style={{ background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 300px)", gridTemplateRows: "repeat(2, 250px)", gap: 24 }}>
        {boxes.map((box, i) => {
          const pop = spring({ frame: frame - i * 12, fps, config: { stiffness: 150, damping: 16 } });
          const scale = interpolate(pop, [0, 1], [0.8, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={box.title} style={{ gridColumn: `span ${box.colSpan}`, gridRow: `span ${box.rowSpan}`, background: box.bg, borderRadius: 32, padding: 32, display: "flex", flexDirection: "column", justifyContent: "space-between", transform: `scale(${scale})`, opacity: pop, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
              <div style={{ fontSize: box.rowSpan === 2 ? 80 : 56 }}>{box.icon}</div>
              <div style={{ color: "#fff", fontSize: 32, fontWeight: 800 }}>{box.title}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```
