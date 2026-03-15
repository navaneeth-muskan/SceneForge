---
title: Kids Storybook Pop-Up
impact: HIGH
impactDescription: improves whimsical storytelling with playful pop-up depth and staged reveals
tags: kids-story, storybook, fairy-tale, whimsical, pop-up, children
---

# Kids Story Patterns

Use this when prompts mention children stories, fairy tales, whimsical worlds, cartoon narratives, or playful educational scenes.

---

## PopUpStorybook

Cardboard-like objects fold up from the ground plane with hinge rotation and bounce.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const objects = [
    { emoji: "🌲", x: 200, y: 300, size: 200, delay: 0 },
    { emoji: "🏰", x: 800, y: 150, size: 350, delay: 15 },
    { emoji: "🌲", x: 1400, y: 250, size: 250, delay: 5 },
    { emoji: "🐉", x: 500, y: 500, size: 180, delay: 35 },
    { emoji: "🧚", x: 1100, y: 600, size: 150, delay: 45 },
  ];

  const titleOpacity = spring({ frame: frame - 60, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ background: "#87ceeb", perspective: 1200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", height: "40%", background: "#84cc16", transformOrigin: "top", transform: "rotateX(60deg)", position: "absolute", bottom: 0, boxShadow: "inset 0 40px 100px rgba(0,0,0,0.1)" }} />

      {objects.map((obj, i) => {
        const foldUp = spring({ frame: frame - obj.delay, fps, config: { damping: 8, stiffness: 100 } });
        const rotateX = interpolate(foldUp, [0, 1], [90, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{ position: "absolute", left: obj.x, bottom: 1080 - obj.y - obj.size, fontSize: obj.size, lineHeight: 1, transformOrigin: "bottom center", transform: `rotateX(${rotateX}deg)`, filter: "drop-shadow(0 20px 10px rgba(0,0,0,0.3))" }}>
            {obj.emoji}
          </div>
        );
      })}

      <div style={{ position: "absolute", top: 60, width: "100%", textAlign: "center", fontFamily: "Comic Sans MS, cursive, sans-serif", fontSize: 64, color: "#fff", textShadow: "0 4px 10px rgba(0,0,0,0.2)", opacity: titleOpacity }}>
        Once upon a time...
      </div>
    </AbsoluteFill>
  );
};
```

---

## Character Speech Bubble

Dialogue bubble that pops in with a spring, positioned above a character emoji.

```tsx
const SPEAKER = "🐉";
const DIALOGUE = "Where is my castle?!";
const X = 400, Y = 600;

const bubbleEntry = spring({ frame: Math.max(0, frame - 10), fps, config: { damping: 10, stiffness: 200 } });
const opacity = interpolate(Math.max(0, frame - 10), [0, 6], [0, 1], { extrapolateRight: "clamp" });
const bubbleScale = 0.5 + bubbleEntry * 0.5;

return (
  <AbsoluteFill style={{ background: "#87ceeb" }}>
    {/* Character */}
    <div style={{ position: "absolute", left: X, top: Y, fontSize: 160 }}>{SPEAKER}</div>

    {/* Bubble */}
    <div style={{
      position: "absolute",
      left: X - 60,
      top: Y - 180,
      opacity,
      transform: `scale(${bubbleScale})`,
      transformOrigin: "bottom left",
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 32,
        padding: "20px 32px",
        fontFamily: "Comic Sans MS, cursive",
        fontSize: 40,
        color: "#1a1a1a",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        border: "4px solid #e5e7eb",
        maxWidth: 500,
        textAlign: "center",
      }}>
        {DIALOGUE}
      </div>
      {/* Tail */}
      <div style={{
        position: "absolute",
        bottom: -28,
        left: 60,
        width: 0, height: 0,
        borderLeft: "20px solid transparent",
        borderRight: "20px solid transparent",
        borderTop: "30px solid #ffffff",
      }} />
    </div>
  </AbsoluteFill>
);
```

---

## Bouncy Word-Reveal Narrative Text

Each word of a sentence bounces in one by one — great for narration captions.

```tsx
const SENTENCE = "And then the dragon flew away! 🐉";
const WORDS = SENTENCE.split(" ");
const WORD_STAGGER = 8;

return (
  <AbsoluteFill style={{ background: "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
    {WORDS.map((word, i) => {
      const bounce = spring({ frame: frame - i * WORD_STAGGER, fps, config: { damping: 6, stiffness: 180 } });
      const opacity = interpolate(Math.max(0, frame - i * WORD_STAGGER), [0, 6], [0, 1], { extrapolateRight: "clamp" });
      return (
        <span key={i} style={{
          opacity,
          display: "inline-block",
          transform: `translateY(${interpolate(bounce, [0, 1], [40, 0])}px) scale(${0.6 + bounce * 0.4})`,
          fontFamily: "Comic Sans MS, cursive",
          fontSize: 72,
          color: "#451a03",
        }}>
          {word}
        </span>
      );
    })}
  </AbsoluteFill>
);
```

---

## Watercolor Scene Fade

Soft dissolve between scenes using radial washes — painterly and whimsical.

```tsx
const WASH_COLORS = ["#fde68a", "#fbcfe8", "#a5f3fc"];
const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });

return (
  <AbsoluteFill>
    <SceneA />
    {WASH_COLORS.map((color, i) => {
      const delay = i * 0.12;
      const opacity = interpolate(progress, [delay, delay + 0.35, delay + 0.5], [0, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const scale = interpolate(progress, [delay, delay + 0.5], [0.4, 1.8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return (
        <div key={i} style={{
          position: "absolute",
          inset: 0,
          background: color,
          opacity,
          transform: `scale(${scale})`,
          borderRadius: "50%",
          transformOrigin: `${30 + i * 20}% ${40 + i * 10}%`,
          filter: "blur(60px)",
        }} />
      );
    })}
    <div style={{ position: "absolute", inset: 0, opacity: interpolate(progress, [0.4, 0.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
      <SceneB />
    </div>
  </AbsoluteFill>
);
```

---

## Sound-Wave Emoji Bounce

Emoji bounces in sync with imagined music beats — great for musical stories.

```tsx
const EMOJI = "🎵";
const BPM = 120;
const BEAT_FRAMES = (60 / BPM) * fps; // frames per beat

const beatPhase = (frame % BEAT_FRAMES) / BEAT_FRAMES;
const bounce = interpolate(beatPhase, [0, 0.12, 0.25, 1], [0, -40, -20, 0], { extrapolateRight: "clamp" });
const scale = interpolate(beatPhase, [0, 0.1, 0.25, 1], [1, 1.3, 1.1, 1]);

<div style={{
  fontSize: 160,
  transform: `translateY(${bounce}px) scale(${scale})`,
  display: "inline-block",
  filter: `drop-shadow(0 ${Math.abs(bounce) * 0.3}px ${Math.abs(bounce) * 0.5}px rgba(0,0,0,0.3))`,
}}>
  {EMOJI}
</div>
