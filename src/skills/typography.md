---
title: Typography & Text Animation
impact: HIGH
impactDescription: fixes common text animation bugs and improves readability
tags: typography, text, typewriter, kinetic, animation
---

## Typewriter Effect - Use String Slicing

Always use string slicing for typewriter effects. Never use per-character opacity.

**Incorrect (per-character opacity - breaks cursor positioning):**

```tsx
{
  text
    .split("")
    .map((char, i) => (
      <span style={{ opacity: i < typedCount ? 1 : 0 }}>{char}</span>
    ));
}
<span>|</span>;
```

**Correct (string slicing - cursor follows text):**

```tsx
const typedText = FULL_TEXT.slice(0, typedChars);

<span>{typedText}</span>
<span style={{ opacity: caretOpacity }}>▌</span>
```

## Cursor Blink - Use Smooth Interpolation

Blinking cursors should fade smoothly, not flash on/off abruptly.

**Incorrect (abrupt blink):**

```tsx
const caretVisible = Math.floor(frame / 15) % 2 === 0;
<span style={{ opacity: caretVisible ? 1 : 0 }}>|</span>;
```

**Correct (smooth blink):**

```tsx
const CURSOR_BLINK_FRAMES = 16;
const caretOpacity = interpolate(
  frame % CURSOR_BLINK_FRAMES,
  [0, CURSOR_BLINK_FRAMES / 2, CURSOR_BLINK_FRAMES],
  [1, 0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
);

<span style={{ opacity: caretOpacity }}>▌</span>;
```

## Word Carousel - Stable Width Container

Prevent layout shifts by using the longest word to set container width.

**Incorrect (width jumps between words):**

```tsx
<div style={{ position: "relative" }}>
  <span>{WORDS[currentIndex]}</span>
</div>
```

**Correct (stable width from longest word):**

```tsx
const longestWord = WORDS.reduce(
  (a, b) => (a.length >= b.length ? a : b),
  WORDS[0],
);

<div style={{ position: "relative" }}>
  <div style={{ visibility: "hidden" }}>{longestWord}</div>
  <div style={{ position: "absolute", left: 0, top: 0 }}>
    {WORDS[currentIndex]}
  </div>
</div>;
```

## Text Highlight - Two Layer Crossfade

Use overlapping layers for smooth highlight transitions.

```tsx
const typedOpacity = interpolate(
  frame,
  [highlightStart - 8, highlightStart + 8],
  [1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
);
const finalOpacity = interpolate(
  frame,
  [highlightStart, highlightStart + 8],
  [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
);

{
  /* Typing layer */
}
<div style={{ opacity: typedOpacity }}>{typedText}</div>;

{
  /* Final layer with highlight */
}
<div style={{ position: "absolute", inset: 0, opacity: finalOpacity }}>
  <span>{preText}</span>
  <span style={{ backgroundColor: COLOR_HIGHLIGHT }}>{HIGHLIGHT_WORD}</span>
  <span>{postText}</span>
</div>;
```

## Word-by-Word Spring Entrance

Reveal each word with a spring-driven translateY and opacity, staggered by a fixed delay.

```tsx
const WORDS = ["Build", "Ship", "Grow"];
const STAGGER = 12;

return (
  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
    {WORDS.map((word, i) => {
      const delay = i * STAGGER;
      const progress = spring({
        frame: frame - delay,
        fps,
        config: { damping: 14, stiffness: 120 },
      });
      const opacity = interpolate(Math.max(0, frame - delay), [0, 8], [0, 1], { extrapolateRight: "clamp" });
      return (
        <span
          key={i}
          style={{
            opacity,
            transform: `translateY(${interpolate(progress, [0, 1], [40, 0])}px)`,
            display: "inline-block",
            fontFamily: "Inter, sans-serif",
            fontWeight: 900,
            fontSize: 96,
            color: "#f1f5f9",
          }}
        >
          {word}
        </span>
      );
    })}
  </div>
);
```

## Gradient Text

CSS gradient clipped to text — works in both static and animated forms.

```tsx
<div
  style={{
    fontFamily: "Inter, sans-serif",
    fontWeight: 900,
    fontSize: 120,
    background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }}
>
  Supercharge
</div>
```

For animated gradient, shift `backgroundPosition` over time:

```tsx
const shift = interpolate(frame, [0, durationInFrames], [0, 100]);
<div style={{
  backgroundImage: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)",
  backgroundSize: "300% 100%",
  backgroundPosition: `${shift}% 50%`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  fontWeight: 900,
  fontSize: 120,
}}>
  Motion
</div>
```

## Glitch / Scramble Text Effect

Replaces characters with random glyphs during scramble frames, then resolves to final text.

```tsx
const FINAL_TEXT = "SYSTEM READY";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
const SCRAMBLE_DURATION = 40; // frames of scrambling

const progress = interpolate(frame, [0, SCRAMBLE_DURATION], [0, 1], { extrapolateRight: "clamp" });
const resolvedCount = Math.floor(progress * FINAL_TEXT.length);
// Seed random with frame so it changes every frame during scramble
const seed = frame * 137;
const displayed = FINAL_TEXT.split("").map((char, i) => {
  if (char === " ") return " ";
  if (i < resolvedCount) return char;
  return CHARS[(seed + i * 31) % CHARS.length];
}).join("");

<div style={{ fontFamily: "monospace", fontSize: 72, color: "#4ade80", letterSpacing: 6 }}>
  {displayed}
</div>
```

## Multi-Line Kinetic Text (Line by Line)

Each line enters with a spring after the previous one settles.

```tsx
const LINES = [
  "The future of video",
  "is intelligent.",
  "Start creating.",
];
const LINE_STAGGER = 22;

return (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {LINES.map((line, i) => {
      const delay = i * LINE_STAGGER;
      const p = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
      const opacity = interpolate(Math.max(0, frame - delay), [0, 10], [0, 1], { extrapolateRight: "clamp" });
      return (
        <div
          key={i}
          style={{
            opacity,
            transform: `translateX(${interpolate(p, [0, 1], [-80, 0])}px)`,
            fontFamily: "Inter, sans-serif",
            fontWeight: i === 0 ? 900 : i === 1 ? 700 : 400,
            fontSize: i === 0 ? 88 : i === 1 ? 88 : 52,
            color: i === 2 ? "#6366f1" : "#f1f5f9",
          }}
        >
          {line}
        </div>
      );
    })}
  </div>
);
```
