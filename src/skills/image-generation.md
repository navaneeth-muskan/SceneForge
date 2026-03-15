---
title: AI Image Generation
impact: HIGH
impactDescription: adds photorealistic or stylized AI-generated images directly into video scenes
tags: image-generation, AI, photo, generate, background, visual, scene
---

## When to Use Image Generation

Use `generate_image` (via the ADK tool) when a scene needs a specific visual that:
- is not available as an uploaded asset
- requires a photorealistic, illustrated, or stylized background
- is described compositionally in the scene spec (e.g. "aerial city at night")

Do **not** use image generation for animation-only scenes — those use Remotion code instead.

## Prompting for Video Scenes

Image generation prompts for video should always specify:
1. **Subject** — what the main element is
2. **Style** — photorealistic, cinematic, flat illustration, etc.
3. **Mood/Lighting** — golden hour, moody, vibrant, neon, etc.
4. **Composition for video** — wide establishing shot, full-bleed background, rule of thirds

**Good prompt:**
```
Aerial view of a bustling city skyline at night, neon signs reflecting in rain-soaked streets,
cinematic color grading, wide establishing shot, photorealistic, 16:9
```

**Too vague:**
```
city at night
```

## Aspect Ratios

| Format | aspectRatio | Use case |
|---|---|---|
| Landscape video (default) | `16:9` | Standard Remotion canvas (1920×1080) |
| Vertical / Short-form | `9:16` | TikTok, Instagram Reels, YouTube Shorts |
| Square | `1:1` | Instagram feed, thumbnail inserts |
| Slight landscape | `4:3` | Older TV ratio, framed inserts |
| Slight portrait | `3:4` | Print-style portrait framing |

## Model Selection

| Model key | Best for |
|---|---|
| `imageFlash` (default) | Most scenes — best speed/quality balance, up to 4K |
| `imagePro` | Complex instructions, detailed compositions, multi-element layouts |
| `imageLite` | High-volume / low-latency scenes where 1K resolution is enough |

## Using generate_image in a Scene

When the Scene Builder agent handles an `image` type scene:

1. Call `generate_image` with a detailed prompt matching the scene description
2. Use `16:9` aspect ratio for standard landscape video scenes
3. Commit immediately via `commit_scene_code({ imageDataUrl })` — no Remotion code needed

```
generate_image({
  prompt: "Close-up of a barista pouring latte art, warm café lighting, bokeh background, cinematic",
  aspectRatio: "16:9",
  model: "imageFlash"
})
→ { imageDataUrl: "data:image/png;base64,..." }

commit_scene_code({ imageDataUrl })
```

## Negative Prompts

> **🚨 RULE: Never put arrows, callout lines, labels, annotations, pointer graphics, or text overlays inside the generated image pixels.** Those must always be separate Remotion SVG overlay layers — use the `AnnotationArrow` pattern from the **tutorial** skill. Generated image pixels must stay clean.

Use `negativePrompt` to avoid distracting or off-brand elements:

```
negativePrompt: "text, watermark, logo, arrows, callouts, boxes, annotation graphics, blurry, low quality, distorted faces, labels, pointer lines, captions"
```

Generated image pixels should stay clean. Add explanatory arrows, cursors, callout cards, and labels in Remotion overlay layers, not inside the generated image itself.

## Compositing with Remotion

If you want to add a Remotion overlay (text, animation, progress bar) on top of a generated image,
use the `image` scene to generate the background and pair it with a `title` or `animation` scene
that references it as a background layer. The Story Planner should schedule these scenes sequentially
or use Remotion's `<AbsoluteFill>` stacking when building the final comp.

### Arrows, Callouts & Annotation Graphics

**Never ask the image model to draw arrows or labels.** Instead, use the `tutorial` skill's `AnnotationArrow` component — an SVG path with animated `stroke-dashoffset` draw-on and an arrowhead marker:

```tsx
// From tutorial skill: AnnotationArrow
// SVG quadratic bezier path that draws itself over ~40% of the composition
const drawProgress = interpolate(frame, [10, durationInFrames * 0.4], [0, 1], { extrapolateRight: "clamp" });
const PATH_LENGTH = 400;
const dashOffset = PATH_LENGTH * (1 - drawProgress);

<AbsoluteFill>
  {/* Generated image as a static background */}
  <Img src={imageDataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

  {/* Arrow overlay — pure Remotion SVG, never part of the image */}
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
      </marker>
    </defs>
    <path
      d="M 200 400 Q 300 200 520 180"
      fill="none"
      stroke="#f59e0b"
      strokeWidth="3"
      strokeDasharray={PATH_LENGTH}
      strokeDashoffset={dashOffset}
      markerEnd="url(#arrowhead)"
    />
  </svg>

  {/* Label */}
  <div style={{ position: "absolute", left: 80, top: 360, color: "#fbbf24", fontSize: 32, fontFamily: "Inter, sans-serif", fontWeight: 700 }}>
    Key Feature
  </div>
</AbsoluteFill>
```
