# Table & Data Grid Components

Use these patterns when the prompt involves: data tables, comparison grids, feature matrices, pricing tables, leaderboards, schedules, spec sheets, before/after comparisons, or any structured row/column data.

---

## DataTable

Full-canvas animated data table. Rows cascade in one by one with a fade + slide. Header row is always visible; each data row appears on a staggered delay. Ideal for stats, results, metrics, or any tabular data.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const columns = ['Player', 'Score', 'Level', 'Status'];
  const rows = [
    ['Alice',   '9,840', '42', '🟢 Active'],
    ['Bob',     '7,210', '38', '🟢 Active'],
    ['Charlie', '5,430', '31', '🟡 Idle'],
    ['Diana',   '4,980', '29', '🟢 Active'],
    ['Evan',    '2,150', '17', '🔴 Offline'],
  ];

  const HEADER_H = 80;
  const ROW_H = 90;
  const COL_WIDTHS = [480, 280, 240, 280]; // px, must sum to ≤ canvas width
  const rowDelay = 8; // frames between each row appearing

  const headerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 1400 }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          opacity: headerOpacity,
          borderBottom: '2px solid #334155',
          marginBottom: 4,
        }}>
          {columns.map((col, ci) => (
            <div key={ci} style={{
              width: COL_WIDTHS[ci],
              height: HEADER_H,
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              color: '#94a3b8',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              {col}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {rows.map((row, ri) => {
          const rowFrame = frame - (ri + 1) * rowDelay;
          const rowOpacity = interpolate(rowFrame, [0, 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const rowX = interpolate(rowFrame, [0, 16], [-40, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const isEven = ri % 2 === 0;

          return (
            <div key={ri} style={{
              display: 'flex',
              opacity: rowOpacity,
              transform: `translateX(${rowX}px)`,
              background: isEven ? 'rgba(255,255,255,0.03)' : 'transparent',
              borderRadius: 8,
              borderBottom: '1px solid #1e293b',
            }}>
              {row.map((cell, ci) => (
                <div key={ci} style={{
                  width: COL_WIDTHS[ci],
                  height: ROW_H,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 24px',
                  color: ci === 0 ? '#f1f5f9' : '#cbd5e1',
                  fontSize: ci === 0 ? 26 : 24,
                  fontWeight: ci === 0 ? 600 : 400,
                  flexShrink: 0,
                }}>
                  {cell}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## ComparisonTable

Feature matrix comparing options (plans, tools, frameworks). Columns are options; rows are features. Checkmarks/crosses animate in. Highlighted column draws attention to the "recommended" option.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const plans = ['Free', 'Pro', 'Enterprise'];
  const highlightCol = 1; // 0-based — "Pro" is highlighted
  const features = [
    { label: 'Projects',          values: ['3',     'Unlimited', 'Unlimited'] },
    { label: 'Team members',      values: ['1',     '10',        'Unlimited'] },
    { label: 'Custom domain',     values: [false,   true,        true] },
    { label: 'Priority support',  values: [false,   true,        true] },
    { label: 'SSO / SAML',        values: [false,   false,       true] },
    { label: 'SLA guarantee',     values: [false,   false,       true] },
  ];

  const COL_W = 300;
  const LABEL_W = 460;
  const ROW_H = 80;
  const HEADER_H = 100;
  const rowDelay = 6;

  const headerScale = spring({ frame, fps: 30, config: { stiffness: 140, damping: 18 } });

  return (
    <AbsoluteFill style={{ background: '#09090b', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: LABEL_W + COL_W * plans.length }}>
        {/* Column headers */}
        <div style={{ display: 'flex', transform: `scaleY(${headerScale})`, transformOrigin: 'top', marginBottom: 8 }}>
          <div style={{ width: LABEL_W }} />
          {plans.map((plan, ci) => (
            <div key={ci} style={{
              width: COL_W,
              height: HEADER_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: ci === highlightCol ? '#a78bfa' : '#e2e8f0',
              background: ci === highlightCol ? 'rgba(167,139,250,0.12)' : 'transparent',
              borderRadius: ci === highlightCol ? '12px 12px 0 0' : 0,
              borderTop: ci === highlightCol ? '2px solid #a78bfa' : '2px solid transparent',
              borderLeft: ci === highlightCol ? '2px solid #a78bfa' : '2px solid transparent',
              borderRight: ci === highlightCol ? '2px solid #a78bfa' : '2px solid transparent',
            }}>
              {plan}
            </div>
          ))}
        </div>

        {/* Feature rows */}
        {features.map((feat, ri) => {
          const rowFrame = frame - ri * rowDelay;
          const rowOpacity = interpolate(rowFrame, [0, 14], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

          return (
            <div key={ri} style={{
              display: 'flex',
              opacity: rowOpacity,
              borderBottom: '1px solid #27272a',
              minHeight: ROW_H,
            }}>
              {/* Feature label */}
              <div style={{
                width: LABEL_W,
                display: 'flex',
                alignItems: 'center',
                padding: '0 28px',
                color: '#a1a1aa',
                fontSize: 24,
              }}>
                {feat.label}
              </div>

              {/* Values */}
              {feat.values.map((val, ci) => {
                const isHighlight = ci === highlightCol;
                const isLast = ri === features.length - 1;
                return (
                  <div key={ci} style={{
                    width: COL_W,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    fontWeight: typeof val === 'string' ? 500 : 700,
                    color: val === false ? '#52525b' : isHighlight ? '#c4b5fd' : '#e4e4e7',
                    background: isHighlight ? 'rgba(167,139,250,0.07)' : 'transparent',
                    borderLeft: isHighlight ? '2px solid #a78bfa' : '2px solid transparent',
                    borderRight: isHighlight ? '2px solid #a78bfa' : '2px solid transparent',
                    borderBottom: isHighlight && isLast ? '2px solid #a78bfa' : 'none',
                    borderRadius: isHighlight && isLast ? '0 0 12px 12px' : 0,
                  }}>
                    {typeof val === 'boolean'
                      ? (val
                        ? <span style={{ color: '#4ade80', fontSize: 32 }}>✓</span>
                        : <span style={{ color: '#52525b', fontSize: 32 }}>✕</span>)
                      : val}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## Leaderboard

Animated ranked list where entries fly in from the right, optionally with a score bar. Each rank gets its own staggered entrance. First place gets special highlighting. Use for top-N lists, rankings, scores, results.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const entries = [
    { rank: 1, name: 'Alice Johnson',   score: 9840, badge: '🥇' },
    { rank: 2, name: 'Bob Martinez',    score: 7210, badge: '🥈' },
    { rank: 3, name: 'Carol Kim',       score: 5430, badge: '🥉' },
    { rank: 4, name: 'David Chen',      score: 4980, badge: '' },
    { rank: 5, name: 'Eva Petrova',     score: 2150, badge: '' },
  ];

  const maxScore = entries[0].score;
  const entryDelay = 10;
  const ROW_H = 110;
  const BAR_MAX_W = 520;

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg, #0f0c29, #302b63, #24243e)', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 1200 }}>
        {/* Title */}
        <div style={{
          textAlign: 'center',
          color: '#ffd700',
          fontSize: 48,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginBottom: 48,
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          Leaderboard
        </div>

        {entries.map((entry, i) => {
          const entryFrame = frame - i * entryDelay;
          const entryOpacity = interpolate(entryFrame, [0, 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const entryX = interpolate(entryFrame, [0, 18], [80, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const barProgress = interpolate(entryFrame, [12, 30], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const barW = (entry.score / maxScore) * BAR_MAX_W * barProgress;
          const isFirst = i === 0;

          return (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              height: ROW_H,
              opacity: entryOpacity,
              transform: `translateX(${entryX}px)`,
              marginBottom: 8,
              background: isFirst ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.03)',
              borderRadius: 12,
              border: isFirst ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
              padding: '0 28px',
            }}>
              {/* Badge / rank */}
              <div style={{ width: 56, textAlign: 'center', fontSize: isFirst ? 40 : 28, flexShrink: 0 }}>
                {entry.badge || <span style={{ color: '#6b7280', fontWeight: 700 }}>#{entry.rank}</span>}
              </div>

              {/* Name */}
              <div style={{
                flex: 1,
                color: isFirst ? '#fde047' : '#e2e8f0',
                fontSize: isFirst ? 30 : 26,
                fontWeight: isFirst ? 700 : 500,
                flexShrink: 0,
                minWidth: 280,
              }}>
                {entry.name}
              </div>

              {/* Animated score bar */}
              <div style={{ position: 'relative', width: BAR_MAX_W, height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 8, flexShrink: 0 }}>
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: barW,
                  borderRadius: 8,
                  background: isFirst
                    ? 'linear-gradient(90deg, #f59e0b, #fde047)'
                    : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                }} />
              </div>

              {/* Score */}
              <div style={{
                width: 120,
                textAlign: 'right',
                color: isFirst ? '#fde047' : '#94a3b8',
                fontSize: 26,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {entry.score.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## ScheduleTable

Weekly schedule or time-based grid. Columns are days/times, rows are time slots or events. Cells highlight with a sweep animation. Use for calendars, timetables, event schedules, class rosters.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const timeSlots = ['9:00', '10:00', '11:00', '13:00', '14:00', '15:00'];
  // null = free, otherwise event name + color
  const schedule: (null | { label: string; color: string })[][] = [
    [{ label: 'Standup',  color: '#3b82f6' }, null, { label: 'Standup', color: '#3b82f6' }, null, { label: 'Standup', color: '#3b82f6' }],
    [null, { label: 'Design Review', color: '#8b5cf6' }, null, { label: 'Design Review', color: '#8b5cf6' }, null],
    [{ label: '1:1 Alice', color: '#10b981' }, null, null, null, { label: '1:1 Bob', color: '#10b981' }],
    [null, null, { label: 'Sprint Plan', color: '#f59e0b' }, null, null],
    [null, { label: 'Eng Sync', color: '#ef4444' }, null, { label: 'Eng Sync', color: '#ef4444' }, null],
    [null, null, null, null, { label: 'Retro', color: '#ec4899' }],
  ];

  const COL_W = 240;
  const TIME_W = 120;
  const ROW_H = 88;
  const HEADER_H = 72;

  // Sweep: reveal column by column left-to-right
  const totalCols = days.length;
  const colDelay = durationInFrames / (totalCols + 1);

  const headerOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        {/* Header row */}
        <div style={{ display: 'flex', opacity: headerOpacity, borderBottom: '2px solid #1e293b', marginBottom: 4 }}>
          <div style={{ width: TIME_W }} />
          {days.map((day, di) => {
            const colFrame = frame - di * colDelay;
            const colOp = interpolate(colFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
            return (
              <div key={di} style={{
                width: COL_W,
                height: HEADER_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: '0.04em',
                opacity: colOp,
              }}>
                {day}
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        {timeSlots.map((time, ri) => (
          <div key={ri} style={{ display: 'flex', borderBottom: '1px solid #1e293b', minHeight: ROW_H }}>
            {/* Time label */}
            <div style={{
              width: TIME_W,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 20,
              color: '#475569',
              fontSize: 24,
              fontWeight: 500,
            }}>
              {time}
            </div>

            {/* Day cells */}
            {days.map((_, di) => {
              const colFrame = frame - di * colDelay;
              const cellOp = interpolate(colFrame, [0, 14], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
              const event = schedule[ri]?.[di] ?? null;
              return (
                <div key={di} style={{
                  width: COL_W,
                  minHeight: ROW_H,
                  padding: '8px 12px',
                  opacity: cellOp,
                }}>
                  {event && (
                    <div style={{
                      background: `${event.color}22`,
                      border: `1px solid ${event.color}55`,
                      borderLeft: `4px solid ${event.color}`,
                      borderRadius: 8,
                      padding: '10px 16px',
                      color: event.color,
                      fontSize: 24,
                      fontWeight: 600,
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      {event.label}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
```

---

## StatsGrid

2×N or 3×N grid of KPI cards that pop in with spring animations. Each card shows a metric name and value (with optional trend indicator). Ideal for dashboards, reports, business metrics, or summary screens.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const stats = [
    { label: 'Total Users',    value: '1.24M',  trend: '+12%',  trendUp: true,  color: '#6366f1' },
    { label: 'Revenue',        value: '$84,200', trend: '+8.3%', trendUp: true,  color: '#10b981' },
    { label: 'Avg. Session',   value: '4m 32s',  trend: '+5%',   trendUp: true,  color: '#f59e0b' },
    { label: 'Churn Rate',     value: '2.1%',    trend: '-0.4%', trendUp: false, color: '#ef4444' },
    { label: 'NPS Score',      value: '72',      trend: '+4',    trendUp: true,  color: '#8b5cf6' },
    { label: 'Uptime',         value: '99.97%',  trend: '±0',    trendUp: true,  color: '#06b6d4' },
  ];

  const COLS = 3;
  const CARD_W = 520;
  const CARD_H = 200;
  const GAP = 32;

  return (
    <AbsoluteFill style={{ background: '#09090b', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${CARD_W}px)`,
        gap: GAP,
      }}>
        {stats.map((stat, i) => {
          const cardFrame = frame - i * 6;
          const cardScale = spring({ frame: Math.max(0, cardFrame), fps: 30, config: { stiffness: 160, damping: 18 } });
          const cardOpacity = interpolate(Math.max(0, cardFrame), [0, 10], [0, 1], { extrapolateRight: 'clamp' });

          return (
            <div key={i} style={{
              width: CARD_W,
              height: CARD_H,
              background: '#18181b',
              border: `1px solid #27272a`,
              borderTop: `3px solid ${stat.color}`,
              borderRadius: 16,
              padding: '28px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: cardOpacity,
              transform: `scale(${0.8 + cardScale * 0.2})`,
            }}>
              <div style={{ color: '#71717a', fontSize: 26, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {stat.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ color: '#fafafa', fontSize: 44, fontWeight: 800, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{
                  color: stat.trendUp ? '#4ade80' : '#f87171',
                  fontSize: 22,
                  fontWeight: 600,
                  background: stat.trendUp ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                  padding: '6px 14px',
                  borderRadius: 20,
                }}>
                  {stat.trend}
                </div>
              </div>
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

- **Column widths**: Hardcode pixel widths per column and ensure they sum to ≤ 1820px (leaving padding room). Never use `%` — Remotion renders at fixed canvas size (1920×1080)
- **Row heights**: 80–110px for data rows, 60–80px for header rows — gives readable text at video resolution
- **Font sizes**: Labels 20–24px, data values 24–28px, hero numbers 40–50px
- **Staggered row entrance**: Use `frame - i * delayFrames` then `interpolate(..., [0, 12], [0, 1], { extrapolateLeft: 'clamp' })` pattern — clean and frames-accurate
- **Highlight columns**: Use a subtle `rgba` background + colored left/right/top border on the highlighted column container — do NOT use `box-shadow` (not supported in Remotion renderer)
- **Boolean cells**: Use `✓` (green #4ade80) and `✕` (muted #52525b) at fontSize 32 for clear visual contrast at video resolution
- **Long text in cells**: Use `whiteSpace: 'nowrap'` and `overflow: 'hidden'`, `textOverflow: 'ellipsis'` to prevent wrapping
