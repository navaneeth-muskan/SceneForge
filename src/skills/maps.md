# Maps & Geographic Visualizations

Two approaches — choose based on what the user needs:

| | react-simple-maps | Mapbox GL JS |
|---|---|---|
| Requires API token | No | Yes (`REMOTION_MAPBOX_TOKEN`) |
| Rendering | SVG (works everywhere) | WebGL (`--gl=angle` for render) |
| Best for | Highlighted country maps, markers, data overlays | Animated camera paths, realistic map tiles, flight routes |

---

## Option A — react-simple-maps (SVG, no token needed)

Use this when the user has NOT configured a Mapbox token, or for simple country/marker maps.

### Package
```
react-simple-maps
```
Already installed in this project.

### Core Imports
```tsx
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
```

### Standard GeoJSON URL
```tsx
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
```

### Basic World Map
```tsx
export const SceneComp = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
  const HIGHLIGHTED = ["840", "826", "276", "250", "392"]; // US, UK, Germany, France, Japan

  const mapIn = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 1200, opacity: mapIn, transform: `scale(${0.85 + mapIn * 0.15})` }}>
        <ComposableMap projection="geoMercator" style={{ width: "100%", height: "auto" }}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={HIGHLIGHTED.includes(geo.id) ? "#3b82f6" : "#1e293b"}
                  stroke="#0f172a"
                  strokeWidth={0.5}
                  style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>
    </AbsoluteFill>
  );
};
```

### Pulsing Markers
```tsx
// Inside ComposableMap after Geographies:
{[
  { name: "New York", coords: [-74.006, 40.7128] as [number, number] },
  { name: "London",   coords: [-0.1276, 51.5074] as [number, number] },
  { name: "Tokyo",    coords: [139.6917, 35.6895] as [number, number] },
].map(({ name, coords }, i) => {
  const mf = frame - i * 10;
  const markerIn = spring({ frame: mf, fps, config: { damping: 14, stiffness: 200 } });
  const pulse = Math.sin((frame - i * 15) * 0.12) * 0.5 + 0.5;
  return (
    <Marker key={name} coordinates={coords}>
      <circle r={8 + pulse * 6} fill="none" stroke="#3b82f6" strokeWidth={2} opacity={0.5 - pulse * 0.4} />
      <circle r={5} fill="#3b82f6" opacity={markerIn} />
      <text textAnchor="middle" y={-12} style={{ fontSize: 26, fill: "#94a3b8", opacity: markerIn }}>{name}</text>
    </Marker>
  );
})}
```

### ISO Numeric Country IDs (common)

| ID  | Country        | ID  | Country      |
|-----|----------------|-----|--------------|
| 840 | United States  | 156 | China        |
| 826 | United Kingdom | 356 | India        |
| 276 | Germany        | 076 | Brazil       |
| 250 | France         | 036 | Australia    |
| 392 | Japan          | 124 | Canada       |

---

## Option B — Mapbox GL JS (WebGL, camera animation, real tiles)

Use this for cinematic camera movements, flight routes, zooming into cities.

**Requires:** `REMOTION_MAPBOX_TOKEN` env variable and `--gl=angle` render flag.

### Packages
```
mapbox-gl @turf/turf @types/mapbox-gl
```

### Basic Setup
```tsx
import { useEffect, useRef } from "react";
import { AbsoluteFill, delayRender, continueRender, useVideoConfig } from "remotion";
import mapboxgl from "mapbox-gl";

export const SceneComp = () => {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { width, height } = useVideoConfig();
  const handleRef = useRef<number | null>(null);

  useEffect(() => {
    handleRef.current = delayRender("Loading map...");
    const _map = new mapboxgl.Map({
      container: ref.current!,
      zoom: 11.5,
      center: [-118.2437, 34.0522], // Los Angeles
      style: "mapbox://styles/mapbox/standard",
      interactive: false,
      fadeDuration: 0,
    });
    mapRef.current = _map;
    _map.on("load", () => {
      if (handleRef.current !== null) continueRender(handleRef.current);
      handleRef.current = null;
    });

    return () => {
      _map.remove();
      mapRef.current = null;
    };
  }, []);

  return <AbsoluteFill ref={ref} style={{ width, height, position: "absolute" }} />;
};
```

### Camera Animation
```tsx
// Drive camera with useCurrentFrame():
// CRITICAL: Do NOT call delayRender/continueRender in the frame effect.
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], { extrapolateRight: "clamp" });
  const cam = map.getFreeCameraOptions();
  cam.lookAtPoint({ lng: -118.2437, lat: 34.0522 });
  map.setFreeCameraOptions(cam);
}, [frame]);
```

### Render Command
```sh
npx remotion render --gl=angle
```

---

## Notes

- For agent-generated code, prefer **react-simple-maps** (no token required)
- For user-directed Mapbox work, check that `REMOTION_MAPBOX_TOKEN` is in `.env`
- In this app, Mapbox token injection is handled by the compiler host. Avoid setting `mapboxgl.accessToken` inside generated scene code.
- Never call `delayRender()` inside `[frame, map]` camera effects (causes update-depth loops / black frames in Player mode).
- See `src/examples/code/world-map.ts` for the full react-simple-maps example


