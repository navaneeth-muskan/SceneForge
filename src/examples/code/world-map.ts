import type { RemotionExample } from "./index";

export const worldMapCode = `
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ISO numeric country IDs to highlight
const HIGHLIGHTED_COUNTRIES = ["840", "826", "276", "250", "392"]; // US, UK, Germany, France, Japan

const MARKERS = [
  { name: "New York", coords: [-74.006, 40.7128] as [number, number], delay: 30 },
  { name: "London", coords: [-0.1276, 51.5074] as [number, number], delay: 40 },
  { name: "Berlin", coords: [13.405, 52.52] as [number, number], delay: 50 },
  { name: "Paris", coords: [2.3522, 48.8566] as [number, number], delay: 45 },
  { name: "Tokyo", coords: [139.6917, 35.6895] as [number, number], delay: 55 },
];

export const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const mapEntrance = spring({ frame, fps, config: { damping: 18, stiffness: 80 } });
  const titleOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  const globalOpacity = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames - 3],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #020617 0%, #0f172a 50%, #0c1931 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: globalOpacity,
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 600,
          background: "radial-gradient(ellipse, #1e3a5f30 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          opacity: titleOpacity,
          fontSize: 26,
          fontWeight: 700,
          color: "#94a3b8",
          letterSpacing: 8,
          textTransform: "uppercase",
        }}
      >
        Global Presence
      </div>

      {/* Map */}
      <div
        style={{
          width: 1600,
          height: 800,
          opacity: mapEntrance,
          transform: \`scale(\${0.92 + mapEntrance * 0.08})\`,
        }}
      >
        <ComposableMap
          projectionConfig={{ scale: 155, center: [20, 10] }}
          width={1600}
          height={800}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isHighlighted = HIGHLIGHTED_COUNTRIES.includes(String(geo.id));
                const highlightProgress = isHighlighted
                  ? spring({
                      frame: frame - 20,
                      fps,
                      config: { damping: 14, stiffness: 60 },
                    })
                  : 0;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: isHighlighted
                          ? \`rgba(\${Math.round(30 + highlightProgress * 30)}, \${Math.round(80 + highlightProgress * 50)}, \${Math.round(120 + highlightProgress * 100)}, \${0.5 + highlightProgress * 0.5})\`
                          : "#1e293b",
                        stroke: "#334155",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: { fill: "#3b82f6", outline: "none" },
                      pressed: { fill: "#2563eb", outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Animated markers */}
          {MARKERS.map((marker) => {
            const markerFrame = frame - marker.delay;
            const markerEntrance = spring({
              frame: markerFrame,
              fps,
              config: { damping: 10, stiffness: 200 },
            });
            const markerOpacity = interpolate(markerFrame, [0, 10], [0, 1], {
              extrapolateRight: "clamp",
            });
            const pulseScale = 1 + Math.sin(frame * 0.12) * 0.2;

            return (
              <Marker key={marker.name} coordinates={marker.coords}>
                {/* Pulse ring */}
                <circle
                  r={12 * pulseScale}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={1}
                  opacity={markerOpacity * 0.4}
                />
                {/* Dot */}
                <circle
                  r={5 * markerEntrance}
                  fill="#3b82f6"
                  opacity={markerOpacity}
                />
              </Marker>
            );
          })}
        </ComposableMap>
      </div>
    </AbsoluteFill>
  );
};
`;

export const worldMapExample: RemotionExample = {
  id: "world-map",
  name: "World Map",
  description: "Animated SVG world map with highlighted countries and pulsing markers using react-simple-maps",
  code: worldMapCode,
  durationInFrames: 150,
  fps: 30,
  category: "Other",
};
