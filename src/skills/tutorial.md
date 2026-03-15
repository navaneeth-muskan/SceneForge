# Tutorial & Explainer Components

Use these patterns when the prompt involves: how-to guides, step-by-step tutorials, product walkthroughs, feature explanations, annotated screenshots, cursor demonstrations, onboarding videos, or educational content.

---

## StepCallout

Numbered badge + label that springs in, used for sequential tutorial steps. Stack multiple inside `<Sequence>` blocks.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  type Step = { number: number; title: string; description: string; color: string };
  const steps: Step[] = [
    { number: 1, title: 'Install the package',    description: 'Run npm install in your terminal',      color: '#6366f1' },
    { number: 2, title: 'Configure your API key', description: 'Add NEXT_PUBLIC_KEY to your .env file', color: '#8b5cf6' },
    { number: 3, title: 'Import and use',         description: 'Call createClient() to get started',    color: '#a78bfa' },
  ];

  const stepDuration = Math.floor(durationInFrames / steps.length);

  return (
    <AbsoluteFill style={{ background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {steps.map((step, i) => {
        const stepFrame = frame - i * stepDuration;
        const isVisible = stepFrame >= 0;
        const isActive = stepFrame >= 0 && frame < (i + 1) * stepDuration + stepDuration * 0.5;

        const entryScale = isVisible
          ? spring({ frame: Math.max(0, stepFrame), fps: 30, config: { stiffness: 150, damping: 18 } })
          : 0;
        const entryOpacity = isVisible
          ? interpolate(Math.max(0, stepFrame), [0, 10], [0, 1], { extrapolateRight: "clamp" })
          : 0;
        const dimOpacity = isActive ? 1 : 0.35;

        return (
          <div key={step.number} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 28,
            marginBottom: 36,
            opacity: entryOpacity * dimOpacity,
            transform: `scale(${0.85 + entryScale * 0.15}) translateX(${interpolate(Math.max(0, stepFrame), [0, 15], [-60, 0], { extrapolateRight: "clamp" })}px)`,
            width: 960,
          }}>
            {/* Number badge */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: isActive ? step.color : '#27272a',
              border: `2px solid ${isActive ? step.color : '#3f3f46'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isActive ? `0 0 32px ${step.color}66` : 'none',
              transition: 'none',
            }}>
              <span style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 28 }}>{step.number}</span>
            </div>
            {/* Text */}
            <div>
              <div style={{ color: '#f4f4f5', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 32, lineHeight: 1.2 }}>{step.title}</div>
              <div style={{ color: '#71717a', fontFamily: 'Inter, sans-serif', fontSize: 22, marginTop: 6, lineHeight: 1.5 }}>{step.description}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```

---

## SpotlightCursor

Dark vignette overlay with a bright circular spotlight that spring-moves between focus positions — perfect for highlighting UI elements.

**Critical**: The waypoint finder must track the *frame at which the previous waypoint ended* correctly, so the spring always starts from 0 at the right time and interpolates toward the right destination.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Define spotlight waypoints: x/y in % of canvas, spotlight moves to each in sequence
  // 'until' is the frame at which this waypoint ends and next one begins
  const waypoints = [
    { x: 20, y: 30, until: 40  },  // spotlight sits at (20%, 30%) until frame 40
    { x: 75, y: 55, until: 80  },  // then moves to (75%, 55%) until frame 80
    { x: 50, y: 75, until: 110 },  // then moves to (50%, 75%) until frame 110
  ];

  // Find which waypoint is currently active and when it started
  // wpIdx  = index of the waypoint the cursor is moving TOWARD
  // wpStart = frame at which that move began (= previous waypoint's 'until', or 0)
  let wpIdx = 0;
  let wpStart = 0;
  for (let i = 0; i < waypoints.length; i++) {
    if (frame <= waypoints[i].until) {
      wpIdx = i;
      wpStart = i === 0 ? 0 : waypoints[i - 1].until;
      break;
    }
    // If we passed all waypoints, stay at the last one
    wpIdx = waypoints.length - 1;
    wpStart = waypoints.length > 1 ? waypoints[waypoints.length - 2].until : 0;
  }

  // fromWp = position we are coming FROM (previous waypoint, or same waypoint if first)
  const fromWp = wpIdx > 0 ? waypoints[wpIdx - 1] : waypoints[0];
  const toWp   = waypoints[wpIdx];

  // elapsed frames since this waypoint's move started
  const elapsed = Math.max(0, frame - wpStart);
  const moveProgress = spring({ frame: elapsed, fps: 30, config: { stiffness: 90, damping: 22 } });

  // Interpolate position from previous waypoint to current destination
  const spotX = interpolate(moveProgress, [0, 1], [fromWp.x, toWp.x]);
  const spotY = interpolate(moveProgress, [0, 1], [fromWp.y, toWp.y]);

  // Spotlight radius pulses slightly
  const spotRadius = 140 + Math.sin(frame * 0.1) * 8;

  // Convert % to px for SVG
  const cursorX = (spotX / 100) * width;
  const cursorY = (spotY / 100) * height;

  return (
    <AbsoluteFill>
      {/* Background — replace with actual screenshot or UI mock */}
      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)' }}>
        {/* Mock UI elements */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '35%', height: 60, background: '#313244', borderRadius: 8, border: '1px solid #45475a' }} />
        <div style={{ position: 'absolute', top: '45%', left: '55%', width: '30%', height: 80, background: '#313244', borderRadius: 8, border: '1px solid #45475a' }} />
        {/* This is the button the cursor should click at waypoint[2] (50%, 75%) */}
        <div style={{ position: 'absolute', top: '65%', left: '30%', width: '40%', height: 48, background: '#6366f1', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
          Submit
        </div>
      </div>

      {/* Dark overlay with spotlight cutout via SVG mask */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <mask id="spotMask">
            <rect width="100%" height="100%" fill="white" />
            <circle cx={cursorX} cy={cursorY} r={spotRadius} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotMask)" />
        {/* Spotlight glow ring */}
        <circle cx={cursorX} cy={cursorY} r={spotRadius + 4} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
      </svg>

      {/* Cursor dot */}
      <div style={{
        position: 'absolute',
        left: cursorX - 10,
        top: cursorY - 10,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 0 16px rgba(255,255,255,0.8)',
      }} />
    </AbsoluteFill>
  );
};
```

**Tip**: Always make `waypoint[i].x` and `waypoint[i].y` match the actual `left`/`top` percentages of the target UI element — so `{ x: 50, y: 75 }` points at a button at `left: 50%, top: 75%`. Off-by-one errors in the loop mean the cursor interpolates from the wrong start position.



---

## ProgressTracker

Horizontal step tracker with glowing active step and animated fill bar — shows overall tutorial progress.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const steps = ['Setup', 'Configure', 'Build', 'Deploy', 'Done'];
  const progress = interpolate(frame, [0, durationInFrames], [0, steps.length - 1], { extrapolateRight: "clamp" });
  const activeStep = Math.min(Math.floor(progress), steps.length - 1);

  const containerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: '#0f0f23', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        opacity: containerOpacity,
        width: 1200,
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Title */}
        <div style={{ color: '#6366f1', fontSize: 28, letterSpacing: 3, textTransform: 'uppercase', textAlign: 'center', marginBottom: 56, fontWeight: 500 }}>
          Getting Started Guide
        </div>
        {/* Steps row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {steps.map((step, i) => {
            const isCompleted = i < activeStep;
            const isActive = i === activeStep;
            const isFuture = i > activeStep;

            const stepColor = isCompleted ? '#6366f1' : isActive ? '#818cf8' : '#27272a';
            const textColor = isCompleted ? '#818cf8' : isActive ? '#e0e7ff' : '#52525b';

            // Fill bar between steps
            const fillProgress = isCompleted ? 1 : isActive ? (progress - activeStep) : 0;

            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
                {/* Step circle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: stepColor,
                    border: `2px solid ${isActive ? '#818cf8' : isCompleted ? '#6366f1' : '#3f3f46'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? '0 0 0 6px rgba(99,102,241,0.25)' : 'none',
                  }}>
                    {isCompleted
                      ? <span style={{ color: '#fff', fontSize: 26 }}>✓</span>
                      : <span style={{ color: isFuture ? '#52525b' : '#fff', fontSize: 22, fontWeight: 700 }}>{i + 1}</span>
                    }
                  </div>
                  <span style={{ color: textColor, fontSize: 24, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>{step}</span>
                </div>
                {/* Connector bar */}
                {i < steps.length - 1 && (
                  <div style={{ width: 100, height: 2, background: '#27272a', margin: '0 4px', marginBottom: 28, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${fillProgress * 100}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 1 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

---

## AnnotationArrow

SVG curved arrow that draws itself and points at a target element with an explanatory label.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Arrow draws over first 40% of duration
  const drawProgress = interpolate(frame, [10, durationInFrames * 0.4], [0, 1], { extrapolateRight: "clamp" });
  const labelOpacity = interpolate(frame, [durationInFrames * 0.35, durationInFrames * 0.5], [0, 1], { extrapolateRight: "clamp" });

  // SVG path for a curved arrow from label to target
  // Customize these coordinates for your use case
  const startX = 200, startY = 300;
  const endX = 520, endY = 180;
  const cpX = 300, cpY = 150; // control point for curve

  // Total path length (approximate for quadratic bezier): sum of small segments
  const pathLength = 400; // rough estimate — browser will calculate exactly via getTotalLength()
  const dashOffset = pathLength * (1 - drawProgress);

  return (
    <AbsoluteFill style={{ background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background element being annotated */}
      <div style={{
        position: 'absolute',
        left: endX - 80,
        top: endY - 32,
        width: 160,
        height: 64,
        background: '#6366f1',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 700,
        fontSize: 26,
        boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
      }}>
        New Feature
      </div>

      {/* SVG Arrow */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
          </marker>
        </defs>
        <path
          d={`M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={pathLength}
          strokeDashoffset={dashOffset}
          markerEnd="url(#arrowhead)"
        />
      </svg>

      {/* Label at arrow start */}
      <div style={{
        position: 'absolute',
        left: startX - 80,
        top: startY - 16,
        opacity: labelOpacity,
        fontFamily: 'Inter, sans-serif',
        color: '#fbbf24',
        fontSize: 26,
        fontWeight: 600,
        background: 'rgba(0,0,0,0.6)',
        padding: '8px 16px',
        borderRadius: 8,
        border: '1px solid rgba(251, 191, 36, 0.3)',
        backdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
      }}>
        Click here first!
      </div>
    </AbsoluteFill>
  );
};
```

---

## ZoomRegion

Zooms into a specific rectangular region of the scene — simulates screen zoom during a tutorial.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Zoom region: defined as % of canvas
  const zoomRegion = { x: 30, y: 20, width: 40, height: 35 }; // center, dimensions in %

  // Zoom in, hold, zoom out
  const zoomIn  = interpolate(frame, [0, 20], [1, 2.5], { extrapolateRight: "clamp" });
  const zoomOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [2.5, 1], { extrapolateLeft: "clamp" });
  const zoomScale = frame < durationInFrames - 20 ? zoomIn : zoomOut;

  // Pan to keep region centered
  const originX = zoomRegion.x + zoomRegion.width / 2; // % of canvas
  const originY = zoomRegion.y + zoomRegion.height / 2;

  const translateX = (50 - originX) * (zoomScale - 1);
  const translateY = (50 - originY) * (zoomScale - 1);

  // Highlight border around the region, visible at 1x zoom
  const borderOpacity = interpolate(frame, [0, 15, 18], [1, 1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* The content being zoomed — replace with your actual scene */}
      <div style={{
        transform: `scale(${zoomScale}) translate(${translateX}%, ${translateY}%)`,
        transformOrigin: `${originX}% ${originY}%`,
        willChange: 'transform',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
      }}>
        {/* Mock UI panels */}
        <div style={{ position: 'absolute', left: '5%', top: '10%', width: '40%', height: '80%', background: '#181825', borderRadius: 12, padding: 24, border: '1px solid #313244' }}>
          <div style={{ color: '#cdd6f4', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 28 }}>Dashboard</div>
          {/* Emphasized area */}
          <div style={{
            marginTop: 24,
            padding: 16,
            background: '#313244',
            borderRadius: 8,
            border: `2px solid rgba(99, 102, 241, ${borderOpacity})`,
            boxShadow: `0 0 20px rgba(99,102,241,${borderOpacity * 0.4})`,
          }}>
            <div style={{ color: '#a6adc8', fontSize: 24, marginBottom: 4 }}>Total Revenue</div>
            <div style={{ color: '#cdd6f4', fontSize: 32, fontWeight: 900 }}>$48,290</div>
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        background: 'rgba(0,0,0,0.7)',
        color: '#a6adc8',
        fontFamily: 'monospace',
        fontSize: 26,
        padding: '8px 20px',
        borderRadius: 8,
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" }),
      }}>
        {zoomScale.toFixed(1)}×
      </div>
    </AbsoluteFill>
  );
};
```

---

## FeatureHighlight

Glassmorphism card with a large icon, headline, and supporting description — ideal for announcing a feature or benefit.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  type Feature = { icon: string; headline: string; description: string; accent: string };
  const features: Feature[] = [
    { icon: '🚀', headline: 'One-Click Deploy', description: 'Ship to production in seconds with zero config', accent: '#6366f1' },
    { icon: '🔒', headline: 'Secure by Default', description: 'End-to-end encryption on every request', accent: '#10b981' },
    { icon: '⚡', headline: 'Blazing Fast', description: 'Edge-cached globally for < 50ms response times', accent: '#f59e0b' },
  ];

  const itemDuration = Math.floor(durationInFrames / features.length);

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      {features.map((feat, i) => {
        const featureFrame = frame - i * itemDuration;
        const visible = featureFrame >= 0;
        const entryProgress = visible
          ? spring({ frame: Math.max(0, featureFrame), fps: 30, config: { stiffness: 130, damping: 18 } })
          : 0;
        const opacity = visible
          ? interpolate(Math.max(0, featureFrame), [0, 12], [0, 1], { extrapolateRight: 'clamp' })
          : 0;

        return (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 36,
            marginBottom: 32,
            opacity,
            transform: `translateY(${interpolate(entryProgress, [0, 1], [40, 0])}px)`,
            width: 960,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${feat.accent}44`,
            borderRadius: 20,
            padding: '28px 40px',
            backdropFilter: 'blur(12px)',
            boxShadow: `0 0 40px ${feat.accent}22`,
          }}>
            <div style={{ fontSize: 64, flexShrink: 0 }}>{feat.icon}</div>
            <div>
              <div style={{ color: '#f4f4f5', fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 36, lineHeight: 1.1 }}>{feat.headline}</div>
              <div style={{ color: '#a1a1aa', fontFamily: 'Inter, sans-serif', fontSize: 24, marginTop: 8, lineHeight: 1.4 }}>{feat.description}</div>
            </div>
            <div style={{ marginLeft: 'auto', width: 8, height: 56, borderRadius: 4, background: feat.accent, flexShrink: 0 }} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```

---

## KeyboardShortcut

Animated keystroke sequence — keys press down one by one to demonstrate a keyboard shortcut.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  type Key = { label: string; wide?: boolean };
  const keys: Key[] = [
    { label: 'Ctrl', wide: true },
    { label: '+', wide: false },
    { label: 'Shift', wide: true },
    { label: '+', wide: false },
    { label: 'P', wide: false },
  ];
  const shortcutLabel = 'Open Command Palette';

  const keyDuration = Math.floor((durationInFrames * 0.6) / keys.length);
  const currentKeyIdx = Math.floor(frame / keyDuration);

  const containerEntry = spring({ frame, fps: 30, config: { stiffness: 100, damping: 20 } });
  const labelOpacity = interpolate(frame, [durationInFrames * 0.65, durationInFrames * 0.8], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 48 }}>
      {/* Keys row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transform: `scale(${0.7 + containerEntry * 0.3})`,
      }}>
        {keys.map((key, i) => {
          const isPlus = key.label === '+';
          const isPressed = i <= currentKeyIdx;
          const pressFrame = i * keyDuration;
          const pressSpring = isPressed
            ? spring({ frame: frame - pressFrame, fps: 30, config: { stiffness: 400, damping: 15 } })
            : 0;
          const scale = isPressed ? 1 - Math.max(0, 0.08 * pressSpring * (1 - pressSpring) * 4) : 1;

          if (isPlus) return (
            <span key={i} style={{ color: '#52525b', fontSize: 36, fontFamily: 'Inter, sans-serif', fontWeight: 300 }}>{key.label}</span>
          );

          return (
            <div key={i} style={{
              minWidth: key.wide ? 140 : 96,
              height: 96,
              background: isPressed ? '#6366f1' : '#1c1c1e',
              border: `2px solid ${isPressed ? '#818cf8' : '#3f3f46'}`,
              borderBottom: isPressed ? `4px solid #4338ca` : `4px solid #27272a`,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${scale}) translateY(${isPressed ? 2 : 0}px)`,
              boxShadow: isPressed ? '0 0 24px rgba(99,102,241,0.5)' : '0 4px 12px rgba(0,0,0,0.5)',
              transition: 'none',
            }}>
              <span style={{ color: isPressed ? '#fff' : '#a1a1aa', fontSize: 28, fontFamily: '"Fira Code", monospace', fontWeight: 700 }}>{key.label}</span>
            </div>
          );
        })}
      </div>
      {/* Label */}
      <div style={{
        opacity: labelOpacity,
        color: '#e4e4e7',
        fontSize: 32,
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        letterSpacing: 0.5,
      }}>{shortcutLabel}</div>
    </AbsoluteFill>
  );
};
```

---

## ChecklistReveal

Animated checklist where items appear and get immediately checked off — great for summarizing steps or requirements.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const items = [
    'Install Node.js 18+',
    'Clone the repository',
    'Copy .env.example to .env',
    'Run npm install',
    'Start with npm run dev',
  ];

  const itemDuration = Math.floor(durationInFrames / items.length);

  return (
    <AbsoluteFill style={{ background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
      <div style={{ width: 900, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ color: '#6366f1', fontSize: 28, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40, fontWeight: 600 }}>Setup Checklist</div>
        {items.map((text, i) => {
          const itemFrame = frame - i * itemDuration;
          const visible = itemFrame >= 0;
          const slideProgress = visible
            ? spring({ frame: Math.max(0, itemFrame), fps: 30, config: { stiffness: 160, damping: 20 } })
            : 0;
          const checkFrame = itemFrame - 8;
          const checked = checkFrame >= 0;
          const checkProgress = checked
            ? spring({ frame: Math.max(0, checkFrame), fps: 30, config: { stiffness: 300, damping: 18 } })
            : 0;

          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              marginBottom: 20,
              opacity: visible ? interpolate(Math.max(0, itemFrame), [0, 8], [0, 1], { extrapolateRight: 'clamp' }) : 0,
              transform: `translateX(${interpolate(slideProgress, [0, 1], [-60, 0])}px)`,
            }}>
              {/* Checkbox */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                border: `2px solid ${checked ? '#10b981' : '#3f3f46'}`,
                background: checked ? '#10b98122' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transform: `scale(${0.7 + checkProgress * 0.3})`,
                transition: 'none',
              }}>
                {checked && (
                  <span style={{ color: '#10b981', fontSize: 26, fontWeight: 700, transform: `scale(${checkProgress})`, display: 'inline-block' }}>✓</span>
                )}
              </div>
              {/* Label */}
              <span style={{
                color: checked ? '#f4f4f5' : '#71717a',
                fontSize: 28,
                fontWeight: checked ? 600 : 400,
                textDecoration: 'none',
              }}>{text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## BeforeAfter

Split-screen wipe comparing two states — great for showing a UI before and after a change.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Wipe progress: hold at 50% for the first half, then wipe to 90%
  const wipeX = interpolate(
    frame,
    [10, durationInFrames * 0.3, durationInFrames * 0.6, durationInFrames - 10],
    [0, width * 0.5, width * 0.5, width * 0.88],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const labelOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: 'Inter, sans-serif' }}>
      {/* AFTER panel (right, shows through the wipe) */}
      <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f1729 0%, #1a2744 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontSize: 96, fontWeight: 900, lineHeight: 1 }}>$48,290</div>
            <div style={{ color: '#34d399', fontSize: 30, marginTop: 12 }}>↑ +24% this month</div>
            <div style={{ color: '#6ee7b7', fontSize: 22, marginTop: 8 }}>New Dashboard</div>
          </div>
        </div>
      </AbsoluteFill>

      {/* BEFORE panel (left, clips to wipeX) */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: wipeX, height, overflow: 'hidden' }}>
        <div style={{ width, height, background: 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#a1a1aa', fontSize: 80, fontWeight: 700, lineHeight: 1 }}>$38,912</div>
            <div style={{ color: '#71717a', fontSize: 28, marginTop: 12 }}>No trend data</div>
            <div style={{ color: '#52525b', fontSize: 22, marginTop: 8 }}>Old Dashboard</div>
          </div>
        </div>
      </div>

      {/* Divider line */}
      <div style={{ position: 'absolute', left: wipeX - 2, top: 0, width: 4, height, background: '#fff', opacity: 0.9, boxShadow: '0 0 20px rgba(255,255,255,0.6)' }} />

      {/* Labels */}
      <div style={{ position: 'absolute', top: 40, left: 40, opacity: labelOpacity }}>
        <span style={{ background: 'rgba(0,0,0,0.7)', color: '#a1a1aa', fontSize: 22, padding: '8px 20px', borderRadius: 24, border: '1px solid #3f3f46' }}>Before</span>
      </div>
      <div style={{ position: 'absolute', top: 40, right: 40, opacity: labelOpacity }}>
        <span style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: 22, padding: '8px 20px', borderRadius: 24, border: '1px solid #10b981' }}>After</span>
      </div>
    </AbsoluteFill>
  );
};
```

---

## TooltipCallout

A floating tooltip bubble that springs in and points at a highlighted UI element.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const tooltipEntry = spring({ frame: Math.max(0, frame - 8), fps: 30, config: { stiffness: 200, damping: 20 } });
  const tooltipOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  // Exit fade
  const exitOpacity = interpolate(frame, [durationInFrames - 15, durationInFrames - 5], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = tooltipOpacity * exitOpacity;

  // Target element position
  const targetX = 640, targetY = 420, targetW = 320, targetH = 56;
  // Tooltip position (above the target)
  const tipW = 480, tipH = 120;
  const tipX = targetX + targetW / 2 - tipW / 2;
  const tipY = targetY - tipH - 24;

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', fontFamily: 'Inter, sans-serif' }}>
      {/* Background UI element being highlighted */}
      <div style={{
        position: 'absolute',
        left: targetX, top: targetY, width: targetW, height: targetH,
        background: '#6366f1',
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 24, fontWeight: 700,
        boxShadow: `0 0 0 ${interpolate(frame, [0, 20], [0, 6], { extrapolateRight: 'clamp' })}px rgba(99,102,241,0.5)`,
      }}>Submit</div>

      {/* Tooltip bubble */}
      <div style={{
        position: 'absolute',
        left: tipX, top: tipY,
        width: tipW,
        opacity,
        transform: `scale(${0.7 + tooltipEntry * 0.3}) translateY(${interpolate(tooltipEntry, [0, 1], [16, 0])}px)`,
      }}>
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 14,
          padding: '18px 24px',
          color: '#f1f5f9',
          fontSize: 22,
          lineHeight: 1.4,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
        }}>
          💡 Clicking Submit will send your form data to the API and trigger a confirmation email.
        </div>
        {/* Arrow pointer */}
        <div style={{
          position: 'absolute',
          bottom: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '12px solid #334155',
        }} />
      </div>
    </AbsoluteFill>
  );
};
```

---

## Tips

- For multi-step tutorials, wrap each `StepCallout` step in `<Sequence from={step * stepDuration} durationInFrames={stepDuration}>` — each step is self-contained
- **anime.js easing**: For smooth step transitions use `import { eases } from "animejs"; const eased = eases.easeOutBack(progress)` — gives a satisfying overshoot on arrival
- The `SpotlightCursor` works best when layered over actual UI screenshots passed in via `<Img>` from an uploaded asset
- Keep `AnnotationArrow` paths short (< 400px); longer paths need correct `pathLength` computation
- `ZoomRegion` can be combined with `<Img src={screenshotUrl} />` to zoom into a real product screenshot
- For "click" animations: scale cursor to 0.7 for 3 frames then back to 1.0 — mimics a real mouse click
