---
title: Timing & Sequencing
impact: HIGH
impactDescription: controls when elements appear and enables complex choreography
tags: sequence, series, timing, delay, choreography
---

## Sequence for Delayed Elements

Use Sequence to delay when an element appears in the timeline.

**Incorrect (manual frame checks):**

```tsx
{
  frame >= 30 && <Title />;
}
{
  frame >= 60 && <Subtitle />;
}
```

**Correct (Sequence component):**

```tsx
import { Sequence } from "remotion";

<Sequence from={30} durationInFrames={90}>
  <Title />
</Sequence>
<Sequence from={60} durationInFrames={60}>
  <Subtitle />
</Sequence>
```

## Series for Sequential Playback

Use Series when elements should play one after another without overlap.

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={45}>
    <Intro />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60}>
    <MainContent />
  </Series.Sequence>
  <Series.Sequence durationInFrames={30}>
    <Outro />
  </Series.Sequence>
</Series>;
```

## Series with Offset for Overlap

Use negative offset for overlapping sequences:

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <SceneA />
  </Series.Sequence>
  <Series.Sequence offset={-15} durationInFrames={60}>
    {/* Starts 15 frames before SceneA ends */}
    <SceneB />
  </Series.Sequence>
</Series>
```

## Staggered Element Entrances

For staggered animations of multiple items, calculate delays:

**Incorrect (hardcoded delays):**

```tsx
const items = data.map((item, i) => {
  const delay = i === 0 ? 0 : i === 1 ? 10 : i === 2 ? 20 : 30;
  // ...
});
```

**Correct (calculated stagger):**

```tsx
const STAGGER_DELAY = 8;
const BASE_DELAY = 15;

const items = data.map((item, i) => {
  const delay = BASE_DELAY + i * STAGGER_DELAY;
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 120 },
  });
  return (
    <Item
      key={i}
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * 20}px)`,
      }}
    />
  );
});
```

## Nested Sequences

Sequences can be nested for complex timing:

```tsx
<Sequence from={0} durationInFrames={120}>
  <Background />
  <Sequence from={15} durationInFrames={90}>
    <Title />
  </Sequence>
  <Sequence from={45} durationInFrames={60}>
    <Subtitle />
  </Sequence>
</Sequence>
```

## Frame References Inside Sequences

Inside a Sequence, useCurrentFrame() returns the local frame (starting from 0):

```tsx
<Sequence from={60} durationInFrames={30}>
  <MyComponent />
  {/* Inside MyComponent, useCurrentFrame() returns 0-29, not 60-89 */}
</Sequence>
```

## Dynamic Duration from Data Length

Compute `durationInFrames` per item based on the total composition length.

```tsx
const items = ["Step 1", "Step 2", "Step 3", "Step 4"];
const ITEM_DURATION = Math.floor(durationInFrames / items.length);
const OVERLAP = 8; // optional: start each item slightly before the previous ends

return (
  <AbsoluteFill>
    {items.map((item, i) => (
      <Sequence
        key={i}
        from={i * ITEM_DURATION - i * OVERLAP}
        durationInFrames={ITEM_DURATION + OVERLAP}
      >
        <ItemComponent item={item} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
```

## Off-Screen Preparation

Render elements outside the visible area before animating them in — avoids a single-frame pop.

```tsx
// Mount the element from frame 0 at an off-screen position
const slideIn = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });
const translateY = interpolate(slideIn, [0, 1], [120, 0]); // starts 120px below

<div style={{ transform: `translateY(${translateY}px)` }}>
  {content}
</div>
// vs just rendering at frame 20 (avoid): avoids a flash when element first appears
```

## Parallax Scrolling (Layered Speeds)

Multiple layers scroll at different rates to create depth — **layers must be positioned so they start visible and scroll upward within the canvas bounds**.

> **Common bug**: Setting `position: 'absolute'` with no `top`/`bottom` and applying negative `translateY` pushes content above the top of the canvas (off-screen). Always anchor layers with explicit `top` or start them below the visible area.

```tsx
const { width, height } = useVideoConfig();
const SCROLL_PROGRESS = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });

// Each layer: how far (in px) it scrolls from start to end of composition
// Positive scrollAmount = scrolls UP (content moves toward top of canvas)
const layers = [
  { zIndex: 0, scrollAmount: 100, bg: "#0f172a"  }, // background barely moves
  { zIndex: 1, scrollAmount: 300, bg: "transparent" }, // mid layer
  { zIndex: 2, scrollAmount: 600, bg: "transparent" }, // foreground moves most
];

return (
  <AbsoluteFill style={{ overflow: "hidden", background: "#0f172a" }}>
    {layers.map((layer, i) => {
      // translateY goes from 0 → -scrollAmount as progress goes 0 → 1
      // Content stays WITHIN the canvas because scrollAmount ≤ canvas height
      const translateY = -(SCROLL_PROGRESS * layer.scrollAmount);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 0,             // anchor to top — translateY scrolls content upward
            left: 0,
            width: "100%",
            // Make the layer taller than the canvas so it has room to scroll
            height: height + layer.scrollAmount,
            zIndex: layer.zIndex,
            background: layer.bg,
            transform: `translateY(${translateY}px)`,
            willChange: "transform",
          }}
        >
          {/* layer content positioned within the extended height */}
        </div>
      );
    })}
  </AbsoluteFill>
);
```

**Key rules:**
- Layer `height` = `canvas height + scrollAmount` so content never clips at the bottom
- `translateY` ranges from `0` to `-scrollAmount` — it only ever goes UP, never above 0
- `overflow: "hidden"` on the container clips anything that extends below canvas
