---
name: tailwind
description: Using TailwindCSS in Remotion.
metadata:
---

TailwindCSS v4 is **installed and enabled** in this project via `@remotion/tailwind-v4`. You can freely use `className` with Tailwind utility classes in generated Remotion components.

```tsx
// ✅ Both styles and className work — use whichever is cleaner
<div className="flex items-center gap-4 rounded-2xl bg-slate-800 p-6">
  <span className="text-4xl font-bold text-white">{title}</span>
</div>
```

**Restrictions:**
- Never use `transition-*`, `animate-*`, or `duration-*` Tailwind classes — these rely on CSS timing and won't render correctly in video. Always animate with `useCurrentFrame()` + `interpolate()`/`spring()`
- For font sizes, prefer explicit `text-[96px]` arbitrary values or inline `style={{ fontSize: 96 }}` — Tailwind's `text-xl` / `text-5xl` classes use rem units which may be too small at 1920×1080

```tsx
// ❌ CSS animation classes — broken in Remotion
<div className="animate-bounce transition-all duration-300">

// ✅ Frame-driven animation — correct
const y = interpolate(spring({ frame, fps }), [0, 1], [60, 0]);
<div className="flex items-center" style={{ transform: `translateY(${y}px)` }}>
```
