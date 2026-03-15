# Terminal & Code Components

Use these patterns when the prompt involves: code typing animation, terminal output, CLI commands, syntax highlighting, developer tools, code walkthroughs, programming tutorials, or diff views.

---

## CodeWindow

A full-canvas VS Code-style editor where code types character-by-character as the video plays. The editor fills the entire frame — title bar at top, code area below.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const code = `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // 55`;

  // Type characters progressively over 80% of duration, hold for rest
  const typeProgress = interpolate(frame, [0, durationInFrames * 0.8], [0, 1], { extrapolateRight: 'clamp' });
  const visibleChars = Math.floor(typeProgress * code.length);
  const visibleCode = code.slice(0, visibleChars);

  // Cursor blink (every 15 frames)
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  const contentOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });

  const lines = visibleCode.split('\n');

  return (
    <AbsoluteFill style={{ background: '#1e1e1e', fontFamily: '"Fira Code", "Courier New", monospace' }}>
      {/* Title bar — full width at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56,
        background: '#2d2d2d', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12,
      }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ff5f56' }} />
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#27c93f' }} />
        <span style={{ marginLeft: 20, color: '#999', fontSize: 24 }}>fibonacci.js</span>
      </div>
      {/* Code area fills everything below the title bar */}
      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, bottom: 0,
        background: '#1e1e1e', padding: '40px 0', overflow: 'hidden',
        overflowX: 'hidden', opacity: contentOpacity,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', minHeight: 52 }}>
            <span style={{ width: 88, paddingRight: 28, textAlign: 'right', color: '#555', fontSize: 26, userSelect: 'none', flexShrink: 0, lineHeight: '52px' }}>{i + 1}</span>
            <span style={{ color: '#d4d4d4', fontSize: 30, lineHeight: '52px', whiteSpace: 'pre', overflowX: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 88px)' }}>
              {line.split(/(<kw>.*?<\/kw>|<num>.*?<\/num>|<comment>.*?<\/comment>|<str>.*?<\/str>)/).map((part, j) => {
                if (part.startsWith('<kw>')) return <span key={j} style={{ color: '#569cd6' }}>{part.slice(4, -5)}</span>;
                if (part.startsWith('<num>')) return <span key={j} style={{ color: '#b5cea8' }}>{part.slice(5, -6)}</span>;
                if (part.startsWith('<comment>')) return <span key={j} style={{ color: '#6a9955', fontStyle: 'italic' }}>{part.slice(9, -10)}</span>;
                if (part.startsWith('<str>')) return <span key={j} style={{ color: '#ce9178' }}>{part.slice(5, -6)}</span>;
                return part;
              })}
              {i === lines.length - 1 && cursorVisible && (
                <span style={{ background: '#aeafad', width: 3, height: 34, display: 'inline-block', verticalAlign: 'middle', marginLeft: 2 }} />
              )}
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
```

---

## TerminalOutput

Full-canvas dark terminal. The shell prompt and command type out, then output lines appear one by one. The terminal background fills the entire frame.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const command = 'git clone https://github.com/user/repo.git';
  const outputLines = [
    "Cloning into 'repo'...",
    'remote: Enumerating objects: 142, done.',
    'remote: Counting objects: 100% (142/142), done.',
    'Receiving objects: 100% (142/142), 48.3 KiB | 2.1 MiB/s, done.',
    '✓ Done! Repository cloned successfully.',
  ];

  // Type command over first 30% of duration
  const cmdProgress = interpolate(frame, [0, durationInFrames * 0.3], [0, 1], { extrapolateRight: 'clamp' });
  const cmdChars = Math.floor(cmdProgress * command.length);

  // Output lines appear after command is typed
  const outputStart = durationInFrames * 0.32;
  const outputLineInterval = (durationInFrames * 0.55) / outputLines.length;
  const visibleLineCount = Math.max(0, Math.floor((frame - outputStart) / outputLineInterval));

  const cursorBlink = Math.floor(frame / 12) % 2 === 0;
  const contentOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0d1117', fontFamily: '"Fira Code", monospace' }}>
      {/* Title bar — full width at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56,
        background: '#161b22', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 12,
      }}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ff5f56' }} />
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#ffbd2e' }} />
        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#27c93f' }} />
        <span style={{ color: '#8b949e', fontSize: 24, marginLeft: 12 }}>bash — 120×32</span>
      </div>
      {/* Terminal content fills everything below the title bar */}
      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, bottom: 0,
        padding: '48px 56px', overflow: 'hidden', overflowX: 'hidden', opacity: contentOpacity,
      }}>
        {/* Prompt + command */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'nowrap' }}>
          <span style={{ color: '#3fb950', fontSize: 28, whiteSpace: 'nowrap' }}>user@mac</span>
          <span style={{ color: '#8b949e', fontSize: 28 }}>:</span>
          <span style={{ color: '#58a6ff', fontSize: 28, whiteSpace: 'nowrap' }}>~/projects</span>
          <span style={{ color: '#8b949e', fontSize: 28 }}>$</span>
          <span style={{ color: '#e6edf3', fontSize: 28, whiteSpace: 'pre' }}>
            {command.slice(0, cmdChars)}
            {cmdChars < command.length && cursorBlink && (
              <span style={{ background: '#e6edf3', width: 16, height: 32, display: 'inline-block', verticalAlign: 'middle' }} />
            )}
          </span>
        </div>
        {/* Output lines */}
        {outputLines.slice(0, visibleLineCount).map((line, i) => {
          const lineOpacity = interpolate(frame, [outputStart + i * outputLineInterval, outputStart + i * outputLineInterval + 8], [0, 1], { extrapolateRight: 'clamp' });
          const isSuccess = line.startsWith('✓');
          return (
            <div key={i} style={{ opacity: lineOpacity, color: isSuccess ? '#3fb950' : '#8b949e', fontSize: 26, lineHeight: 2.0, whiteSpace: 'pre' }}>
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## CodeHighlight

Full-canvas code viewer with a sweeping spotlight that highlights key lines sequentially. The dark editor background fills the entire frame.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const codeLines = [
    { text: 'const api = createClient({ baseURL });', highlight: false },
    { text: 'const { data } = await api.get("/users");', highlight: true, label: 'Fetches all users' },
    { text: 'const filtered = data.filter(u => u.active);', highlight: true, label: 'Only active users' },
    { text: 'return filtered.map(u => u.email);', highlight: false },
  ];

  const highlightLines = codeLines.map((l, i) => i).filter(i => codeLines[i].highlight);
  const segmentDuration = durationInFrames / highlightLines.length;
  const currentHighlightIdx = Math.min(Math.floor(frame / segmentDuration), highlightLines.length - 1);
  const currentHighlightLine = highlightLines[currentHighlightIdx];

  const contentOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#1e1e2e', fontFamily: 'monospace', opacity: contentOpacity }}>
      {/* Title bar — full width at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56,
        background: '#181825', display: 'flex', alignItems: 'center', padding: '0 28px',
      }}>
        <span style={{ color: '#cdd6f4', fontSize: 24 }}>utils/api.ts</span>
      </div>
      {/* Code lines fill everything below the title bar */}
      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, bottom: 0,
        background: '#1e1e2e', padding: '40px 0', overflow: 'hidden',
      }}>
        {codeLines.map((line, i) => {
          const isActive = i === currentHighlightLine;
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: 70,
              background: isActive ? 'rgba(203, 166, 247, 0.12)' : 'transparent',
              borderLeft: isActive ? '5px solid #cba6f7' : '5px solid transparent',
              padding: '0 32px 0 0',
            }}>
              <span style={{ width: 88, color: '#585b70', fontSize: 26, textAlign: 'right', paddingRight: 28, flexShrink: 0, lineHeight: '70px' }}>{i + 1}</span>
              <span style={{ color: '#cdd6f4', fontSize: 30, whiteSpace: 'pre', lineHeight: '70px' }}>{line.text}</span>
              {isActive && line.label && (
                <span style={{ marginLeft: 36, color: '#cba6f7', fontSize: 24, fontStyle: 'italic', opacity: interpolate(frame % segmentDuration, [0, 8], [0, 1], { extrapolateRight: 'clamp' }) }}>
                  ← {line.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## DiffView

Full-canvas unified before/after code diff. Deletion lines are red, addition lines are green, and lines are revealed one by one. The diff view fills the entire frame.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  type DiffLine = { type: 'unchanged' | 'removed' | 'added'; text: string };
  const diffLines: DiffLine[] = [
    { type: 'unchanged', text: 'function fetchUser(id) {' },
    { type: 'removed',   text: '-  const res = fetch("/api/user/" + id);' },
    { type: 'added',     text: '+  const res = await fetch(`/api/users/${id}`);' },
    { type: 'removed',   text: '-  return res.json();' },
    { type: 'added',     text: '+  if (!res.ok) throw new Error("Not found");' },
    { type: 'added',     text: '+  return await res.json();' },
    { type: 'unchanged', text: '}' },
  ];

  const contentOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  // Reveal lines one by one
  const lineRevealDuration = durationInFrames / diffLines.length;
  const visibleLines = Math.min(Math.ceil(frame / lineRevealDuration) + 1, diffLines.length);

  const colors: Record<string, { bg: string; text: string }> = {
    unchanged: { bg: 'transparent',                    text: '#cdd6f4' },
    removed:   { bg: 'rgba(243, 139, 168, 0.15)',      text: '#f38ba8' },
    added:     { bg: 'rgba(166, 227, 161, 0.12)',      text: '#a6e3a1' },
  };

  return (
    <AbsoluteFill style={{ background: '#11111b', fontFamily: '"Fira Code", monospace', opacity: contentOpacity }}>
      {/* Title bar — full width at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56,
        background: '#181825', display: 'flex', alignItems: 'center', padding: '0 28px',
      }}>
        <span style={{ color: '#a6adc8', fontSize: 24 }}>fetchUser.js — diff</span>
      </div>
      {/* Diff lines fill everything below the title bar */}
      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, bottom: 0,
        background: '#1e1e2e', padding: '40px 0', overflow: 'hidden',
      }}>
        {diffLines.slice(0, visibleLines).map((line, i) => {
          const lineOpacity = interpolate(frame, [i * lineRevealDuration, i * lineRevealDuration + 6], [0, 1], { extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: 68,
              background: colors[line.type].bg,
              borderLeft: line.type !== 'unchanged' ? `6px solid ${colors[line.type].text}` : '6px solid transparent',
              opacity: lineOpacity,
            }}>
              <span style={{ width: 88, color: '#585b70', fontSize: 26, textAlign: 'right', paddingRight: 28, flexShrink: 0, lineHeight: '68px' }}>{i + 1}</span>
              <span style={{ color: colors[line.type].text, fontSize: 30, whiteSpace: 'pre', lineHeight: '68px' }}>{line.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## Tips

- **Full-canvas layout**: All components use `AbsoluteFill` as the background with `position: 'absolute'` for the title bar (`top: 0, left: 0, right: 0, height: 56`) and code area (`top: 56, left: 0, right: 0, bottom: 0`). Never use a centered floating `<div>` — the editor should fill the entire frame like a real IDE
- Use `interpolate(frame, [0, N], [0, code.length])` for typing animations keyed to frame
- Use `Math.floor(frame / blinkRate) % 2` for cursor blink — no timers needed
- Keep font to `"Fira Code"`, `"Courier New"`, or `monospace` — always available in Remotion's renderer
- Font sizes for 1920×1080: line numbers ~26px, code text ~28-30px, title bar ~20px
- For multi-scene code tutorials, wrap each step in `<Sequence from={N} durationInFrames={M}>` so steps are composable
- **anime.js easing** (available as `animejs`): `import { eases } from "animejs"; const t = eases.easeOutExpo(progress)` gives smooth deceleration for code arrival animations
- **Text overflow**: Always add `overflow: 'hidden'` and `overflowX: 'hidden'` to code area containers. Use `whiteSpace: 'pre'` but add `maxWidth: 'calc(100% - 88px)'` on code `<span>` so long lines don't push outside the frame
- **Infinite loop prevention**: Never call setState or use object/array literals inside `useEffect` dependency arrays — they create a new reference on every render. All computed values used in `useEffect` deps must be primitive (string, number, boolean) or wrapped in `useCallback`/`useMemo`
