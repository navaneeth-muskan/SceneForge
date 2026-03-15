---
name: font-sizes
description: Correct font sizes for Remotion video at 1920x1080 resolution
metadata:
  tags: font, text, fontSize, readability, 1080p
---

## Font Sizes Must Be Much Larger Than Normal CSS

Remotion renders at **1920×1080** pixels (or similar). At that resolution, a `fontSize: 14`
looks like microscopic text — the same as 4pt on a printed page.

**Always use these minimum sizes:**

| Text role | Minimum fontSize |
|---|---|
| Hero headline | 96px+ |
| Section subtitle | 60px |
| Body / description | 40px |
| Caption / label | 32px |
| Axis tick / small note | 28px |
| **Absolute minimum** | **28px** — never go below this |

```tsx
// ❌ Too small — completely unreadable in video
<span style={{ fontSize: 14 }}>Monthly Growth</span>
<span style={{ fontSize: 18 }}>+24%</span>

// ✅ Readable at 1920×1080
<span style={{ fontSize: 32, color: "#94a3b8" }}>Monthly Growth</span>
<span style={{ fontSize: 96, fontWeight: 900, color: "#f1f5f9" }}>+24%</span>
```

## Scale Font Sizes with Canvas Size

For components that could render at different resolutions, scale relative to canvas dimensions:

```tsx
const { width, height } = useVideoConfig();

// Scale relative to canvas width (1920 is the base)
const scale = width / 1920;
const HEADLINE = Math.round(96 * scale);  // → 96 at 1920, 54 at 1080
const BODY     = Math.round(40 * scale);  // → 40 at 1920, 22 at 1080
const CAPTION  = Math.round(32 * scale);  // → 32 at 1920, 18 at 1080
```

## Always Set fontFamily

Never rely on browser font defaults — they look unprofessional in video output.

```tsx
// ✅ Always set explicitly
fontFamily: "Inter, sans-serif"      // for UI / tech scenes
fontFamily: '"Fira Code", monospace' // for terminal / code scenes
fontFamily: "Comic Sans MS, cursive" // for kids / playful scenes
```
