---
title: Portfolio & Capability Showcases
impact: HIGH
impactDescription: improves portfolio and tech-stack storytelling with polished capability choreography
tags: portfolio, developer, agency, capability, orbit, tech-stack
---

# Portfolio & Capability Patterns

Use these patterns when the prompt involves developer portfolios, agency reels, capability overviews, AI agent feature sets, or technical identity videos.

---

## SkillOrbit

A central identity node with orbiting skill chips that continuously rotate and spring in one-by-one.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const skills = ["React", "Node.js", "Python", "AWS", "Figma", "Remotion"];
  const radius = 350;

  const centerScale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ width: 180, height: 180, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${centerScale})`, boxShadow: "0 0 60px rgba(99,102,241,0.5)", zIndex: 10 }}>
        <span style={{ fontSize: 48, fontWeight: 900, color: "#fff" }}>YOU</span>
      </div>

      {skills.map((skill, i) => {
        const offset = (i / skills.length) * Math.PI * 2;
        const spin = frame * 0.01;
        const angle = offset + spin;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const chipScale = spring({ frame: frame - i * 10 - 20, fps, config: { stiffness: 120, damping: 14 } });

        return (
          <div key={skill} style={{ position: "absolute", transform: `translate(${x}px, ${y}px) scale(${chipScale})`, background: "#1e293b", border: "1px solid #334155", borderRadius: 40, padding: "16px 32px", color: "#e2e8f0", fontSize: 24, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 5 }}>
            {skill}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
```

---

## Usage Notes

- Best with 4-8 orbit chips for readable spacing.
- Use one dominant center label (person, company, or product).
- Add subtle glow and depth contrast to separate center from orbit layer.
- Great as intro or closing capability summary scene.
