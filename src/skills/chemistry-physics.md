---
title: Chemistry & Physics Visual Systems
impact: HIGH
impactDescription: adds specialized atomic, bonding, and wave-emission animation patterns for STEM explainers
tags: chemistry-physics, atoms, quantum, electrons, covalent, photons, radiation, wave emission
---

# Chemistry & Physics Patterns

Use this when prompts involve atomic models, chemical bonding, wave mechanics, photon emission, or science-first educational visuals.

---

## AtomicOrbitals

Glowing nucleus with multiple tilted orbital rings and continuously orbiting electrons.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulse = Math.sin(frame * 0.1) * 0.1 + 1;
  const nucleusEntrance = spring({ frame, fps, config: { damping: 12 } });

  const orbits = [
    { rx: 65, ry: 45, speed: 2, color: "#38bdf8", electronLabel: "e-" },
    { rx: -65, ry: 45, speed: 1.5, color: "#a855f7", electronLabel: "e-" },
    { rx: 0, ry: 75, speed: 2.5, color: "#4ade80", electronLabel: "e-" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {orbits.map((orbit, i) => {
        const rotationAngle = frame * orbit.speed;
        const orbitEntrance = spring({ frame: frame - i * 15, fps, config: { damping: 20 } });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 500,
              height: 500,
              borderRadius: "50%",
              border: `2px solid ${orbit.color}40`,
              transform: `scale(${orbitEntrance}) rotateX(${orbit.rx}deg) rotateY(${orbit.ry}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `rotateZ(${rotationAngle}deg)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -22,
                  left: 228,
                  width: 44,
                  height: 44,
                  background: orbit.color,
                  borderRadius: "50%",
                  boxShadow: `0 0 20px ${orbit.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `rotateZ(${-rotationAngle}deg) rotateY(${-orbit.ry}deg) rotateX(${-orbit.rx}deg)`,
                }}
              >
                <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>{orbit.electronLabel}</span>
              </div>
            </div>
          </div>
        );
      })}

      <div
        style={{
          width: 100,
          height: 100,
          background: "radial-gradient(circle, #fde047, #f59e0b)",
          borderRadius: "50%",
          boxShadow: "0 0 60px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(255,255,255,0.8)",
          transform: `scale(${nucleusEntrance * pulse})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "#78350f", fontWeight: 900, fontSize: 32 }}>N</span>
      </div>
    </AbsoluteFill>
  );
};
```

---

## ChemicalBonding

Two atoms enter from opposite sides, approach, and reveal a glowing covalent overlap.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterL = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const enterR = spring({ frame: frame - 20, fps, config: { damping: 14 } });
  const bondProgress = spring({ frame: Math.max(0, frame - 50), fps, config: { stiffness: 60, damping: 20 } });

  const leftX = interpolate(bondProgress, [0, 1], [-250, -80]);
  const rightX = interpolate(bondProgress, [0, 1], [250, 80]);
  const overlapGlow = interpolate(bondProgress, [0.8, 1], [0, 1], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ position: "absolute", top: 120, color: "#e2e8f0", fontSize: 48, opacity: overlapGlow }}>
        Covalent Bond Formed
      </h1>

      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            transform: `translateX(${leftX}px) scale(${enterL})`,
            width: 240,
            height: 240,
            borderRadius: "50%",
            border: "4px solid #38bdf8",
            background: "rgba(56, 189, 248, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(56, 189, 248, 0.2)",
          }}
        >
          <span style={{ color: "#38bdf8", fontSize: 64, fontWeight: 800 }}>H</span>
          <div style={{ position: "absolute", right: -12, top: 108, width: 24, height: 24, background: "#38bdf8", borderRadius: "50%" }} />
        </div>

        <div
          style={{
            position: "absolute",
            transform: `translateX(${rightX}px) scale(${enterR})`,
            width: 240,
            height: 240,
            borderRadius: "50%",
            border: "4px solid #a855f7",
            background: "rgba(168, 85, 247, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(168, 85, 247, 0.2)",
          }}
        >
          <span style={{ color: "#a855f7", fontSize: 64, fontWeight: 800 }}>H</span>
          <div style={{ position: "absolute", left: -12, top: 108, width: 24, height: 24, background: "#a855f7", borderRadius: "50%" }} />
        </div>

        <div
          style={{
            position: "absolute",
            width: 140,
            height: 200,
            background: "radial-gradient(ellipse, rgba(255,255,255,0.8), transparent)",
            opacity: overlapGlow,
            filter: "blur(10px)",
            mixBlendMode: "screen",
          }}
        />
        <div style={{ position: "absolute", transform: "translateY(-20px)", width: 24, height: 24, background: "#fff", borderRadius: "50%", opacity: overlapGlow, boxShadow: "0 0 20px #fff" }} />
        <div style={{ position: "absolute", transform: "translateY(20px)", width: 24, height: 24, background: "#fff", borderRadius: "50%", opacity: overlapGlow, boxShadow: "0 0 20px #fff" }} />
      </div>
    </AbsoluteFill>
  );
};
```

---

## WavePhotonEmission

Animated sine wave with periodic photon particles emitted from wave peaks.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();

  const frequency = 0.02;
  const amplitude = 150;
  const speed = frame * 4;

  let path = "M 0 540 ";
  for (let x = 0; x <= 1920; x += 20) {
    const y = 540 + Math.sin((x + speed) * frequency) * amplitude;
    path += `L ${x} ${y} `;
  }

  const photons = [
    { delay: 30, color: "#fcd34d" },
    { delay: 90, color: "#fcd34d" },
    { delay: 150, color: "#fcd34d" },
  ];

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: "Inter, sans-serif" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <path d={path} fill="none" stroke="#6366f1" strokeWidth="8" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 20px #6366f1)" }} />
      </svg>

      {photons.map((photon, i) => {
        if (frame < photon.delay) return null;
        const localFrame = frame - photon.delay;
        const px = 960 + localFrame * 15;
        const py = 390 - localFrame * 10;
        const opacity = interpolate(localFrame, [0, 10, 40, 50], [0, 1, 1, 0]);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: 24,
              height: 24,
              background: photon.color,
              borderRadius: "50%",
              opacity,
              boxShadow: `0 0 40px ${photon.color}, 0 0 80px ${photon.color}`,
            }}
          >
            <div style={{ position: "absolute", left: -40, top: 10, width: 40, height: 4, background: `linear-gradient(90deg, transparent, ${photon.color})`, transform: "rotate(35deg)" }} />
          </div>
        );
      })}

      <div style={{ position: "absolute", bottom: 60, left: 80, color: "#818cf8", fontSize: 32, letterSpacing: 4, textTransform: "uppercase" }}>
        Electromagnetic Wave Emission
      </div>
    </AbsoluteFill>
  );
};
```
