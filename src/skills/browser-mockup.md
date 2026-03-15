---
title: Browser Mockup & Spotlight
impact: HIGH
impactDescription: improves app-demo clarity by focusing attention on exact UI regions
tags: browser-mockup, social, app-demo, spotlight, window, linkedin, youtube
---

# Browser Mockup Patterns

Use this when prompts mention browser windows, social feed demos, UI walkthroughs, post highlighting, LinkedIn feed focus, or YouTube interface explainers.

---

## SocialFocusSpotlight

macOS-style browser reveal with a dimmed overlay and spotlight cutout around one focal card.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowScale = spring({ frame, fps, config: { damping: 14 } });
  const focusFrame = Math.max(0, frame - 30);
  const focusProgress = spring({ frame: focusFrame, fps, config: { damping: 20 } });

  const overlayOpacity = interpolate(focusProgress, [0, 1], [0, 0.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ringWidth = interpolate(focusProgress, [0, 1], [0, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
      <div style={{ width: 1400, height: 800, background: "#f1f5f9", borderRadius: 16, boxShadow: "0 40px 100px rgba(0,0,0,0.4)", overflow: "hidden", transform: `scale(${windowScale})`, position: "relative" }}>
        <div style={{ height: 50, background: "#cbd5e1", display: "flex", alignItems: "center", padding: "0 20px", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#f59e0b" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#10b981" }} />
          <div style={{ marginLeft: 20, background: "#e2e8f0", borderRadius: 8, padding: "4px 16px", color: "#64748b", fontSize: 24, flex: 1, maxWidth: 420 }}>linkedin.com/feed</div>
        </div>

        <div style={{ display: "flex", height: "100%", padding: 40, gap: 40 }}>
          <div style={{ width: 300, background: "#fff", borderRadius: 12, height: 400, border: "1px solid #e2e8f0" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ height: 120, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0" }} />
            <div style={{ position: "relative", height: 350, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#3b82f6" }} />
                <div>
                  <div style={{ width: 120, height: 16, background: "#94a3b8", borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: 80, height: 12, background: "#cbd5e1", borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ width: "100%", height: 16, background: "#e2e8f0", borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: "80%", height: 16, background: "#e2e8f0", borderRadius: 4, marginBottom: 24 }} />
              <div style={{ width: "100%", height: 160, background: "#bfdbfe", borderRadius: 8 }} />

              <div style={{ position: "absolute", top: -12, left: -12, right: -12, bottom: -12, borderRadius: 24, boxShadow: `0 0 0 9999px rgba(0,0,0,${overlayOpacity})`, border: `${ringWidth}px solid #3b82f6`, pointerEvents: "none", opacity: focusProgress }} />
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```
