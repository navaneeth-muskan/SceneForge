---
title: Mathematics & Data Explainers
impact: HIGH
impactDescription: improves educational clarity for equations, derivations, and network logic
tags: mathematics, equations, derivation, solver, network, ai, data
---

# Mathematics & Data Patterns

Use these patterns when the prompt involves equation solving, symbolic transformations, model internals, graph reasoning, or step-by-step educational explanation.

---

## EquationSolver

Step-by-step equation animation where each line enters with spring motion while previous lines dim to keep focus on the current step.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    "f(x) = ax^2 + bx + c",
    "f'(x) = 2ax + b",
    "0 = 2ax + b",
    "2ax = -b",
    "x = -b / 2a",
  ];
  const stepDuration = 45;

  return (
    <AbsoluteFill style={{ background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Space Mono, monospace" }}>
      <div style={{ width: 920 }}>
        {steps.map((step, i) => {
          const stepFrame = frame - i * stepDuration;
          const visible = stepFrame >= 0;
          const current = visible && frame < (i + 1) * stepDuration;
          const past = frame >= (i + 1) * stepDuration;
          const entry = visible ? spring({ frame: stepFrame, fps, config: { damping: 14 } }) : 0;
          const opacity = past ? 0.42 : interpolate(entry, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const x = interpolate(entry, [0, 1], [-40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={i}
              style={{
                opacity,
                transform: `translateX(${x}px) scale(${past ? 0.95 : 0.9 + entry * 0.1})`,
                color: current ? "#ffffff" : "#94a3b8",
                fontSize: 52,
                padding: "16px 0 16px 24px",
                borderLeft: current ? "4px solid #38bdf8" : "4px solid transparent",
              }}
            >
              {step}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
```

---

## NodeNetworkGraph

Animated node-link graph for AI/data explanations. Nodes pop in first, then edges draw with staggered dash offsets.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodes = [
    { id: "input", x: 420, y: 540, label: "Input" },
    { id: "h1", x: 960, y: 340, label: "Hidden 1" },
    { id: "h2", x: 960, y: 740, label: "Hidden 2" },
    { id: "out", x: 1500, y: 540, label: "Output" },
  ];
  const edges = [
    { from: 0, to: 1 },
    { from: 0, to: 2 },
    { from: 1, to: 3 },
    { from: 2, to: 3 },
    { from: 1, to: 2 },
  ];

  return (
    <AbsoluteFill style={{ background: "#020617", fontFamily: "Inter, sans-serif" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {edges.map((edge, i) => {
          const from = nodes[edge.from];
          const to = nodes[edge.to];
          const draw = spring({ frame: frame - 28 - i * 10, fps, config: { damping: 20 } });
          const pathLength = 820;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#38bdf8"
              strokeOpacity={0.42}
              strokeWidth={4}
              strokeDasharray={pathLength}
              strokeDashoffset={pathLength * (1 - draw)}
            />
          );
        })}
      </svg>

      {nodes.map((node, i) => {
        const pop = spring({ frame: frame - i * 8, fps, config: { stiffness: 190, damping: 16 } });
        return (
          <div key={node.id} style={{ position: "absolute", left: node.x - 40, top: node.y - 40, width: 80, height: 80, borderRadius: "50%", background: "#0ea5e9", transform: `scale(${pop})`, boxShadow: "0 0 40px rgba(14,165,233,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", top: 92, color: "#e0f2fe", fontSize: 24, fontWeight: 600, whiteSpace: "nowrap" }}>{node.label}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```
