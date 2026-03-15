# Brand & Portfolio Components

Use these patterns when the prompt involves: logo reveals, brand identity, portfolio showcases, product mockups, social cards, KPI stats, company presentations, or professional business videos.

---

## LogoReveal

Masked wipe/scale reveal for a logo or brand name with cinematic entrance.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Main reveal spring
  const revealProgress = spring({ frame, fps: 30, config: { stiffness: 80, damping: 22 } });
  const clipWidth = interpolate(revealProgress, [0, 1], [0, 100]);

  // Tagline fades in after logo
  const taglineOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" });
  const taglineY = interpolate(frame, [30, 45], [20, 0], { extrapolateRight: "clamp" });

  // Accent bar sweeps in
  const barWidth = interpolate(frame, [10, 35], [0, 140], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Logo text with clip mask reveal */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          clipPath: `inset(0 ${100 - clipWidth}% 0 0)`,
          willChange: 'clip-path',
        }}>
          <h1 style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 900,
            fontSize: 96,
            letterSpacing: -2,
            color: '#ffffff',
            margin: 0,
            lineHeight: 1,
          }}>
            BRAND
          </h1>
        </div>
        {/* Gold accent bar below logo */}
        <div style={{
          height: 4,
          width: barWidth,
          background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
          borderRadius: 2,
          marginTop: 8,
        }} />
      </div>
      {/* Tagline */}
      <p style={{
        opacity: taglineOpacity,
        transform: `translateY(${taglineY}px)`,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 400,
        fontSize: 30,
        letterSpacing: 6,
        color: '#888',
        marginTop: 20,
        textTransform: 'uppercase',
      }}>
        Design · Build · Launch
      </p>
    </AbsoluteFill>
  );
};
```

---

## SocialCard

Twitter/X-style post card with avatar, handle, post body, and engagement stats that count up.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Card entrance
  const cardY = interpolate(spring({ frame, fps: 30, config: { stiffness: 100, damping: 20 } }), [0, 1], [60, 0]);
  const cardOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  // Stats count up in last 40% of scene
  const statsStart = durationInFrames * 0.6;
  const statsProgress = interpolate(frame, [statsStart, durationInFrames - 10], [0, 1], { extrapolateRight: "clamp" });
  const likes    = Math.floor(statsProgress * 4821);
  const retweets = Math.floor(statsProgress * 1203);
  const replies  = Math.floor(statsProgress * 347);

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a35 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        opacity: cardOpacity,
        transform: `translateY(${cardY}px)`,
        width: 560,
        background: '#16181c',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            🚀
          </div>
          <div>
            <div style={{ color: '#e7e9ea', fontWeight: 700, fontSize: 32 }}>ProductLaunch</div>
            <div style={{ color: '#71767b', fontSize: 28 }}>@productlaunch</div>
          </div>
          <div style={{ marginLeft: 'auto', background: '#1d9bf0', color: '#fff', borderRadius: 20, padding: '10px 24px', fontSize: 28, fontWeight: 700 }}>Follow</div>
        </div>
        {/* Body */}
        <p style={{ color: '#e7e9ea', fontSize: 30, lineHeight: 1.6, margin: '0 0 16px' }}>
          Just shipped v2.0 🎉 Faster, smarter, and now with AI-powered insights. This is the product we've always wanted to build.
        </p>
        {/* Timestamp */}
        <div style={{ color: '#71767b', fontSize: 26, marginBottom: 16 }}>3:47 PM · Mar 12, 2026</div>
        {/* Divider */}
        <div style={{ borderTop: '1px solid #2f3336', paddingTop: 16 }}>
          <div style={{ display: 'flex', gap: 32 }}>
            {[['💬', replies, 'Replies'], ['🔁', retweets, 'Reposts'], ['❤️', likes, 'Likes']].map(([icon, count, label]) => (
              <div key={String(label)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#71767b', fontSize: 26 }}>
                <span style={{ fontSize: 26 }}>{icon}</span>
                <span style={{ color: '#e7e9ea', fontWeight: 700, fontSize: 28 }}>{Number(count).toLocaleString()}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

---

## ProductMockup

Phone or laptop frame with a screenshot inside. Rotates in with smooth arrival.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // GSAP-style easeOut math (no DOM manipulation — just math)
  const rawProgress = Math.min(frame / 40, 1);
  // power3.out: t => 1 - Math.pow(1 - t, 3)
  const eased = 1 - Math.pow(1 - rawProgress, 3);

  const rotateY = interpolate(eased, [0, 1], [35, 0]);
  const translateY = interpolate(eased, [0, 1], [80, 0]);
  const scale = interpolate(eased, [0, 1], [0.7, 1]);
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Subtle float after landing
  const floatY = Math.sin((frame - 50) * 0.04) * 6;

  // Screen glow pulse
  const glowOpacity = interpolate(frame, [durationInFrames * 0.6, durationInFrames], [0.3, 0.7], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg, #0f1117 0%, #1c1c2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow behind device */}
      <div style={{
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(99, 102, 241, ${glowOpacity}) 0%, transparent 70%)`,
        filter: 'blur(60px)',
      }} />
      {/* Phone frame */}
      <div style={{
        opacity,
        transform: `perspective(1200px) rotateY(${rotateY}deg) translateY(${translateY + floatY}px) scale(${scale})`,
        willChange: 'transform',
        width: 280,
        height: 560,
        background: '#1c1c1e',
        borderRadius: 44,
        padding: 12,
        boxShadow: '0 40px 100px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}>
        {/* Screen bezel */}
        <div style={{ width: '100%', height: '100%', borderRadius: 34, overflow: 'hidden', background: '#000', display: 'flex', flexDirection: 'column' }}>
          {/* Status bar */}
          <div style={{ background: '#1c1c1e', padding: '12px 20px 8px', display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: 13, fontWeight: 600 }}>
            <span>9:41</span><span>◉◉◉</span>
          </div>
          {/* App screen mockup */}
          <div style={{ flex: 1, background: 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>⚡</div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 28, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>Your App</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 24, textAlign: 'center', lineHeight: 1.5 }}>Beautiful UI, powerful features</div>
            <div style={{ background: '#fff', borderRadius: 28, padding: '12px 32px', color: '#6366f1', fontWeight: 700, fontSize: 24, marginTop: 8 }}>Get Started</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

---

## StatHighlight

Large KPI number that counts up with an animated accent bar and label.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const stats = [
    { value: 98.7, suffix: '%', label: 'Uptime SLA', color: '#22c55e' },
    { value: 2.4,  suffix: 'M', label: 'Active Users', color: '#6366f1' },
    { value: 340,  suffix: 'ms', label: 'Avg Response', color: '#f59e0b' },
  ];

  const countProgress = interpolate(frame, [10, durationInFrames - 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
  });

  const cardDelay = 12;

  return (
    <AbsoluteFill style={{ background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ color: '#71717a', fontSize: 26, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 48, fontWeight: 500 }}>
        By the numbers
      </h2>
      <div style={{ display: 'flex', gap: 48 }}>
        {stats.map(({ value, suffix, label, color }, i) => {
          const delay = i * cardDelay;
          const cardOpacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
          const cardY = interpolate(frame, [delay, delay + 20], [30, 0], { extrapolateRight: "clamp" });
          const currentVal = countProgress * value;
          const displayVal = value < 10
            ? currentVal.toFixed(1)
            : Math.round(currentVal).toString();
          const barWidth = interpolate(frame, [delay + 8, durationInFrames - 8], [0, 180], { extrapolateRight: "clamp" });
          return (
            <div key={label} style={{ opacity: cardOpacity, transform: `translateY(${cardY}px)`, textAlign: 'center', minWidth: 200 }}>
              <div style={{ fontSize: 80, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -3 }}>
                {displayVal}<span style={{ fontSize: 48, color }}>{suffix}</span>
              </div>
              <div style={{ height: 3, background: color, borderRadius: 2, width: barWidth, margin: '16px auto 12px' }} />
              <div style={{ color: '#a1a1aa', fontSize: 26, letterSpacing: 1 }}>{label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## BrandTicker

Infinite horizontal ticker strip — great for partner logos, feature list, or brand values.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();

  const items = ['Innovation', 'Design', 'Speed', 'Reliability', 'Scale', 'Security', 'Innovation', 'Design', 'Speed', 'Reliability', 'Scale', 'Security'];
  const itemWidth = 220; // px per item
  const totalWidth = items.length * itemWidth;
  const speed = 1.5; // px per frame

  const offset = (frame * speed) % totalWidth;

  const containerOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ opacity: containerOpacity }}>
        <div style={{ color: '#555', fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 24 }}>Trusted Values</div>
        {/* Ticker row */}
        <div style={{ display: 'flex', transform: `translateX(${-offset}px)`, willChange: 'transform' }}>
          {items.map((item, i) => (
            <div key={i} style={{
              minWidth: itemWidth,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '0 20px',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 24, fontWeight: 600, color: '#e5e7eb', whiteSpace: 'nowrap' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
        {/* Fade edges */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 120, height: '100%', background: 'linear-gradient(90deg, #0a0a0a, transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, width: 120, height: '100%', background: 'linear-gradient(-90deg, #0a0a0a, transparent)', pointerEvents: 'none' }} />
      </div>
    </AbsoluteFill>
  );
};
```

---

## Tips

- GSAP easing math (no DOM API): `const eased = 1 - Math.pow(1 - progress, 3)` (power3.out), `1 - Math.pow(1 - t, 4)` (power4.out)
- anime.js easing: `import { eases } from "animejs"; const t = eases.easeOutElastic(progress)` for bouncy arrivals
- Always use `spring()` from Remotion for organic motion — avoid CSS transitions (they don't respect seek/scrub)
- For logos, prefer text-based SVG-friendly text over embedded raster images unless an image URL is provided
- Brand colors: pass them as props or define as constants at the top of the component
