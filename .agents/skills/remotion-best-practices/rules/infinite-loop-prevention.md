---
name: infinite-loop-prevention
description: Prevent Maximum update depth exceeded errors in Remotion components
metadata:
  tags: useEffect, setState, infinite loop, dependencies, react
---

## Never Call setState Inside useEffect Without Stable Dependencies

The most common Remotion runtime error is `Maximum update depth exceeded`, caused by
`setState` being called inside `useEffect` with an unstable or missing dependency array.

**Forbidden pattern (infinite loop):**
```tsx
// ❌ Object literal in deps = new reference every render = infinite loop
useEffect(() => {
  setConfig({ width: 1920, height: 1080 });
}, [{ width: 1920, height: 1080 }]);

// ❌ No dependency array = runs after every render
useEffect(() => {
  setCount(count + 1);
});
```

**Correct patterns:**
```tsx
// ✅ Empty array = run once on mount
useEffect(() => {
  setInitialValue(computeValue());
}, []);

// ✅ Primitive dependency (stable)
useEffect(() => {
  setLabel(name.toUpperCase());
}, [name]);

// ✅ Memoized object dependency
const config = useMemo(() => ({ width: 1920, height: 1080 }), []);
useEffect(() => {
  applyConfig(config);
}, [config]);
```

## Remotion Components Should Not Use useEffect for Animation

In Remotion, **all animation state must derive from `frame`** — not from React state
that is updated via `useEffect`. Using `useEffect` to update animation values on frame
changes will cause infinite loops.

**Forbidden (useEffect for animation):**
```tsx
// ❌ This causes an infinite re-render loop
const [scale, setScale] = useState(0);
useEffect(() => {
  setScale(frame / 30); // triggers re-render → new frame → re-render...
}, [frame]);
```

**Correct (derive directly from frame):**
```tsx
// ✅ Pure computation from frame — no setState needed
const scale = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
```

## When useEffect IS Acceptable in Remotion

Only use `useEffect` for:
1. One-time setup/teardown (empty dep array `[]`)
2. Reacting to non-frame prop changes (e.g., `[videoSrc]`)
3. Event listener registration

Never use `useEffect` to sync animation state — always compute from `frame` directly.
