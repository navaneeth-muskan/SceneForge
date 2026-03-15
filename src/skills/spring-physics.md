---
title: Spring Physics Animation
impact: HIGH
impactDescription: creates natural, organic motion instead of mechanical animations
tags: spring, physics, bounce, easing, organic
---

## Prefer spring() Over interpolate()

Use spring() for natural motion, interpolate() only for linear progress.

**Incorrect (mechanical motion):**

```tsx
const scale = interpolate(frame, [0, 30], [0, 1], {
  extrapolateRight: "clamp",
});
```

**Correct (organic spring motion):**

```tsx
const scale = spring({
  frame,
  fps,
  config: { damping: 12, stiffness: 100 },
  durationInFrames: 30,
});
```

## Spring Config Parameters

```tsx
spring({
  frame,
  fps,
  config: {
    damping: 10, // Higher = less bounce (10-200)
    stiffness: 100, // Higher = faster snap (50-200)
    mass: 1, // Higher = more inertia (0.5-3)
  },
});
```

## Common Spring Presets

```tsx
// Snappy, minimal bounce (UI elements)
const snappy = { damping: 20, stiffness: 200 };

// Bouncy entrance (playful animations)
const bouncy = { damping: 8, stiffness: 100 };

// Smooth, no bounce (subtle reveals)
const smooth = { damping: 200, stiffness: 100 };

// Heavy, slow (large objects)
const heavy = { damping: 15, stiffness: 80, mass: 2 };
```

## Delayed Spring Start

Offset the frame for delayed spring animations:

**Incorrect (spring starts immediately):**

```tsx
const entrance = spring({ frame, fps, config: { damping: 12 } });
```

**Correct (spring starts after delay):**

```tsx
const ENTRANCE_DELAY = 20;
const entrance = spring({
  frame: frame - ENTRANCE_DELAY,
  fps,
  config: { damping: 12, stiffness: 100 },
});
// Returns 0 until frame 20, then animates to 1
```

## Spring for Scale with Overshoot

For bouncy scale animations that overshoot:

```tsx
const bounce = spring({
  frame,
  fps,
  config: { damping: 8, stiffness: 150 },
});
// Will overshoot past 1.0 before settling

<div style={{ transform: `scale(${bounce})` }}>{content}</div>;
```

## Combining Spring with Interpolate

Map spring output (0-1) to custom ranges:

```tsx
const springProgress = spring({ frame, fps, config: { damping: 15 } });

// Map to rotation
const rotation = interpolate(springProgress, [0, 1], [0, 360]);

// Map to position
const translateY = interpolate(springProgress, [0, 1], [50, 0]);

<div style={{ transform: `translateY(${translateY}px) rotate(${rotation}deg)` }}>
```

## Chained Springs for Sequential Motion

```tsx
const PHASE_1_END = 30;
const PHASE_2_START = 25; // Slight overlap

const phase1 = spring({ frame, fps, config: { damping: 15 } });
const phase2 = spring({
  frame: frame - PHASE_2_START,
  fps,
  config: { damping: 12 },
});

// phase1 controls entrance, phase2 controls secondary motion
```

## Staggered List Reveal

Items appear one by one, each with its own spring delay.

```tsx
const ITEMS = ["Dashboard", "Analytics", "Settings", "Billing"];
const STAGGER = 10;

return (
  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
    {ITEMS.map((item, i) => {
      const p = spring({
        frame: frame - i * STAGGER,
        fps,
        config: { damping: 18, stiffness: 120 },
      });
      const opacity = interpolate(Math.max(0, frame - i * STAGGER), [0, 8], [0, 1], { extrapolateRight: "clamp" });
      return (
        <div
          key={i}
          style={{
            opacity,
            transform: `translateX(${interpolate(p, [0, 1], [-60, 0])}px)`,
            background: "#1e293b",
            borderRadius: 12,
            padding: "20px 28px",
            fontSize: 32,
            color: "#f1f5f9",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {item}
        </div>
      );
    })}
  </div>
);
```

## Spring-Driven Number Roll (Counter)

Animates a number from 0 to target using spring — slower at the end for drama.

```tsx
const TARGET_VALUE = 12_847;
const countSpring = spring({ frame, fps, config: { damping: 18, stiffness: 40 } });
const displayed = Math.round(interpolate(countSpring, [0, 1], [0, TARGET_VALUE]));

<div style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: 120 }}>
  {displayed.toLocaleString()}
</div>
```

## Rubber-Band Drag & Snap

Element stretches toward a target, overshoots, then snaps — like pulling a rubber band.

```tsx
const DRAG_FRAMES = 20;  // frame at peak stretch
const SNAP_CONFIG = { damping: 8, stiffness: 200 }; // high stiffness = fast snap

const stretchPhase = interpolate(frame, [0, DRAG_FRAMES], [0, 1], { extrapolateRight: "clamp" });
const snapPhase = spring({ frame: frame - DRAG_FRAMES, fps, config: SNAP_CONFIG });

const scale = frame < DRAG_FRAMES
  ? interpolate(stretchPhase, [0, 1], [1, 1.4])
  : interpolate(snapPhase, [0, 1], [1.4, 1]);   // bounces back past 1.0

<div style={{ transform: `scale(${scale})` }}>{content}</div>
```

## Spring Chaining — Sequential Multi-Phase

Each phase starts near the *end* of the previous one, creating a flowing sequence.

```tsx
const DELAYS = [0, 20, 36, 50]; // frame start per phase
const CONFIG = { damping: 20, stiffness: 150 };

const [p1, p2, p3, p4] = DELAYS.map(delay =>
  spring({ frame: frame - delay, fps, config: CONFIG })
);

// Use each for a different transform property
const x      = interpolate(p1, [0, 1], [-100, 0]);
const scale  = interpolate(p2, [0, 1], [0.5, 1]);
const rotate = interpolate(p3, [0, 1], [-30, 0]);
const opacity = interpolate(Math.max(0, frame - DELAYS[3]), [0, 8], [0, 1], { extrapolateRight: "clamp" });

<div style={{ transform: `translateX(${x}px) scale(${scale}) rotate(${rotate}deg)`, opacity }}>
  {content}
</div>
