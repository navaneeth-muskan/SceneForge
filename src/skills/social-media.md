---
title: Social Media Content
impact: MEDIUM
impactDescription: optimizes content for mobile viewing and engagement
tags: social, instagram, tiktok, reels, stories, mobile
---

## Safe Zone for UI Overlays

Keep key content in the center 80% to avoid platform UI elements.

**Incorrect (content at edges - gets covered by UI):**

```tsx
<AbsoluteFill style={{ padding: 10 }}>
  <div style={{ position: "absolute", top: 0 }}>Title</div>
  <div style={{ position: "absolute", bottom: 0 }}>CTA</div>
</AbsoluteFill>
```

**Correct (content in safe zone):**

```tsx
const SAFE_MARGIN_TOP = height * 0.12;
const SAFE_MARGIN_BOTTOM = height * 0.15;
const SAFE_MARGIN_SIDES = width * 0.05;

<AbsoluteFill
  style={{
    paddingTop: SAFE_MARGIN_TOP,
    paddingBottom: SAFE_MARGIN_BOTTOM,
    paddingLeft: SAFE_MARGIN_SIDES,
    paddingRight: SAFE_MARGIN_SIDES,
  }}
>
  {content}
</AbsoluteFill>;
```

## Mobile-First Text Sizing

Text must be readable on small screens. Minimum 48px for headlines.

**Incorrect (text too small for mobile):**

```tsx
const TITLE_SIZE = 24;
const BODY_SIZE = 14;
```

**Correct (mobile-readable sizes):**

```tsx
const TITLE_SIZE = Math.max(48, Math.round(width * 0.08));
const BODY_SIZE = Math.max(28, Math.round(width * 0.045));
```

## Hook in First Frames

Social content needs immediate visual interest. Add movement from frame 0.

**Incorrect (static start):**

```tsx
const entrance = spring({ frame: frame - 30, fps }); // Starts after 1 second
```

**Correct (immediate hook):**

```tsx
const entrance = spring({
  frame,
  fps,
  config: { damping: 12, stiffness: 200 },
});
const pulse = Math.sin(frame * 0.15) * 0.03 + 1; // Subtle constant motion

<div style={{ transform: `scale(${entrance * pulse})` }}>{content}</div>;
```

## High Contrast Colors

Use bold, saturated colors that pop on mobile screens.

```tsx
// Good for social
const COLOR_PRIMARY = "#FF3366";
const COLOR_ACCENT = "#00D4FF";
const COLOR_BG = "#0A0A0A";

// Avoid muted/pastel colors that look washed out
// const COLOR_PRIMARY = "#C4A4A4"; // Too muted
```

## Loop-Friendly Endings

Design animations that can seamlessly loop.

```tsx
const TOTAL_DURATION = durationInFrames;
const loopProgress = (frame % TOTAL_DURATION) / TOTAL_DURATION;

// Or fade to start state at the end
const fadeOut = interpolate(
  frame,
  [TOTAL_DURATION - 15, TOTAL_DURATION],
  [1, 0],
);
```

## TikTok / Reels Caption Pill

Bottom-anchored caption with emoji, pill shape, and slide-up entrance.

```tsx
const CAPTION = "Wait for it... 👀";
const captionEntry = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 20, stiffness: 150 } });
const slideUp = interpolate(captionEntry, [0, 1], [60, 0]);
const opacity = interpolate(Math.max(0, frame - 8), [0, 10], [0, 1], { extrapolateRight: "clamp" });

<div style={{
  position: "absolute",
  bottom: "12%",
  left: "50%",
  transform: `translateX(-50%) translateY(${slideUp}px)`,
  opacity,
  background: "rgba(0,0,0,0.72)",
  backdropFilter: "blur(8px)",
  borderRadius: 40,
  padding: "14px 28px",
  color: "#ffffff",
  fontFamily: "Inter, sans-serif",
  fontWeight: 700,
  fontSize: 36,
  whiteSpace: "nowrap",
  border: "1px solid rgba(255,255,255,0.15)",
}}>
  {CAPTION}
</div>
```

## Stories Progress Bar

Top of frame multi-segment bar showing story progress — like Instagram Stories.

```tsx
const TOTAL_SEGMENTS = 5;
const CURRENT_SEGMENT = 2; // 0-indexed
const SEGMENT_FILL = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });

<div style={{
  position: "absolute",
  top: 16,
  left: "5%",
  right: "5%",
  display: "flex",
  gap: 6,
}}>
  {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => (
    <div key={i} style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.3)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{
        height: "100%",
        background: "#ffffff",
        borderRadius: 2,
        width: i < CURRENT_SEGMENT ? "100%" : i === CURRENT_SEGMENT ? `${SEGMENT_FILL * 100}%` : "0%",
      }} />
    </div>
  ))}
</div>
```

## Countdown Timer Widget

Animated seconds countdown — number shrinks and fades as it changes.

```tsx
const DURATION_SECONDS = 5;
const elapsed = frame / fps;
const remaining = Math.ceil(Math.max(0, DURATION_SECONDS - elapsed));
const frac = (frame / fps) % 1; // fractional seconds 0→1

const scaleDown = interpolate(frac, [0.8, 1], [1, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const fadeOut   = interpolate(frac, [0.8, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

<div style={{
  fontFamily: "Inter, sans-serif",
  fontWeight: 900,
  fontSize: 160,
  color: "#ffffff",
  transform: `scale(${scaleDown})`,
  opacity: fadeOut,
  textAlign: "center",
}}>
  {remaining}
</div>
```

## Swipe-Up CTA with Bouncy Arrow

Animated call-to-action for Stories/Reels — arrows bounce to draw attention.

```tsx
const BOUNCE_SPEED = 0.12; // radians per frame
const bounceY = Math.sin(frame * BOUNCE_SPEED) * 10; // ±10px oscillation

<div style={{
  position: "absolute",
  bottom: "6%",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  color: "#ffffff",
  fontFamily: "Inter, sans-serif",
}}>
  <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
    Swipe Up
  </span>
  {/* Bouncing arrows */}
  {["↑", "↑", "↑"].map((arrow, i) => (
    <div key={i} style={{
      fontSize: 28,
      opacity: interpolate(i, [0, 2], [0.3, 1]),
      transform: `translateY(${bounceY * (1 - i * 0.25)}px)`,
    }}>
      {arrow}
    </div>
  ))}
</div>
