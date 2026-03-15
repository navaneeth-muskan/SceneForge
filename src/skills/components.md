# Motion Graphics Component Patterns

Pre-built motion component patterns for Remotion animations. Inline these templates directly in your generated code — no separate imports required.

## When to Use
- **LowerThird** — broadcast name/title overlays, interview subjects, source attribution, caption bars
- **TitleCard** — opening titles, section headers, cinematic hero moments, product reveals
- **KineticText** — impactful quotes, key messages, spoken-word visualization, headlines
- **AnimatedCounter** — statistics, metrics, countdowns, before/after numbers, dashboard data
- **GradientBackground** — dynamic background layer for any scene needing atmospheric depth

---

## LowerThird

Broadcast-style animated name/title overlay with accent bar that slides in from left.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ACCENT = "#3b82f6";
  const NAME = "Alexandra Chen";
  const ROLE = "Chief Product Officer";

  const barScale = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const textOp = interpolate(frame, [8, 22], [0, 1], { extrapolateRight: "clamp" });
  const slideX = interpolate(frame, [0, 14], [-50, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #0f172a, #1e1b4b)" }}>
      <div style={{ position: "absolute", bottom: 140, left: 100 }}>
        <div style={{ width: `${barScale * 260}px`, height: 5, backgroundColor: ACCENT, borderRadius: 3, marginBottom: 12 }} />
        <div style={{ opacity: textOp, transform: `translateX(${slideX}px)` }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#fff" }}>{NAME}</div>
          <div style={{ fontSize: 26, color: "#94a3b8", marginTop: 6 }}>{ROLE}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

---

## TitleCard

Full-screen hero title with animated gradient background and spring text entrances.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const TITLE = "The Future";
  const SUBTITLE = "Is Already Here";

  const titleIn = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const subIn = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 120 } });
  const lineIn = spring({ frame: frame - 6, fps, config: { damping: 16, stiffness: 200 } });
  const bgAngle = interpolate(frame, [0, durationInFrames], [120, 240], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${bgAngle}deg, #0f0c29, #302b63, #24243e)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ opacity: titleIn, transform: `scale(${0.7 + titleIn * 0.3}) translateY(${(1 - titleIn) * 60}px)`, fontSize: 132, fontWeight: 900, color: "#fff", letterSpacing: "-4px", textAlign: "center" }}>
        {TITLE}
      </div>
      <div style={{ width: `${lineIn * 320}px`, height: 3, background: "linear-gradient(90deg, transparent, #6366f1, #3b82f6, transparent)", margin: "28px 0" }} />
      <div style={{ opacity: subIn, transform: `translateY(${(1 - subIn) * 30}px)`, fontSize: 64, fontWeight: 300, color: "#94a3b8", textAlign: "center" }}>
        {SUBTITLE}
      </div>
    </AbsoluteFill>
  );
};
```

---

## KineticText

Word-by-word kinetic typography — each word springs in sequentially with blur and scale.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = ["Think", "Different.", "Act", "Boldly."];
  const STAGGER = 8; // frames between each word

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 20, padding: 100 }}>
      {words.map((word, i) => {
        const wf = frame - i * STAGGER;
        const entrance = spring({ frame: wf, fps, config: { damping: 10, stiffness: 180 } });
        const opacity = interpolate(wf, [0, 10], [0, 1], { extrapolateRight: "clamp" });
        const blur = interpolate(wf, [0, 12], [8, 0], { extrapolateRight: "clamp" });
        return (
          <span key={i} style={{
            display: "inline-block", opacity,
            filter: `blur(${blur}px)`,
            transform: `translateY(${(1 - entrance) * 80}px) scale(${0.6 + entrance * 0.4})`,
            fontSize: 120, fontWeight: 900, color: i % 2 === 0 ? "#fff" : "#6366f1",
          }}>{word}</span>
        );
      })}
    </AbsoluteFill>
  );
};
```

---

## AnimatedCounter

Counts from 0 to a target value with spring easing. For statistics, metrics, dashboards.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const TARGET = 2847;
  const SUFFIX = "+";
  const LABEL = "ACTIVE USERS";

  const progress = spring({ frame, fps, from: 0, to: 1, config: { damping: 22, stiffness: 50 } });
  const displayValue = Math.round(progress * TARGET).toLocaleString();

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 140, fontWeight: 900, color: "#3b82f6" }}>{displayValue}</span>
        <span style={{ fontSize: 70, fontWeight: 700, color: "#3b82f6", opacity: 0.8 }}>{SUFFIX}</span>
      </div>
      <div style={{ fontSize: 22, color: "#64748b", letterSpacing: 6, marginTop: 16 }}>{LABEL}</div>
    </AbsoluteFill>
  );
};
```

---

## GradientBackground

Animated gradient that slowly shifts angle and hue over time. Use as a background layer.

```tsx
// Inside any SceneComp, as a full-canvas backdrop:
const frame = useCurrentFrame();
const { durationInFrames } = useVideoConfig();

const angle = interpolate(frame, [0, durationInFrames], [120, 280], { extrapolateRight: "clamp" });
const hue1 = interpolate(frame, [0, durationInFrames], [230, 270], { extrapolateRight: "clamp" });
const hue2 = interpolate(frame, [0, durationInFrames], [260, 300], { extrapolateRight: "clamp" });

// Use as style on AbsoluteFill:
// background: `linear-gradient(${angle}deg, hsl(${hue1}, 60%, 12%), hsl(${hue2}, 55%, 18%))`

// Add floating orb for depth:
// <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%",
//   background:`radial-gradient(circle, hsla(${hue1},70%,45%,0.15) 0%, transparent 70%)`,
//   top:"30%", left:"20%", transform:"translate(-50%,-50%)", filter:"blur(40px)" }} />
```

---

## Import Note

If a component becomes long (>80 lines), extract it to:
`src/remotion/components/ComponentName.tsx`

Then import in your scene code:
`import { ComponentName } from "../components/ComponentName";`
