# Travel & Map Components (Mapbox GL)

Use these patterns when the prompt involves: travel videos, world maps, country highlights, city locations, route animations, flight paths, journey narratives, destination reveals, geographic data, or anything requiring a real map.

**Requires:** `REMOTION_MAPBOX_TOKEN` environment variable (set in `.env.local`). This is already configured if you see `REMOTION_MAPBOX_TOKEN` in the project's `.env` file.

**How it works in Remotion:** `mapboxgl.Map` is initialized inside `useEffect` after the `<div>` ref is ready. The camera animation is triggered by frame progress milestones rather than CSS transitions — use `map.jumpTo()` or `map.flyTo()` keyed to `currentFrame` ranges.

---

## MapboxScene

Full-screen Mapbox GL map that loads, then flies the camera from a world overview to a specific destination.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Phase milestones (in frames)
  const FLY_START  = 20;  // start flying after initial load
  const FLY_END    = Math.floor(durationInFrames * 0.7);
  const HOLD_START = FLY_END;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],       // start: world overview
      zoom: 1.5,
      pitch: 0,
      bearing: 0,
      interactive: false,    // disable user interaction in video
      attributionControl: false,
      fadeDuration: 0,       // instant tile fade for clean renders
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Drive camera by frame — this runs every frame
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (frame >= FLY_START && frame < HOLD_START) {
      // Progress within fly phase [0, 1]
      const t = (frame - FLY_START) / (FLY_END - FLY_START);
      // Smooth ease: easeInOutQuad
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      map.jumpTo({
        center: [
          interpolate(eased, [0, 1], [0, 139.6917]),   // lon: world → Tokyo
          interpolate(eased, [0, 1], [20, 35.6895]),    // lat: world → Tokyo
        ] as [number, number],
        zoom:    interpolate(eased, [0, 1], [1.5, 11]),
        pitch:   interpolate(eased, [0, 1], [0, 50]),
        bearing: interpolate(eased, [0, 1], [0, -30]),
      });
    }
  }, [frame]);

  const overlayOpacity = interpolate(frame, [durationInFrames - 20, durationInFrames], [0, 0.6], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {/* Dark vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        pointerEvents: 'none',
      }} />
      {/* City name, fades in at destination */}
      <div style={{
        position: 'absolute',
        bottom: 120,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: interpolate(frame, [HOLD_START, HOLD_START + 20], [0, 1], { extrapolateRight: "clamp" }),
        textAlign: 'center',
        color: '#ffffff',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: -1, textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>TOKYO</div>
        <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: 6, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>JAPAN</div>
      </div>
    </AbsoluteFill>
  );
};
```

---

## RouteOverlay

Draws an animated route line on the map that traces from origin to destination over time.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const sourceAddedRef = useRef(false);

  // GeoJSON route: Paris → Tokyo (simplified great-circle waypoints)
  const routeCoords: [number, number][] = [
    [2.3522, 48.8566],   // Paris
    [20, 50],            // Central Europe
    [45, 45],            // Middle East
    [80, 40],            // Central Asia
    [110, 38],           // China
    [139.6917, 35.6895], // Tokyo
  ];

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [70, 45],
      zoom: 2.5,
      pitch: 30,
      bearing: -10,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });

    map.on("load", () => {
      // Full route source
      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoords } },
      });

      // Background (dim) line
      map.addLayer({ id: "route-bg", type: "line", source: "route",
        paint: { "line-color": "rgba(255,255,255,0.1)", "line-width": 2 } });

      // Animated progress line (starts at 0 length)
      map.addSource("route-progress", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [routeCoords[0]] } },
      });
      map.addLayer({ id: "route-progress-line", type: "line", source: "route-progress",
        paint: { "line-color": "#f59e0b", "line-width": 3, "line-blur": 1 } });

      sourceAddedRef.current = true;
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceAddedRef.current) return;

    // Interpolate how many waypoints are visible
    const lineProgress = interpolate(frame, [10, durationInFrames - 20], [0, 1], { extrapolateRight: "clamp" });
    const totalSegments = routeCoords.length - 1;
    const currentSegment = Math.min(Math.floor(lineProgress * totalSegments), totalSegments - 1);
    const segmentProgress = (lineProgress * totalSegments) % 1;

    const visibleCoords: [number, number][] = [
      ...routeCoords.slice(0, currentSegment + 1),
      [
        routeCoords[currentSegment][0] + (routeCoords[currentSegment + 1][0] - routeCoords[currentSegment][0]) * segmentProgress,
        routeCoords[currentSegment][1] + (routeCoords[currentSegment + 1][1] - routeCoords[currentSegment][1]) * segmentProgress,
      ],
    ];

    const src = map.getSource("route-progress") as mapboxgl.GeoJSONSource;
    if (src) {
      src.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: visibleCoords } });
    }
  }, [frame]);

  return (
    <AbsoluteFill>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {/* Route label */}
      <div style={{
        position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" }),
        color: '#fff', fontFamily: 'Inter, sans-serif', textAlign: 'center',
      }}>
        <span style={{ fontSize: 28, fontWeight: 500, letterSpacing: 3, color: 'rgba(255,255,255,0.85)' }}>Paris → Tokyo</span>
      </div>
      {/* Plane icon at route head */}
      <div style={{
        position: 'absolute', top: '45%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 28,
        opacity: interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" }),
      }}>✈️</div>
    </AbsoluteFill>
  );
};
```

---

## LocationPin

A pulsing animated location pin that reveals a destination label.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Pin drops in with spring
  const pinScale = spring({ frame, fps: 30, config: { stiffness: 200, damping: 12 } });
  const pinOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  // Pulse ring
  const pulseProgress = (frame % 45) / 45;
  const pulseScale = interpolate(pulseProgress, [0, 1], [1, 2.5]);
  const pulseOpacity = interpolate(pulseProgress, [0, 0.4, 1], [0.7, 0.3, 0]);

  // Label entrance
  const labelOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const labelX = interpolate(frame, [20, 35], [-20, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid #ef4444',
          transform: `scale(${pulseScale})`,
          opacity: pulseOpacity,
          top: -20,
        }} />
        {/* Pin */}
        <div style={{
          opacity: pinOpacity,
          transform: `scale(${pinScale})`,
          fontSize: 56,
          lineHeight: 1,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
        }}>
          📍
        </div>
        {/* City label */}
        <div style={{
          opacity: labelOpacity,
          transform: `translateX(${labelX}px)`,
          marginTop: 16,
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 36, letterSpacing: -0.5 }}>PARIS</div>
          <div style={{ color: '#94a3b8', fontWeight: 500, fontSize: 26, letterSpacing: 4, marginTop: 4 }}>FRANCE</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, color: '#94a3b8', fontSize: 22 }}>
            <span>48.8566°N</span><span>·</span><span>2.3522°E</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

---

## Tips

- **Token**: `mapboxgl.accessToken` is injected by the runtime compiler sandbox. Do NOT set token inside generated scene code.
- **Interactive false**: Always set `interactive: false` — Remotion renders frames, not interactive sessions
- **fadeDuration: 0**: Set this to prevent tile ghosting between frames during seek
- **No imports/require**: Use the injected global `mapboxgl` object directly in generated scenes.
- **Frame → camera**: Use `map.jumpTo()` (instant, deterministic) rather than `map.flyTo()` (async animation) for per-frame updates
- **Map styles**: `"mapbox://styles/mapbox/dark-v11"`, `"streets-v12"`, `"satellite-streets-v12"`, `"outdoors-v12"`, `"navigation-night-v1"`
- **Great circle routes**: For flight paths, generate waypoints along a great circle; arc-shaped routes look more realistic
- **Country coordinates** (center lat/lng): Japan `[138, 36]`, France `[2.2, 46.2]`, USA `[-95.7, 37.1]`, India `[78.9, 20.6]`, Brazil `[-51.9, -14.2]`, Australia `[133.8, -25.3]`

---

## MultiLocationTour

Use this for stories with multiple destinations and cinematic map choreography.

Required flow per destination:
1. Start from a global map view (all places context)
2. Move camera toward the destination with a visible pointer/marker
3. Show a location card while the map remains visible behind it
4. Do a final camera zoom/pitch/bearing refinement on the MAP (not on image/card)
5. Show text overlays (kicker/title/subline/progress)

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const cities = [
    { name: "TOKYO", country: "JAPAN", coords: [139.6917, 35.6895] as [number, number], zoom: 10.5, pitch: 46, bearing: -24 },
    { name: "PARIS", country: "FRANCE", coords: [2.3522, 48.8566] as [number, number], zoom: 10.2, pitch: 42, bearing: -8 },
    { name: "NEW YORK", country: "USA", coords: [-74.006, 40.7128] as [number, number], zoom: 10.8, pitch: 48, bearing: 12 },
  ];

  // Per-city timeline ratios:
  // overview 15%, travel 35%, card hold 25%, zoom refine 25%
  const phaseFrames = Math.floor(durationInFrames / cities.length);
  const cityIndex = Math.min(cities.length - 1, Math.floor(frame / phaseFrames));
  const city = cities[cityIndex];
  const localFrame = frame - cityIndex * phaseFrames;
  const overviewEnd = Math.floor(phaseFrames * 0.15);
  const travelEnd = Math.floor(phaseFrames * 0.5);
  const cardEnd = Math.floor(phaseFrames * 0.75);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 1.5,
      pitch: 0,
      bearing: 0,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // A) World overview (show global context)
    if (localFrame <= overviewEnd) {
      map.jumpTo({ center: [12, 20], zoom: 1.45, pitch: 0, bearing: 0 });
      return;
    }

    // B) Travel camera toward destination
    const travelT = interpolate(localFrame, [overviewEnd, travelEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const easedTravel = travelT < 0.5 ? 2 * travelT * travelT : -1 + (4 - 2 * travelT) * travelT;

    // C) Card hold: keep destination framing stable while card is visible
    // D) Refine zoom: map camera zoom/pitch/bearing only (never image zoom)
    const refineT = interpolate(localFrame, [cardEnd, phaseFrames - 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const baseZoom = interpolate(easedTravel, [0, 1], [1.45, city.zoom]);
    const zoomRefined = interpolate(refineT, [0, 1], [baseZoom, city.zoom + 1.8]);

    map.jumpTo({
      center: [
        interpolate(easedTravel, [0, 1], [12, city.coords[0]]),
        interpolate(easedTravel, [0, 1], [20, city.coords[1]]),
      ] as [number, number],
      zoom: zoomRefined,
      pitch: interpolate(refineT, [0, 1], [city.pitch * 0.75, city.pitch]),
      bearing: interpolate(refineT, [0, 1], [city.bearing * 0.6, city.bearing]),
    });
  }, [city, localFrame, overviewEnd, travelEnd, cardEnd, phaseFrames]);

  const cardIn = spring({ frame: localFrame - travelEnd + 6, fps: 30, config: { damping: 14, stiffness: 140 } });
  const cardOpacity = interpolate(cardIn, [0, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardY = interpolate(cardIn, [0, 1], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = Math.sin(localFrame * 0.16) * 0.5 + 0.5;
  const pointerX = interpolate(localFrame, [overviewEnd, travelEnd], [18, 50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pointerY = interpolate(localFrame, [overviewEnd, travelEnd], [22, 50], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const overlayKickerOpacity = interpolate(localFrame, [travelEnd - 8, travelEnd + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const progressText = `${cityIndex + 1}/${cities.length}`;

  return (
    <AbsoluteFill>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {/* Moving pointer while travelling */}
        <div style={{
          position: "absolute",
          left: `${pointerX}%`,
          top: `${pointerY}%`,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#38bdf8",
          transform: "translate(-50%, -50%)",
          opacity: localFrame < travelEnd ? 0.9 : 0,
          boxShadow: "0 0 16px rgba(56,189,248,0.8)",
        }} />

        {/* Destination marker lock */}
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 22 + pulse * 20,
          height: 22 + pulse * 20,
          borderRadius: "50%",
          border: "2px solid rgba(56, 189, 248, 0.8)",
          transform: "translate(-50%, -50%)",
          opacity: 0.4 + pulse * 0.35,
        }} />

        {/* Text overlay stack */}
        <div style={{ position: "absolute", left: 70, top: 58, opacity: overlayKickerOpacity, color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
          <div style={{ fontSize: 24, letterSpacing: 4, color: "rgba(255,255,255,0.75)" }}>DESTINATION</div>
          <div style={{ marginTop: 8, fontSize: 56, fontWeight: 900, letterSpacing: -1 }}>{city.name}</div>
          <div style={{ marginTop: 6, fontSize: 26, letterSpacing: 3, color: "rgba(255,255,255,0.85)" }}>{city.country}</div>
        </div>

        <div style={{
          position: "absolute",
          left: 70,
          bottom: 74,
          opacity: cardOpacity,
          transform: `translateY(${cardY}px)`,
          padding: "18px 20px",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(12, 18, 28, 0.58)",
          backdropFilter: "blur(14px)",
          color: "#fff",
          fontFamily: "Inter, system-ui, sans-serif",
          minWidth: 300,
        }}>
          <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -0.8 }}>{city.name}</div>
          <div style={{ marginTop: 6, fontSize: 24, letterSpacing: 4, color: "rgba(255,255,255,0.85)" }}>{city.country}</div>
          <div style={{ marginTop: 10, fontSize: 22, letterSpacing: 2, color: "rgba(255,255,255,0.7)" }}>Map remains visible while camera refines zoom</div>
        </div>

        <div style={{
          position: "absolute",
          right: 72,
          bottom: 62,
          color: "rgba(255,255,255,0.78)",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 24,
          letterSpacing: 3,
          opacity: overlayKickerOpacity,
        }}>
          STOP {progressText}
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

---

## LocationRevealCard

Use this for destination reveals where map context transitions into a visual card.

Modes:
- `overlay-zoom`: 3D card enters on top of map while MAP camera performs zoom
- `split`: map stays left, card/image panel slides in on right
- `full-expand`: card grows as an overlay while map remains visible under layers

Important: zoom is always camera-driven on Mapbox (`map.jumpTo` center/zoom/pitch/bearing). Avoid image-only zoom gimmicks.

```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const mode: "overlay-zoom" | "split" | "full-expand" = "overlay-zoom";
  const city = { name: "TOKYO", country: "JAPAN", coords: [139.6917, 35.6895] as [number, number] };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [20, 20],
      zoom: 1.6,
      pitch: 0,
      bearing: 0,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [city.coords]);

  // World -> destination -> refine zoom, all on map camera.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const travelT = interpolate(frame, [10, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const refineT = interpolate(frame, [70, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const eased = travelT < 0.5 ? 2 * travelT * travelT : -1 + (4 - 2 * travelT) * travelT;

    map.jumpTo({
      center: [
        interpolate(eased, [0, 1], [20, city.coords[0]]),
        interpolate(eased, [0, 1], [20, city.coords[1]]),
      ] as [number, number],
      zoom: interpolate(refineT, [0, 1], [9.8, 12.2]),
      pitch: interpolate(refineT, [0, 1], [34, 52]),
      bearing: interpolate(refineT, [0, 1], [-12, -28]),
    });
  }, [frame, durationInFrames, city.coords]);

  const markerPulse = Math.sin(frame * 0.18) * 0.5 + 0.5;
  const cardIn = spring({ frame: frame - 20, fps: 30, config: { damping: 14, stiffness: 170 } });
  const cardRotateY = interpolate(cardIn, [0, 1], [88, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardScale = interpolate(cardIn, [0, 1], [0.72, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const splitX = interpolate(frame, [22, 52], [100, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const splitOpacity = interpolate(frame, [22, 52], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const fullExpand = interpolate(frame, [24, 60], [0.26, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      <div style={{ position: "absolute", left: "50%", top: "50%", width: 18 + markerPulse * 14, height: 18 + markerPulse * 14, borderRadius: "50%", border: "2px solid #38bdf8", transform: "translate(-50%, -50%)" }} />

      {mode === "overlay-zoom" && (
        <div style={{
          position: "absolute",
          right: 70,
          bottom: 64,
          width: 460,
          height: 300,
          borderRadius: 18,
          background: "linear-gradient(145deg, rgba(18,27,39,0.88), rgba(11,16,24,0.82))",
          border: "1px solid rgba(255,255,255,0.16)",
          transform: `perspective(1200px) rotateY(${cardRotateY}deg) scale(${cardScale})`,
          transformOrigin: "right bottom",
          color: "#fff",
          padding: 22,
        }}>
          <div style={{ fontSize: 22, letterSpacing: 3, color: "rgba(255,255,255,0.75)" }}>LIVE MAP FOCUS</div>
          <div style={{ fontSize: 42, fontWeight: 800 }}>{city.name}</div>
          <div style={{ marginTop: 8, fontSize: 24, letterSpacing: 4, color: "rgba(255,255,255,0.85)" }}>{city.country}</div>
          {/* Optional: replace this placeholder with Img for asset/AI image panel */}
          <div style={{ marginTop: 14, height: 120, borderRadius: 12, background: "linear-gradient(135deg, #1e293b, #0f172a)", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
      )}

      {mode === "split" && (
        <div style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: "50%",
          height: "100%",
          opacity: splitOpacity,
          transform: `translateX(${splitX}%)`,
          background: "linear-gradient(180deg, #0f172a, #020617)",
          borderLeft: "1px solid rgba(255,255,255,0.16)",
          display: "flex",
          alignItems: "flex-end",
          padding: 36,
          color: "#fff",
        }}>
          <div>
            <div style={{ fontSize: 48, fontWeight: 900 }}>{city.name}</div>
            <div style={{ marginTop: 8, fontSize: 26, letterSpacing: 5, color: "rgba(255,255,255,0.85)" }}>{city.country}</div>
          </div>
        </div>
      )}

      {mode === "full-expand" && (
        <div style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${fullExpand})`,
          transformOrigin: "50% 50%",
          background: "linear-gradient(165deg, #0b1220, #10172a 45%, #0a0f1c)",
          display: "flex",
          alignItems: "flex-end",
          padding: 44,
          color: "#fff",
        }}>
          <div>
            <div style={{ fontSize: 62, fontWeight: 900 }}>{city.name}</div>
            <div style={{ marginTop: 10, fontSize: 28, letterSpacing: 6, color: "rgba(255,255,255,0.85)" }}>{city.country}</div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
```
