---
title: Chart & Data Visualization
impact: HIGH
impactDescription: improves data viz quality and animation polish
tags: charts, data, visualization, bar-chart, pie-chart, graphs
---

## ⚠️ Font Sizes for 1920×1080 Canvas

Remember: Remotion renders at **1920×1080** (or similar large resolution). Font sizes that look fine in CSS will be **tiny** at full canvas. Always use:
- Axis / tick labels: **minimum 32px**
- Value labels inside bars: **minimum 36px**
- Chart titles: **minimum 52px**  
- Hero metrics / stat numbers: **minimum 80px**

Never use font sizes below 28px for any visible text.

## Bar Chart Animations

Stagger bar entrances with 3-5 frame delays and use spring() for organic motion.

**Incorrect (all bars animate together):**

```tsx
const bars = data.map((item, i) => {
  const height = spring({ frame, fps, config: { damping: 18 } });
  return <div style={{ height: height * item.value }} />;
});
```

**Correct (staggered entrances):**

```tsx
const STAGGER_DELAY = 5;

const bars = data.map((item, i) => {
  const delay = i * STAGGER_DELAY;
  const height = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 80 },
  });
  return <div style={{ height: height * item.value }} />;
});
```

## Always Include Y-Axis Labels

Charts without axis labels are hard to read. Always add labeled tick marks.

**Incorrect (no axis):**

```tsx
<div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>{bars}</div>
```

**Correct (with Y-axis):**

```tsx
const yAxisSteps = [0, 25, 50, 75, 100];

<div style={{ display: "flex" }}>
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    {yAxisSteps.reverse().map((step) => (
      <span style={{ fontSize: 32, color: "#888" }}>{step}</span>
    ))}
  </div>
  <div
    style={{
      display: "flex",
      alignItems: "flex-end",
      gap: 8,
      borderLeft: "1px solid #333",
    }}
  >
    {bars}
  </div>
</div>;
```

## Value Labels Inside Bars

Position value labels inside bars when height is sufficient, fade in after bar animates.

```tsx
const barHeight = normalizedHeight * progress;

<div style={{ height: barHeight, backgroundColor: COLOR_BAR }}>
  {barHeight > 50 && (
    <span style={{ opacity: progress, fontSize: 36, fontFamily: "Inter, sans-serif", fontWeight: 700 }}>
      {item.value.toLocaleString()}
    </span>
  )}
</div>;
```

> **Always set `fontFamily: "Inter, sans-serif"` on all chart text** — browser default fonts look unprofessional in video.
```

## Pie Chart Animation

Animate segments using stroke-dashoffset, starting from 12 o'clock.

```tsx
const circumference = 2 * Math.PI * radius;
const segmentLength = (value / total) * circumference;
const offset = interpolate(progress, [0, 1], [segmentLength, 0]);

<circle
  r={radius}
  cx={center}
  cy={center}
  fill="none"
  stroke={color}
  strokeWidth={strokeWidth}
  strokeDasharray={`${segmentLength} ${circumference}`}
  strokeDashoffset={offset}
  transform={`rotate(-90 ${center} ${center})`}
/>;
```

## Line Chart — Draw-On with SVG Path

Animate a polyline drawing from left to right using `stroke-dashoffset`.

```tsx
const LINE_COLOR = "#6366f1";
const data = [30, 55, 40, 80, 60, 95, 75];
const W = 1200, H = 600, PAD = 80;

// Compute points
const points = data.map((v, i) => {
  const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const y = H - PAD - (v / 100) * (H - PAD * 2);
  return `${x},${y}`;
}).join(" ");

// Approximate path length (segment avg × count)
const PATH_LENGTH = 1400;
const drawProgress = spring({ frame, fps, config: { damping: 30, stiffness: 60 } });
const dashOffset = PATH_LENGTH * (1 - drawProgress);

return (
  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%" }}>
    {/* Grid lines */}
    {[0, 25, 50, 75, 100].map(v => {
      const y = H - PAD - (v / 100) * (H - PAD * 2);
      return (
        <line key={v} x1={PAD} y1={y} x2={W - PAD} y2={y}
          stroke="#1e293b" strokeWidth="1" />
      );
    })}
    {/* Animated line */}
    <polyline
      points={points}
      fill="none"
      stroke={LINE_COLOR}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={PATH_LENGTH}
      strokeDashoffset={dashOffset}
    />
    {/* Dots appear as line passes */}
    {data.map((v, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = H - PAD - (v / 100) * (H - PAD * 2);
      const dotProgress = interpolate(drawProgress, [i / data.length, (i + 1) / data.length], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <circle key={i} cx={x} cy={y} r={8 * dotProgress} fill={LINE_COLOR}
          opacity={dotProgress} />
      );
    })}
  </svg>
);
```

## Donut / Ring Chart

Ring chart with animated fill and a central stat label.

```tsx
const DONUT_RADIUS = 180;
const STROKE = 40;
const cx = 300, cy = 300;
const circumference = 2 * Math.PI * DONUT_RADIUS;
const VALUE = 72; // 72%
const fillAnim = spring({ frame, fps, config: { damping: 25, stiffness: 60 } });
const filled = (VALUE / 100) * circumference * fillAnim;

return (
  <svg viewBox="0 0 600 600" style={{ width: 600, height: 600 }}>
    {/* Background ring */}
    <circle cx={cx} cy={cy} r={DONUT_RADIUS} fill="none"
      stroke="#1e293b" strokeWidth={STROKE} />
    {/* Animated fill */}
    <circle cx={cx} cy={cy} r={DONUT_RADIUS} fill="none"
      stroke="#6366f1" strokeWidth={STROKE}
      strokeLinecap="round"
      strokeDasharray={`${filled} ${circumference}`}
      transform={`rotate(-90 ${cx} ${cy})`} />
    {/* Center label */}
    <text x={cx} y={cy - 10} textAnchor="middle" fill="#f1f5f9"
      fontFamily="Inter, sans-serif" fontWeight="900" fontSize="72">
      {Math.round(VALUE * fillAnim)}%
    </text>
    <text x={cx} y={cy + 40} textAnchor="middle" fill="#64748b"
      fontFamily="Inter, sans-serif" fontSize="28">
      Completion
    </text>
  </svg>
);
```

## Animated Stat Counter Inside Chart

Counts up a number with spring easing. Place inside bars or as a hero metric.

```tsx
const TARGET = 48290;
const countAnim = spring({ frame, fps, config: { damping: 20, stiffness: 50 } });
const displayed = Math.round(interpolate(countAnim, [0, 1], [0, TARGET]));

<div style={{ fontFamily: "Inter, sans-serif", fontSize: 96, fontWeight: 900, color: "#f1f5f9" }}>
  ${displayed.toLocaleString()}
</div>
```

## X-Axis Labels with Proper Spacing

Always render X-axis labels below bars with consistent spacing.

```tsx
const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const BAR_W = 120, GAP = 20, START_X = 80;

<div style={{ display: "flex", position: "absolute", bottom: 0 }}>
  {labels.map((label, i) => (
    <div key={i} style={{
      width: BAR_W,
      marginRight: GAP,
      textAlign: "center",
      fontSize: 28,
      color: "#64748b",
      fontFamily: "Inter, sans-serif",
    }}>
      {label}
    </div>
  ))}
</div>
```
