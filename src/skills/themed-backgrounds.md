---
title: Themed Scientific Backgrounds
impact: HIGH
impactDescription: introduces reusable ambient backgrounds for blueprint, molecular, and aurora visual styles
tags: themed-backgrounds, blueprint, molecular, aurora, ambient background, abstract technical backdrop
---

# Themed Background Patterns

Use this when a scene needs a premium dynamic backdrop matched to science, engineering, or abstract technical storytelling.

---

## ThemedBackgrounds

Single component with a `theme` prop for blueprint, molecular, and aurora modes.

```tsx
export const ThemedBackgrounds = ({
  theme = "blueprint",
}: {
  theme: "blueprint" | "molecular" | "aurora";
}) => {
  const frame = useCurrentFrame();

  if (theme === "blueprint") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#003366",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.5)",
            boxShadow: "0 0 20px #fff",
            top: (frame * 5) % 1080,
          }}
        />
      </AbsoluteFill>
    );
  }

  if (theme === "molecular") {
    const pan = frame * 0.5;
    return (
      <AbsoluteFill style={{ backgroundColor: "#09090b", overflow: "hidden" }}>
        <svg style={{ width: "200%", height: "200%", transform: `translate(${-pan}px, ${-pan}px)` }}>
          <defs>
            <pattern id="hex" width="100" height="173.2" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
              <path d="M50 0 L100 28.8 L100 86.6 L50 115.4 L0 86.6 L0 28.8 Z M50 173.2 L100 144.4 L100 86.6 L50 115.4 L0 86.6 L0 144.4 Z" fill="none" stroke="#27272a" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex)" />
        </svg>
        <div style={{ position: "absolute", top: "20%", left: "30%", width: 600, height: 600, background: "radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%)", filter: "blur(40px)", mixBlendMode: "screen" }} />
        <div style={{ position: "absolute", top: "50%", right: "20%", width: 800, height: 800, background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)", filter: "blur(60px)", mixBlendMode: "screen" }} />
      </AbsoluteFill>
    );
  }

  if (theme === "aurora") {
    const shift1 = Math.sin(frame * 0.01) * 200;
    const shift2 = Math.cos(frame * 0.015) * 300;
    return (
      <AbsoluteFill style={{ backgroundColor: "#000", filter: "blur(100px)" }}>
        <div style={{ position: "absolute", top: -100 + shift1, left: -100 - shift1, width: 1200, height: 800, background: "#c026d3", borderRadius: "50%", opacity: 0.5 }} />
        <div style={{ position: "absolute", bottom: -200 - shift2, right: -100 + shift1, width: 1400, height: 1000, background: "#3b82f6", borderRadius: "50%", opacity: 0.6 }} />
        <div style={{ position: "absolute", top: 300, left: 400 + shift2, width: 800, height: 800, background: "#10b981", borderRadius: "50%", opacity: 0.4 }} />
      </AbsoluteFill>
    );
  }

  return <AbsoluteFill style={{ background: "#000" }} />;
};
```

### Wrapper Usage

```tsx
export const SceneComp = () => {
  return (
    <AbsoluteFill>
      <ThemedBackgrounds theme="molecular" />
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#e5e7eb", fontFamily: "Inter, sans-serif", fontSize: 64, fontWeight: 800 }}>
        Molecular Systems Overview
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```
