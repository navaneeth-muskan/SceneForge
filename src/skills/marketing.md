---
title: Marketing Motion Hooks
impact: HIGH
impactDescription: improves short-form ad impact with energetic text and high-retention pacing
tags: marketing, stomp-text, hook, promo, teaser, campaign
---

# Marketing Patterns

Use these patterns for high-energy promos, launch hooks, conversion-first ads, event teasers, and short-form campaign videos.

---

## KineticStompText

Fast headline swaps with aggressive scale punches. Great for opening hooks in Reels, Shorts, and paid social creatives.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();

  const words = ["FASTER.", "SMARTER.", "STRONGER.", "NOW."];
  const framesPerWord = 15;

  const idx = Math.min(Math.floor(frame / framesPerWord), words.length - 1);
  const currentWord = words[idx];
  const local = frame % framesPerWord;

  const scale = interpolate(local, [0, 5, 15], [1.5, 1, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flashMix = interpolate(local, [0, 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isLast = idx === words.length - 1;

  const bg = isLast ? "#000000" : `rgb(${Math.round(255 * (1 - flashMix))}, ${Math.round(255 * (1 - flashMix))}, ${Math.round(255 * (1 - flashMix))})`;
  const txt = isLast ? "#fbbf24" : `rgb(${Math.round(255 * flashMix)}, ${Math.round(255 * flashMix)}, ${Math.round(255 * flashMix)})`;

  return (
    <AbsoluteFill style={{ background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: txt, fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: 280, letterSpacing: -10, lineHeight: 0.9, textAlign: "center", transform: `scale(${scale})` }}>
        {currentWord}
      </div>
    </AbsoluteFill>
  );
};
```

---

## Usage Notes

- Keep message blocks short (single words or compact phrases).
- Use this pattern in the first 1-3 seconds to maximize retention.
- Pair with strong rhythmic audio beats for best perceived impact.
- Reserve gold or accent color for final payoff word.
