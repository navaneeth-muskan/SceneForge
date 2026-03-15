---
title: Scene Transitions
impact: HIGH
impactDescription: enables smooth scene changes and professional video flow
tags: transitions, fade, slide, wipe, scenes
---

## TransitionSeries for Scene Changes

Use TransitionSeries to animate between multiple scenes or clips.

**Incorrect (abrupt scene cuts):**

```tsx
<Sequence from={0} durationInFrames={60}>
  <SceneA />
</Sequence>
<Sequence from={60} durationInFrames={60}>
  <SceneB />
</Sequence>
```

**Correct (smooth transitions):**

```tsx
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>;
```

## Available Transition Types

Import transitions from their respective modules:

```tsx
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
```

## Slide Transition with Direction

Specify slide direction for enter/exit animations.

```tsx
import { slide } from "@remotion/transitions/slide";

<TransitionSeries.Transition
  presentation={slide({ direction: "from-left" })}
  timing={linearTiming({ durationInFrames: 20 })}
/>;
```

Directions: `"from-left"`, `"from-right"`, `"from-top"`, `"from-bottom"`

## Custom Crossfade Without TransitionSeries

For simple opacity crossfades within a single component:

```tsx
const TRANSITION_START = 60;
const TRANSITION_DURATION = 15;

const scene1Opacity = interpolate(
  frame,
  [TRANSITION_START, TRANSITION_START + TRANSITION_DURATION],
  [1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

const scene2Opacity = interpolate(
  frame,
  [TRANSITION_START, TRANSITION_START + TRANSITION_DURATION],
  [0, 1],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

<AbsoluteFill style={{ opacity: scene1Opacity }}><SceneA /></AbsoluteFill>
<AbsoluteFill style={{ opacity: scene2Opacity }}><SceneB /></AbsoluteFill>
```

## Timing Options

```tsx
import { linearTiming, springTiming } from "@remotion/transitions";

// Linear timing - constant speed
linearTiming({ durationInFrames: 20 });

// Spring timing - organic motion
springTiming({ config: { damping: 200 }, durationInFrames: 25 });
```

## linearTiming vs springTiming

Use `springTiming` for organic, natural-feeling transitions. Use `linearTiming` for mechanical or UI-driven cuts.

```tsx
// Snappy, feels immediate — good for slide/wipe
const snappy = linearTiming({ durationInFrames: 15 });

// Soft, overshoots slightly — good for fade/flip
const organic = springTiming({ config: { damping: 200 }, durationInFrames: 30 });
```

## All Available Remotion Transitions

```tsx
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { none } from "@remotion/transitions/none";

// Each takes optional config:
fade()                              // cross-dissolve
slide({ direction: "from-left" })   // push slide (from-left/right/top/bottom)
wipe({ direction: "from-left" })    // reveal wipe
flip({ direction: "from-left" })    // 3D flip
clockWipe({ clipAreaStyle: {} })    // radial clock sweep
none()                              // cut with no visual effect
```

## Iris / Circle Wipe (Custom SVG)

Custom radial reveal — circle expands from a point to reveal the next scene.

```tsx
const progress = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
const maxRadius = Math.sqrt(width ** 2 + height ** 2) / 2 + 10;
const r = interpolate(progress, [0, 1], [0, maxRadius]);

<AbsoluteFill>
  <SceneB />
  {/* Clip SceneA underneath the expandning circle */}
  <svg
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    viewBox={`0 0 ${width} ${height}`}
  >
    <defs>
      <mask id="irisMask">
        <rect width={width} height={height} fill="white" />
        <circle cx={width / 2} cy={height / 2} r={r} fill="black" />
      </mask>
    </defs>
    <g mask="url(#irisMask)">
      <foreignObject width={width} height={height}>
        <SceneA />
      </foreignObject>
    </g>
  </svg>
</AbsoluteFill>
```

## Color-Wash / Flash Transition

A bright white (or branded color) flash between scenes — common in music videos and ads.

```tsx
const FLASH_PEAK = 10; // frame of maximum white
const FADE_OUT = 25;

const flashOpacity = interpolate(
  frame,
  [0, FLASH_PEAK, FADE_OUT],
  [0, 1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);

<AbsoluteFill>
  {frame < FLASH_PEAK ? <SceneA /> : <SceneB />}
  <AbsoluteFill style={{ background: "#ffffff", opacity: flashOpacity }} />
</AbsoluteFill>
