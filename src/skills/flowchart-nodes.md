---
title: Flowchart Node Systems
impact: HIGH
impactDescription: improves workflow, architecture, and decision-tree explainers with animated node graphs
tags: flowchart-nodes, nodes, decision-tree, data-flow, process graph, software architecture
---

# Flowchart & Node Patterns

Use this when prompts involve process maps, algorithm branches, decision trees, software architecture pipelines, or data-routing logic.

---

## AnimatedFlowchart

Nodes pop in sequence, connectors self-draw, and a glowing packet shows active data flow.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nodes = [
    { id: "start", label: "Trigger Event", x: 200, y: 540, delay: 0 },
    { id: "process", label: "Process Data", x: 800, y: 540, delay: 30 },
    { id: "success", label: "Success DB", x: 1400, y: 300, delay: 60 },
    { id: "error", label: "Error Log", x: 1400, y: 780, delay: 60 },
  ];

  const lines = [
    { from: 0, to: 1, delay: 15 },
    { from: 1, to: 2, delay: 45 },
    { from: 1, to: 3, delay: 45 },
  ];

  return (
    <AbsoluteFill style={{ background: "#111827", fontFamily: "Inter, sans-serif" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {lines.map((line, i) => {
          const start = nodes[line.from];
          const end = nodes[line.to];

          const lineDraw = interpolate(frame - line.delay, [0, 15], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          const pathLength = 800;

          const packetProgress = interpolate(frame - line.delay - 15, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
            extrapolateLeft: "clamp",
          });
          const packetX = start.x + (end.x - start.x) * packetProgress;
          const packetY = start.y + (end.y - start.y) * packetProgress;
          const showPacket = frame > line.delay + 15 && packetProgress < 1;

          return (
            <g key={i}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#374151"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={pathLength}
                strokeDashoffset={pathLength * (1 - lineDraw)}
              />
              {showPacket && (
                <circle cx={packetX} cy={packetY} r="8" fill="#10b981" style={{ filter: "drop-shadow(0 0 10px #10b981)" }} />
              )}
            </g>
          );
        })}
      </svg>

      {nodes.map((node, i) => {
        const pop = spring({ frame: frame - node.delay, fps, config: { stiffness: 150, damping: 14 } });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              transform: `translate(-50%, -50%) scale(${pop})`,
              background: "#1f2937",
              border: "2px solid #4b5563",
              borderRadius: 16,
              padding: "24px 40px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              color: "#f9fafb",
              fontSize: 28,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: node.id === "error" ? "#ef4444" : "#10b981" }} />
            {node.label}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```
