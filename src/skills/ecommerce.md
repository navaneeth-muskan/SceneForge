---
title: E-Commerce Motion Patterns
impact: HIGH
impactDescription: improves product storytelling, conversion emphasis, and social proof visuals
tags: ecommerce, product, reviews, testimonials, callouts, marketing
---

# E-Commerce Patterns

Use these patterns for product promos, feature breakdowns, launch videos, shopping ads, and trust-building social proof scenes.

---

## ProductFeatureCallout

Center product with animated connector lines and floating feature cards. Reveal cards in staggered sequence for premium hardware/software showcases.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { title: "OLED Display", desc: "120Hz ProMotion", x: 220, y: 300, lineX: 460, lineY: 450 },
    { title: "M4 Chip", desc: "10-core CPU", x: 1360, y: 300, lineX: 1460, lineY: 450 },
    { title: "All-day Battery", desc: "Up to 22 hours", x: 260, y: 790, lineX: 510, lineY: 650 },
  ];

  return (
    <AbsoluteFill style={{ background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ width: 400, height: 600, background: "#e5e5e5", borderRadius: 40, border: "8px solid #d4d4d8", boxShadow: "0 40px 100px rgba(0,0,0,0.1)", zIndex: 10 }} />

      {features.map((feature, i) => {
        const delay = i * 20;
        const lineDraw = spring({ frame: frame - delay, fps, config: { damping: 20 } });
        const cardPop = spring({ frame: frame - delay - 10, fps, config: { stiffness: 150, damping: 15 } });
        const pathLength = 520;

        return (
          <div key={feature.title} style={{ position: "absolute", inset: 0 }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}>
              <line
                x1={960}
                y1={540}
                x2={feature.lineX}
                y2={feature.lineY}
                stroke="#a1a1aa"
                strokeWidth={3}
                strokeDasharray={pathLength}
                strokeDashoffset={pathLength * (1 - lineDraw)}
              />
            </svg>
            <div style={{ position: "absolute", left: feature.x, top: feature.y, transform: `scale(${cardPop})`, opacity: cardPop, background: "#fff", padding: "24px 32px", borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.08)", minWidth: 280, zIndex: 20 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#6366f1", marginBottom: 16 }} />
              <div style={{ color: "#09090b", fontSize: 28, fontWeight: 800 }}>{feature.title}</div>
              <div style={{ color: "#71717a", fontSize: 24, marginTop: 4 }}>{feature.desc}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```

---

## ReviewCascade

Stacked 5-star testimonial cards that slide in with overlap, giving social proof momentum without clutter.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reviews = [
    { name: "Sarah J.", text: "Absolutely changed the way my team works. 10/10." },
    { name: "Mike T.", text: "The cleanest UI I have ever used. Highly recommend." },
    { name: "Elena R.", text: "Worth every penny. Customer support is incredible!" },
  ];

  const headingOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <h2 style={{ fontSize: 52, fontWeight: 800, color: "#0f172a", marginBottom: 60, opacity: headingOpacity }}>Loved by thousands</h2>
      <div style={{ position: "relative", width: 860, height: 420 }}>
        {reviews.map((review, i) => {
          const delay = i * 25;
          const slide = spring({ frame: frame - delay, fps, config: { damping: 16, stiffness: 120 } });
          const y = interpolate(slide, [0, 1], [220, i * 116], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const rotation = i % 2 === 0 ? -2 : 2;

          return (
            <div key={review.name} style={{ position: "absolute", width: "100%", background: "#fff", borderRadius: 24, padding: 32, border: "1px solid #e2e8f0", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", transform: `translateY(${y}px) rotate(${rotation}deg) scale(${slide})`, opacity: slide, zIndex: reviews.length - i }}>
              <div style={{ color: "#fbbf24", fontSize: 28, letterSpacing: 4, marginBottom: 12 }}>★★★★★</div>
              <div style={{ color: "#334155", fontSize: 26, fontWeight: 500, lineHeight: 1.4, marginBottom: 16 }}>&quot;{review.text}&quot;</div>
              <div style={{ color: "#94a3b8", fontSize: 24, fontWeight: 700 }}>- {review.name}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```
