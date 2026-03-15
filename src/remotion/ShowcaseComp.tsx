import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import { SHOWCASE_AUDIO_TIMINGS, SHOWCASE_DURATION } from "./showcase-audio-timings";

export { SHOWCASE_DURATION };

const EO = Easing.out(Easing.cubic);
const FONT = "Inter, system-ui, sans-serif";
const MONO = "'Fira Code', 'Consolas', monospace";
const TAGLINE = "Agentic Multimodal Motion Graphics Studio";

function spr(frame: number, fps: number, delay = 0, damping = 15, stiffness = 100) {
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 1 } });
}

function fi(frame: number, f0: number, f1: number, v0: number, v1: number) {
  return interpolate(frame, [f0, f1], [v0, v1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });
}

function glass(opacity = 0.04) {
  return {
    background: `rgba(255,255,255,${opacity})`,
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
  };
}

function AmbientGlow({ frame }: { frame: number }) {
  const dx = Math.sin(frame / 90) * 60;
  const dy = Math.cos(frame / 120) * 40;
  return (
    <div
      style={{
        position: "absolute",
        top: "36%",
        left: "50%",
        width: 980,
        height: 980,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 72%)",
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
        pointerEvents: "none",
      }}
    />
  );
}

const DOTS = Array.from({ length: 64 }, (_, i) => ({
  x: (i * 143.4) % 1920,
  y: (i * 89.7) % 1080,
  r: 0.7 + (i % 4) * 0.45,
  vx: ((i % 5) - 2) * 0.14,
  vy: ((i % 7) - 3) * 0.11,
  a: 0.06 + (i % 5) * 0.04,
}));

function Particles({ frame }: { frame: number }) {
  return (
    <>
      {DOTS.map((dot, index) => {
        const x = ((dot.x + dot.vx * frame) % 1920 + 1920) % 1920;
        const y = ((dot.y + dot.vy * frame) % 1080 + 1080) % 1080;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: dot.r * 2,
              height: dot.r * 2,
              borderRadius: "50%",
              background: `rgba(255,255,255,${dot.a})`,
            }}
          />
        );
      })}
    </>
  );
}

function GridOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "120px 120px",
        maskImage: "radial-gradient(circle at center, black 30%, transparent 85%)",
        opacity: 0.5,
      }}
    />
  );
}

function LogoIcon({ size = 74 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function YouTubeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}>
      <rect x="2.4" y="5.2" width="19.2" height="13.6" rx="4.2" fill="#ff2a2a" />
      <path d="M10 9l6 3-6 3V9z" fill="#fff" />
    </svg>
  );
}

function GlobeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" style={{ width: size, height: size }}>
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.86)" strokeWidth="1.8" />
      <ellipse cx="12" cy="12" rx="4.5" ry="9" stroke="rgba(255,255,255,0.72)" strokeWidth="1.4" />
      <path d="M3 12h18M5.4 7.2h13.2M5.4 16.8h13.2" stroke="rgba(255,255,255,0.72)" strokeWidth="1.2" />
    </svg>
  );
}

function FileDocIcon({ size = 24, color = "#fff", label = "PDF" }: { size?: number; color?: string; label?: string }) {
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
      <div style={{ position: "absolute", bottom: Math.max(1, size * 0.1), left: 0, right: 0, textAlign: "center", fontSize: size * 0.22, color, fontWeight: 700, letterSpacing: "0.02em" }}>
        {label}
      </div>
    </div>
  );
}

function ShimmerText({ text, frame, fontSize, align = "left", lineHeight = 1 }: { text: string; frame: number; fontSize: number; align?: "left" | "center"; lineHeight?: number }) {
  const pulse = (Math.sin(frame / 16) + 1) / 2;
  const opacity = 0.86 + pulse * 0.14;
  const glow = 18 + pulse * 16;
  return (
    <div style={{ fontSize, fontWeight: 900, lineHeight, letterSpacing: "-0.045em", textAlign: align, color: `rgba(255,255,255,${opacity})`, textShadow: `0 0 ${glow}px rgba(255,255,255,0.22), 0 0 ${Math.max(6, glow - 8)}px rgba(255,255,255,0.16)` }}>
      {text}
    </div>
  );
}

function Pill({ label, frame, delay = 0 }: { label: string; frame: number; delay?: number }) {
  const o = fi(frame, delay, delay + 18, 0, 1);
  return (
    <div style={{ opacity: o, transform: `translateY(${interpolate(o, [0, 1],[12, 0])}px)`, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "10px 18px", fontSize: 17, color: "rgba(255,255,255,0.68)", fontWeight: 500 }}>
      {label}
    </div>
  );
}

function CaptionBar({ left, right, bottom, text, opacity }: { left: number; right: number; bottom: number; text: string; opacity: number }) {
  return (
    <div style={{ position: "absolute", left, right, bottom, borderRadius: 16, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", padding: "16px 22px", color: "rgba(255,255,255,0.82)", fontSize: 24, lineHeight: 1.5, opacity }}>
      {text}
    </div>
  );
}

const FEATURES =[
  { id: "01", title: "Prompt-to-animation code generation", desc: "Intent classification, skill selection, TSX generation, sanitize, live preview." },
  { id: "02", title: "Agentic story pipeline", desc: "Gemini ADK planner decomposes briefs, scenes build in parallel, timeline-ready durations land in sequence." },
  { id: "03", title: "Multimodal understanding", desc: "Images, video, audio, PDF, YouTube URLs, and website URLs are understood and structured for downstream use." },
  { id: "04", title: "Image generation and editing", desc: "Gemini image workflows generate 16:9 assets and support reference-image consistency." },
  { id: "05", title: "Narration and voiceover", desc: "Gemini speech models produce voice tracks tied directly to story scenes." },
  { id: "06", title: "Region-aware annotations", desc: "Optional image and video region analysis supports guided overlays and visual explanation." },
  { id: "07", title: "Cloud media pipeline", desc: "GCS-backed upload, list, delete, signed URLs, and gs:// URIs for scalable storage." },
  { id: "08", title: "Live editor + preview", desc: "In-browser editing with real-time preview today; export is explicitly not in the current build." },
];

const STACK_CARDS =[
  { title: "Tech stack", lines:["Next.js 16, React 19, TypeScript, Tailwind", "Remotion 4 for motion graphics and timeline composition", "Gemini models, Google ADK, Vercel AI SDK", "Zod, Monaco Editor, Mapbox GL, Three.js"] },
  { title: "Data sources", lines:["Prompt text and uploaded media", "Structured scene plans and generated TSX", "Generated images and narration audio", "Signed URLs, gs:// URIs, optional grounded web context"] },
  { title: "Key learnings", lines:["Focused ADK agents are easier to recover and improve", "Schemas make multimodal outputs safe for downstream tools", "Babel + Remotion enabled live TSX compilation in-browser", "Terraform + GCP made redeployments repeatable"] },
  { title: "Cloud proof", lines:["Cloud Run backend deployed and healthy", "Google Cloud Storage stores and serves project media", "Upload route returns signed URL + gs:// URI", "Current build ships live preview; download export is next"] },
];

// --- SCENES ---

function StartTrailerScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spr(frame, fps, 6, 16, 112);
  const logoOpacity = interpolate(p,[0, 0.55],[0, 1], { extrapolateRight: "clamp" });
  const logoY = interpolate(p,[0, 1],[34, 0]);
  const titleOpacity = fi(frame, 16, 42, 0, 1);
  const taglineOpacity = fi(frame, 34, 62, 0, 1);
  const badgesOpacity = fi(frame, 52, 78, 0, 1);

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 160px" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 38%, transparent 75%)" }} />
      <div style={{ transform: `translateY(${logoY}px)`, opacity: logoOpacity, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><LogoIcon size={90} /></div>
        <div style={{ opacity: titleOpacity }}><ShimmerText text="SceneForge" frame={frame} fontSize={122} align="center" lineHeight={1.02} /></div>
        <div style={{ marginTop: 18, fontSize: 34, lineHeight: 1.35, color: "rgba(255,255,255,0.60)", opacity: taglineOpacity }}>{TAGLINE}</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, opacity: badgesOpacity }}>
          <Pill label="Gemini ADK" frame={frame} delay={0} />
          <Pill label="Remotion" frame={frame} delay={6} />
          <Pill label="Google Cloud" frame={frame} delay={12} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function EditorIntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = fi(frame, 0, 16, 0, 1);
  const prompt = "Build a cinematic explainer from a YouTube URL, website link, and uploaded PDF so SceneForge can analyze and visualize everything in a Remotion timeline.";
  const typed = prompt.slice(0, Math.max(0, Math.floor((frame - 10) * 1.55)));
  const sendProgress = fi(frame, 80, 94, 0, 1);
  const loading = fi(frame, 100, 128, 0, 1);
  const preview = fi(frame, 132, 168, 0, 1);
  const panelSpring = spr(frame, fps, 8);
  const panelY = interpolate(panelSpring,[0, 1],[50, 0]);

  const activeCaption = "Type your idea in plain language. SceneForge understands creative intent, orchestrates the Gemini ADK, and returns a live Remotion timeline.";
  const captionOpacity = fi(frame, 4, 20, 0, 1);
  
  return (
    <AbsoluteFill style={{ padding: "48px 92px 82px" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 14 }}>1. The Unified Editor</div>
      
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 26, transform: `translateY(${panelY}px)`, opacity: reveal }}>
        {/* LEFT: EDITOR */}
        <div style={{ ...glass(0.035), borderRadius: 28, padding: 26, minHeight: 560 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 10 }}>{[0, 1, 2].map((index) => (<div key={index} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />))}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Editor Clone</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <Pill label="Prompt" frame={frame} delay={14} />
            <Pill label="YouTube / Website / Files" frame={frame} delay={20} />
            <Pill label="Gemini ADK" frame={frame} delay={26} />
          </div>
          <div style={{ ...glass(0.025), borderRadius: 20, minHeight: 280, padding: 22, fontFamily: MONO, fontSize: 22, lineHeight: 1.8, color: "rgba(255,255,255,0.76)", whiteSpace: "pre-wrap" }}>
            {typed}<span style={{ opacity: frame % 18 < 9 ? 1 : 0, color: "rgba(255,255,255,0.95)" }}>|</span>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 18 }}>Intent classification, URL/file analysis, TSX generation.</div>
            <div style={{ width: 240, height: 62, borderRadius: 18, background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, transform: `scale(${1 - sendProgress * 0.04})`, boxShadow: `0 0 ${16 + sendProgress * 14}px rgba(255,255,255,0.16)` }}>Generate story</div>
          </div>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div style={{ ...glass(0.03), borderRadius: 28, padding: 24, minHeight: 560, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Live Preview</div>
            <div style={{ color: "rgba(255,255,255,0.34)", fontSize: 16 }}>Remotion Player</div>
          </div>
          <div style={{ ...glass(0.025), borderRadius: 22, height: 330, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 1 - preview, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18 }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.16)", borderTopColor: "rgba(255,255,255,0.95)", transform: `rotate(${frame * 8}deg)`, opacity: loading }} />
              <div style={{ fontSize: 22, color: "rgba(255,255,255,0.54)", opacity: loading }}>Planning scenes, composing timeline...</div>
            </div>
            <div style={{ position: "absolute", inset: 0, opacity: preview }}>
              <div style={{ position: "absolute", inset: 24, borderRadius: 18, background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.12), transparent 100%)", border: "1px solid rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <LogoIcon size={66} />
                <div style={{ marginTop: 18 }}><ShimmerText text="Scene ready" frame={frame} fontSize={44} align="center" /></div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {["Planner output", "Scene-by-scene build", "Timeline-ready preview"].map((label, index) => (
              <div key={label} style={{ ...glass(0.025), borderRadius: 18, padding: "16px 18px", opacity: fi(frame, 100 + index * 8, 114 + index * 8, 0, 1) }}>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.30)", marginBottom: 8 }}>0{index + 1}</div>
                <div style={{ fontSize: 20, lineHeight: 1.35, color: "#fff" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <CaptionBar left={92} right={92} bottom={24} text={activeCaption} opacity={captionOpacity} />
    </AbsoluteFill>
  );
}

function YouTubeFeatureScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);

  // Left Panel setup
  const typeLen = Math.max(0, Math.floor((frame - 10) * 1.5));
  const prompt = "Summarize the key announcements in this video:\n\nhttps://youtube.com/watch?v=sceneforge-demo";
  const typed = prompt.slice(0, typeLen);
  const sendProgress = fi(frame, 60, 74, 0, 1);

  // Right Panel setup
  const iconShift = spr(frame, fps, 70, 15, 105);
  const iconY = interpolate(iconShift, [0, 1], [0, -100]);
  const iconScale = interpolate(iconShift, [0, 1], [1.4, 0.6]);
  const analyzing = fi(frame, 70, 86, 0, 1) * fi(frame, 100, 110, 1, 0);
  const results = fi(frame, 105, 120, 0, 1);

  const activeCaption = "Paste a YouTube URL directly into the prompt. SceneForge extracts transcripts and visuals to build sequence-ready scenes.";

  return (
    <AbsoluteFill style={{ opacity: inOp, padding: "48px 92px 82px" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 14 }}>2. YouTube Extraction</div>
      
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 26 }}>
        {/* LEFT: EDITOR */}
        <div style={{ ...glass(0.035), borderRadius: 28, padding: 26, minHeight: 560 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>{[0, 1, 2].map((i) => (<div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />))}</div>
          <div style={{ ...glass(0.025), borderRadius: 20, minHeight: 280, padding: 22, fontFamily: MONO, fontSize: 22, lineHeight: 1.8, color: "rgba(255,255,255,0.76)", whiteSpace: "pre-wrap" }}>
            <span style={{ color: "#fff" }}>{typed.split("https://")[0]}</span>
            <span style={{ color: "#ff8888" }}>{typed.includes("https://") ? "https://" + typed.split("https://")[1] : ""}</span>
            <span style={{ opacity: frame % 18 < 9 ? 1 : 0, color: "rgba(255,255,255,0.95)" }}>|</span>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{ width: 240, height: 62, borderRadius: 18, background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, transform: `scale(${1 - sendProgress * 0.04})` }}>Generate story</div>
          </div>
        </div>

        {/* RIGHT: MULTIMODAL ENGINE */}
        <div style={{ ...glass(0.03), borderRadius: 28, padding: 24, minHeight: 560, position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20 }}>Multimodal Engine</div>
          
          <div style={{ flex: 1, ...glass(0.025), borderRadius: 22, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {/* The Floating Logo */}
            <div style={{ position: "absolute", transform: `translateY(${iconY}px) scale(${iconScale})`, opacity: fi(frame, 60, 70, 0, 1) }}>
              <div style={{ width: 130, height: 130, borderRadius: 34, border: "2px solid rgba(255,42,42,0.42)", background: "rgba(255,42,42,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px rgba(255,42,42,0.35)` }}>
                <YouTubeIcon size={72} />
              </div>
            </div>

            {/* Analyzing State */}
            <div style={{ position: "absolute", inset: 0, opacity: analyzing, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18, marginTop: 40 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", border: "3px solid rgba(255,42,42,0.2)", borderTopColor: "#ff2a2a", transform: `rotate(${frame * 12}deg)` }} />
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.62)" }}>Extracting video frames & transcript...</div>
            </div>

            {/* Results State */}
            <div style={{ position: "absolute", bottom: 40, left: 30, right: 30, opacity: results, display: "flex", gap: 12 }}>
              {["Key moments", "Summary", "Scene plan"].map((title, index) => (
                <div key={title} style={{ flex: 1, borderRadius: 12, border: "1px solid rgba(255,42,42,0.25)", background: "rgba(255,42,42,0.08)", padding: 14, opacity: fi(frame, 105 + index * 4, 115 + index * 4, 0, 1) }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{title}</div>
                  <div style={{ width: "66%", height: 7, borderRadius: 4, background: "rgba(255,255,255,0.32)", marginBottom: 8 }} />
                  <div style={{ width: "92%", height: 6, borderRadius: 4, background: "rgba(255,255,255,0.20)" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CaptionBar left={92} right={92} bottom={24} text={activeCaption} opacity={fi(frame, 8, 24, 0, 1)} />
    </AbsoluteFill>
  );
}

function WebsiteFeatureScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);

  const typeLen = Math.max(0, Math.floor((frame - 10) * 1.5));
  const prompt = "Convert this documentation page into an explainer scene:\n\nhttps://example.com/guide/visual-learning";
  const typed = prompt.slice(0, typeLen);
  const sendProgress = fi(frame, 60, 74, 0, 1);

  const iconShift = spr(frame, fps, 70, 15, 105);
  const iconY = interpolate(iconShift, [0, 1], [0, -100]);
  const iconScale = interpolate(iconShift, [0, 1], [1.4, 0.6]);
  
  const scanLine = interpolate(frame, [80, 110],[20, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scanOp = fi(frame, 80, 90, 0, 1) * fi(frame, 105, 115, 1, 0);
  const results = fi(frame, 110, 125, 0, 1);

  const activeCaption = "Provide a website link. The model parses sections and facts, converting them into structured data for the timeline.";

  return (
    <AbsoluteFill style={{ opacity: inOp, padding: "48px 92px 82px" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 14 }}>3. Website Parsing</div>
      
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 26 }}>
        {/* LEFT: EDITOR */}
        <div style={{ ...glass(0.035), borderRadius: 28, padding: 26, minHeight: 560 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>{[0, 1, 2].map((i) => (<div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />))}</div>
          <div style={{ ...glass(0.025), borderRadius: 20, minHeight: 280, padding: 22, fontFamily: MONO, fontSize: 22, lineHeight: 1.8, color: "rgba(255,255,255,0.76)", whiteSpace: "pre-wrap" }}>
            <span style={{ color: "#fff" }}>{typed.split("https://")[0]}</span>
            <span style={{ color: "#88ccff" }}>{typed.includes("https://") ? "https://" + typed.split("https://")[1] : ""}</span>
            <span style={{ opacity: frame % 18 < 9 ? 1 : 0, color: "rgba(255,255,255,0.95)" }}>|</span>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{ width: 240, height: 62, borderRadius: 18, background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, transform: `scale(${1 - sendProgress * 0.04})` }}>Generate story</div>
          </div>
        </div>

        {/* RIGHT: MULTIMODAL ENGINE */}
        <div style={{ ...glass(0.03), borderRadius: 28, padding: 24, minHeight: 560, position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20 }}>Multimodal Engine</div>
          
          <div style={{ flex: 1, ...glass(0.025), borderRadius: 22, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <div style={{ position: "absolute", transform: `translateY(${iconY}px) scale(${iconScale})`, opacity: fi(frame, 60, 70, 0, 1), zIndex: 10 }}>
              <div style={{ width: 130, height: 130, borderRadius: 34, border: "2px solid rgba(90,170,255,0.42)", background: "rgba(90,170,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px rgba(90,170,255,0.35)` }}>
                <GlobeIcon size={72} />
              </div>
            </div>

            {/* Fake Website skeleton scanning */}
            <div style={{ position: "absolute", top: 120, left: 40, right: 40, opacity: fi(frame, 70, 80, 0, 0.4) }}>
              <div style={{ width: "40%", height: 14, borderRadius: 5, background: "rgba(255,255,255,0.72)", marginBottom: 16 }} />
              <div style={{ width: "94%", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.34)", marginBottom: 10 }} />
              <div style={{ width: "84%", height: 8, borderRadius: 4, background: "rgba(255,255,255,0.30)", marginBottom: 10 }} />
            </div>
            
            <div style={{ position: "absolute", left: 0, right: 0, top: 120 + scanLine, height: 3, background: "rgba(90,170,255,0.92)", boxShadow: "0 0 18px rgba(90,170,255,0.65)", opacity: scanOp }} />

            {/* JSON Output */}
            <div style={{ position: "absolute", bottom: 30, left: 30, right: 30, opacity: results, borderRadius: 12, border: "1px solid rgba(90,170,255,0.26)", background: "rgba(8,18,32,0.9)", padding: 14, fontFamily: MONO, fontSize: 14, color: "rgba(255,255,255,0.86)", lineHeight: 1.7 }}>
              <div>{"{"}</div>
              <div style={{ paddingLeft: 16 }}>'title': 'Visual Learning Guide',</div>
              <div style={{ paddingLeft: 16 }}>'sections': ['Intro','Methods','Data'],</div>
              <div style={{ paddingLeft: 16 }}>'highlights': 6</div>
              <div>{"}"}</div>
            </div>
          </div>
        </div>
      </div>
      <CaptionBar left={92} right={92} bottom={24} text={activeCaption} opacity={fi(frame, 8, 24, 0, 1)} />
    </AbsoluteFill>
  );
}

function UploadFeatureScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);

  const typeLen = Math.max(0, Math.floor((frame - 10) * 1.5));
  const prompt = "Use these reference files to guide the visual tone and script generation:";
  const typed = prompt.slice(0, typeLen);
  const sendProgress = fi(frame, 60, 74, 0, 1);

  // Files dropping into the LEFT panel dropzone
  const f1 = spr(frame, fps, 40, 14, 104);
  const f2 = spr(frame, fps, 45, 14, 104);
  const f3 = spr(frame, fps, 50, 14, 104);

  // Right Panel setup
  const processing = fi(frame, 70, 80, 0, 1) * fi(frame, 110, 120, 1, 0);
  const results = fi(frame, 115, 130, 0, 1);

  const activeCaption = "Drop PDFs, audio, or video into the editor. SceneForge ingests and normalizes the media for seamless scene planning.";

  return (
    <AbsoluteFill style={{ opacity: inOp, padding: "48px 92px 82px" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 14 }}>4. File Ingestion</div>
      
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 26 }}>
        {/* LEFT: EDITOR */}
        <div style={{ ...glass(0.035), borderRadius: 28, padding: 26, minHeight: 560 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>{[0, 1, 2].map((i) => (<div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />))}</div>
          <div style={{ ...glass(0.025), borderRadius: 20, minHeight: 120, padding: 22, fontFamily: MONO, fontSize: 22, lineHeight: 1.8, color: "rgba(255,255,255,0.76)", whiteSpace: "pre-wrap" }}>
            {typed}<span style={{ opacity: frame % 18 < 9 ? 1 : 0, color: "rgba(255,255,255,0.95)" }}>|</span>
          </div>

          {/* Mini Dropzone inside Editor */}
          <div style={{ marginTop: 16, height: 130, border: "2px dashed rgba(120,255,190,0.3)", borderRadius: 16, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
             <div style={{ position: "absolute", transform: `translate(${-100 + interpolate(f1, [0, 1], [-80, 0])}px, ${interpolate(f1, [0, 1], [100, 0])}px)`, opacity: interpolate(f1,[0, 1], [0, 1]) }}>
               <div style={{ width: 60, height: 75, borderRadius: 8, background: "rgba(255,86,86,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileDocIcon size={30} color="#ff5656" label="PDF" /></div>
             </div>
             <div style={{ position: "absolute", transform: `translate(${interpolate(f2, [0, 1], [0, 0])}px, ${interpolate(f2, [0, 1],[100, 0])}px)`, opacity: interpolate(f2, [0, 1],[0, 1]) }}>
               <div style={{ width: 60, height: 75, borderRadius: 8, background: "rgba(88,183,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileDocIcon size={30} color="#58b7ff" label="MP4" /></div>
             </div>
             <div style={{ position: "absolute", transform: `translate(${100 + interpolate(f3,[0, 1], [80, 0])}px, ${interpolate(f3, [0, 1], [100, 0])}px)`, opacity: interpolate(f3, [0, 1], [0, 1]) }}>
               <div style={{ width: 60, height: 75, borderRadius: 8, background: "rgba(102,243,178,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileDocIcon size={30} color="#66f3b2" label="PNG" /></div>
             </div>
          </div>

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <div style={{ width: 240, height: 62, borderRadius: 18, background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, transform: `scale(${1 - sendProgress * 0.04})` }}>Generate story</div>
          </div>
        </div>

        {/* RIGHT: MULTIMODAL ENGINE */}
        <div style={{ ...glass(0.03), borderRadius: 28, padding: 24, minHeight: 560, position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 20 }}>Multimodal Engine</div>
          
          <div style={{ flex: 1, ...glass(0.025), borderRadius: 22, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            
            <div style={{ position: "absolute", inset: 0, opacity: processing, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", border: "3px solid rgba(120,255,190,0.24)", borderTopColor: "#78ffbe", transform: `rotate(${frame * 12}deg)` }} />
              <div style={{ fontSize: 18, color: "#78ffbe", fontWeight: 600 }}>Normalizing Media to GCP...</div>
            </div>

            <div style={{ position: "absolute", inset: 30, opacity: results, display: "grid", gridTemplateColumns: "1fr", gap: 12, alignContent: "center" }}>
              {["Vision semantics extracted", "Audio transcribed via Gemini", "Files stored in GCS Bucket"].map((label, index) => (
                <div key={label} style={{ borderRadius: 12, border: "1px solid rgba(120,255,190,0.32)", background: "rgba(120,255,190,0.10)", display: "flex", alignItems: "center", padding: "16px 20px", color: "rgba(255,255,255,0.86)", fontWeight: 600, opacity: fi(frame, 115 + index * 4, 125 + index * 4, 0, 1) }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#78ffbe", marginRight: 14 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CaptionBar left={92} right={92} bottom={24} text={activeCaption} opacity={fi(frame, 8, 24, 0, 1)} />
    </AbsoluteFill>
  );
}

function ExampleVideosScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);

  const activeCaption = "The result? Breathtaking multimodal motion graphics. Here are real examples of what you can generate.";
  
  const introSpring = spr(frame, fps, 10, 12, 80);
  const slideY = interpolate(introSpring,[0, 1],[60, 0]);
  
  const CarouselItem = ({ x, z, rotateY, scale, delay, label, src, index }: any) => {
    const p = spr(frame, fps, delay, 14, 90);
    const itemOp = interpolate(p,[0, 0.4],[0, 1]);
    const itemSlide = interpolate(p,[0, 1],[40, 0]);
    
    return (
      <div style={{
        position: "absolute", left: "50%", top: "46%", width: 640, height: 360,
        marginLeft: -320, marginTop: -180,
        transform: `translate3d(${x}px, ${itemSlide}px, ${z}px) rotateY(${rotateY}deg) scale(${scale})`,
        opacity: itemOp, borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: `0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.05)`,
        background: "rgba(20, 20, 25, 0.8)",
      }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
          <LogoIcon size={40} />
          <div style={{ marginTop: 16, fontSize: 18, fontWeight: 600 }}>Missing Example Video</div>
          <div style={{ marginTop: 8, fontSize: 14 }}>Add <span style={{ fontFamily: MONO, color: "rgba(255,255,255,0.8)" }}>public/examples/example-{index}.mp4</span></div>
        </div>

        <Video src={src} style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 10 }} muted loop />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)", pointerEvents: "none", zIndex: 20 }} />
        
        <div style={{ position: "absolute", bottom: 16, left: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "6px 12px", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)", zIndex: 20 }}>
          {label}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ opacity: inOp, padding: "0 88px 110px", display: "flex", alignItems: "center", justifyContent: "center", perspective: 1200 }}>
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, textAlign: "center", transform: `translateY(${slideY}px)`, opacity: interpolate(introSpring,[0, 1],[0, 1]) }}>
        <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 12 }}>Generated Outputs</div>
        <ShimmerText text="Real Examples Built By AI" frame={frame} fontSize={50} align="center" />
      </div>

      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", marginTop: 40 }}>
        <CarouselItem index={2} src={staticFile("examples/example-2.mp4")} x={-380} z={-200} rotateY={20} scale={0.8} delay={18} label="Website Analysis to Video" />
        <CarouselItem index={3} src={staticFile("examples/example-3.mp4")} x={380} z={-200} rotateY={-20} scale={0.8} delay={24} label="PDF Processing" />
        <CarouselItem index={1} src={staticFile("examples/example-1.mp4")} x={0} z={50} rotateY={0} scale={1.05} delay={30} label="YouTube Highlights Gen" />
      </div>

      <CaptionBar left={88} right={88} bottom={22} text={activeCaption} opacity={fi(frame, 8, 24, 0, 1)} />
    </AbsoluteFill>
  );
}

function FeaturesScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);
  const captions =[
    { from: 6, to: 80, text: "SceneForge unites prompt-to-animation, agentic orchestration, and multimodal inputs into a single UI." },
    { from: 80, to: 170, text: "From Gemini image/audio generation to region-aware visual overlays, the pipeline writes the code entirely for you." },
  ];
  const activeCaption = captions.find((caption) => frame >= caption.from && frame < caption.to)?.text ?? captions[0].text;
  
  return (
    <AbsoluteFill style={{ opacity: inOp, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 88px 110px" }}>
      <div style={{ width: "100%" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 14 }}>Everything In The Submission</div>
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {FEATURES.map((feature, index) => {
            const p = spr(frame, fps, 10 + index * 5, 16, 105);
            const opacity = interpolate(p,[0, 0.55],[0, 1], { extrapolateRight: "clamp" });
            const y = interpolate(p,[0, 1],[26, 0]);
            return (
              <div key={feature.id} style={{ ...glass(0.035), borderRadius: 24, minHeight: 168, padding: 18, opacity, transform: `translateY(${y}px)`, borderLeft: "3px solid rgba(255,255,255,0.26)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.30)", letterSpacing: "0.16em", marginBottom: 12 }}>{feature.id}</div>
                <div style={{ fontSize: 19, lineHeight: 1.2, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{feature.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.48, color: "rgba(255,255,255,0.46)" }}>{feature.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
      <CaptionBar left={88} right={88} bottom={22} text={activeCaption} opacity={fi(frame, 8, 24, 0, 1)} />
    </AbsoluteFill>
  );
}

// ── NEW ARCHITECTURE FLOWCHART SCENE ──

const NEW_FLOW_NODES =[
  { key: "browser", label: "User Browser\nNext.js UI", x: 40, y: 300, w: 180, h: 70, delay: 5 },
  { key: "panel", label: "Client Components\nAgent Panel", x: 280, y: 300, w: 220, h: 70, delay: 15 },
  { key: "api", label: "Next.js API Routes\nNode Runtime", x: 560, y: 300, w: 220, h: 70, delay: 25 },

  { key: "multi", label: "Multimodal\nUnderstand API", x: 880, y: 20, w: 220, h: 60, delay: 35 },
  { key: "image", label: "Image Generation API", x: 880, y: 110, w: 220, h: 60, delay: 35 },
  { key: "tts", label: "TTS API", x: 880, y: 200, w: 220, h: 60, delay: 35 },
  { key: "planner", label: "Story Planner Agent\nGemini Pro", x: 880, y: 290, w: 220, h: 60, delay: 40 },
  { key: "builder", label: "Scene Builder Agent\nGemini Flash", x: 880, y: 380, w: 220, h: 60, delay: 40 },
  { key: "gcs", label: "Google Cloud Storage", x: 880, y: 470, w: 220, h: 60, delay: 35 },
  
  { key: "gemini", label: "Gemini Models", x: 1240, y: 200, w: 200, h: 80, delay: 50 },
  { key: "remotion", label: "Remotion Compiler\nTimeline Builder", x: 880, y: 560, w: 220, h: 70, delay: 70 },
  { key: "preview", label: "Live Preview", x: 280, y: 480, w: 220, h: 60, delay: 90 },
];

const NEW_CONNECTORS =[
  { from: "browser", to: "panel", delay: 10 },
  { from: "panel", to: "api", delay: 20 },
  { from: "api", to: "multi", delay: 30 },
  { from: "api", to: "image", delay: 30 },
  { from: "api", to: "tts", delay: 30 },
  { from: "api", to: "planner", delay: 35 },
  { from: "api", to: "builder", delay: 35 },
  { from: "api", to: "gcs", delay: 35 },
  
  { from: "multi", to: "gemini", delay: 45 },
  { from: "image", to: "gemini", delay: 45 },
  { from: "tts", to: "gemini", delay: 45 },
  { from: "planner", to: "gemini", delay: 50 },
  { from: "builder", to: "gemini", delay: 50 },

  { from: "api", to: "remotion", delay: 65 },
  { from: "remotion", to: "panel", delay: 75, back: true },
  { from: "panel", to: "preview", delay: 85, down: true },
];

function PathFlow({ from, to, delay, frame, back, down }: any) {
  const a = NEW_FLOW_NODES.find((n) => n.key === from)!;
  const b = NEW_FLOW_NODES.find((n) => n.key === to)!;

  let d = "";
  if (back) {
    const x1 = a.x;
    const y1 = a.y + a.h / 2;
    const x2 = b.x + b.w / 2;
    const y2 = b.y + b.h;
    d = `M ${x1} ${y1} C ${x1 - 150} ${y1}, ${x2} ${y1 + 50}, ${x2} ${y2 + 8}`; 
  } else if (down) {
    const x1 = a.x + a.w / 2;
    const y1 = a.y + a.h;
    const x2 = b.x + b.w / 2;
    const y2 = b.y - 8;
    d = `M ${x1} ${y1} L ${x2} ${y2}`;
  } else {
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x - 8;
    const y2 = b.y + b.h / 2;
    d = `M ${x1} ${y1} C ${x1 + (x2 - x1) / 2} ${y1}, ${x1 + (x2 - x1) / 2} ${y2}, ${x2} ${y2}`;
  }

  const flowOp = fi(frame, delay, delay + 15, 0, 1);
  
  return (
    <g opacity={flowOp}>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={2} markerEnd="url(#arrow)" />
      <path
        d={d}
        fill="none"
        stroke="rgba(90, 170, 255, 0.9)"
        strokeWidth={3}
        strokeDasharray="8 24"
        strokeDashoffset={-frame * 3}
        style={{ filter: "drop-shadow(0 0 6px rgba(90, 170, 255, 0.6))" }}
      />
    </g>
  );
}

function FlowchartScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);
  const activeCaption = "The flow starts at the browser and agent panel, passing requests to Next.js API routes. These orchestrate Multimodal, Image, and TTS APIs alongside Gemini Story Planners. Everything converges to compile in Remotion, looping back to a live preview.";
  
  return (
    <AbsoluteFill style={{ opacity: inOp, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px 110px" }}>
      <div style={{ width: "100%" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 8, opacity: fi(frame, 0, 12, 0, 1) }}>How It Is Done</div>
        </div>
        
        <div style={{ ...glass(0.028), borderRadius: 30, marginTop: 2, height: 712, position: "relative", overflow: "hidden" }}>
          
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.4)" />
              </marker>
            </defs>
            {NEW_CONNECTORS.map((conn) => (
              <PathFlow key={`${conn.from}-${conn.to}`} {...conn} frame={frame} />
            ))}
          </svg>

          {NEW_FLOW_NODES.map((node) => {
            const p = spr(frame, fps, node.delay, 16, 105);
            const opacity = interpolate(p,[0, 0.45], [0, 1], { extrapolateRight: "clamp" });
            const scale = interpolate(p, [0, 1],[0.95, 1]);
            
            const activePulse = fi(frame, node.delay + 10, node.delay + 30, 0, 1) * fi(frame, node.delay + 40, node.delay + 60, 1, 0);
            
            return (
              <div
                key={node.key}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  height: node.h,
                  borderRadius: 16,
                  ...glass(0.04),
                  background: `rgba(255,255,255,${0.04 + activePulse * 0.06})`,
                  boxShadow: `0 20px 60px rgba(0,0,0,0.22), 0 0 ${activePulse * 30}px rgba(90, 170, 255, ${activePulse * 0.3})`,
                  border: `1px solid rgba(255,255,255,${0.1 + activePulse * 0.2})`,
                  opacity,
                  transform: `scale(${scale})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  textAlign: "center",
                }}
              >
                {node.label.split("\n").map((line, idx) => (
                  <div key={line} style={{ fontSize: 16, lineHeight: 1.25, color: idx === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)", fontWeight: idx === 0 ? 700 : 500 }}>
                    {line}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <CaptionBar left={72} right={72} bottom={22} text={activeCaption} opacity={fi(frame, 8, 24, 0, 1)} />
    </AbsoluteFill>
  );
}

function StackProofScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);
  const activeCaption = "Judge-facing proof: React 19, Remotion, Vercel AI SDK, and Gemini running live on Cloud Run with GCS storage.";

  return (
    <AbsoluteFill style={{ opacity: inOp, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 88px 110px" }}>
      <div style={{ width: "100%" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 10 }}>Tech, Data, Learnings, Proof</div>
        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {STACK_CARDS.map((card, index) => {
            const p = spr(frame, fps, 8 + index * 6, 17, 105);
            return (
              <div key={card.title} style={{ ...glass(0.035), borderRadius: 24, minHeight: 360, padding: 22, opacity: interpolate(p,[0, 0.45], [0, 1], { extrapolateRight: "clamp" }), transform: `translateY(${interpolate(p, [0, 1],[24, 0])}px)`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 16 }}>{card.title}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {card.lines.map((line) => (
                    <div key={line} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 7, height: 7, marginTop: 9, borderRadius: "50%", background: "rgba(255,255,255,0.55)" }} />
                      <div style={{ fontSize: 17, lineHeight: 1.52, color: "rgba(255,255,255,0.48)" }}>{line}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <CaptionBar left={88} right={88} bottom={22} text={activeCaption} opacity={fi(frame, 8, 24, 0, 1)} />
    </AbsoluteFill>
  );
}

function EndTrailerScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spr(frame, fps, 6, 16, 110);
  const opacity = interpolate(p,[0, 0.45],[0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(p,[0, 1],[44, 0]);
  const titleOpacity = fi(frame, 10, 34, 0, 1);
  const tagOpacity = fi(frame, 24, 52, 0, 1);
  const ctaOpacity = fi(frame, 68, 108, 0, 1);
  const fadeOut = fi(frame, 140, 160, 1, 0); // Keep fade ONLY on the final end screen
  
  return (
    <AbsoluteFill style={{ opacity: fadeOut, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 140px" }}>
      <div style={{ opacity, transform: `translateY(${y}px)`, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}><LogoIcon size={82} /></div>
        <div style={{ opacity: titleOpacity }}><ShimmerText text="SceneForge" frame={frame + 24} fontSize={108} align="center" lineHeight={1.03} /></div>
        <div style={{ marginTop: 14, fontSize: 34, lineHeight: 1.35, color: "rgba(255,255,255,0.60)", opacity: tagOpacity }}>{TAGLINE}</div>
        <div style={{ marginTop: 42, fontSize: 28, letterSpacing: "0.08em", color: "rgba(255,255,255,0.5)", opacity: ctaOpacity }}>Describe your vision. SceneForge builds the motion.</div>
      </div>
    </AbsoluteFill>
  );
}

// Exactly 10 Scenes. ALL intermediate fade-outs are removed for perfect clean cuts.
const SCENE_PLAYBACK =[
  { component: StartTrailerScene, playFrames: 130, holdFrame: 129 },
  { component: EditorIntroScene, playFrames: 200, holdFrame: 199 }, 
  { component: YouTubeFeatureScene, playFrames: 170, holdFrame: 169 }, 
  { component: WebsiteFeatureScene, playFrames: 170, holdFrame: 169 },
  { component: UploadFeatureScene, playFrames: 170, holdFrame: 169 },
  { component: ExampleVideosScene, playFrames: 200, holdFrame: 199 }, 
  { component: FeaturesScene, playFrames: 170, holdFrame: 169 },
  { component: FlowchartScene, playFrames: 200, holdFrame: 199 }, 
  { component: StackProofScene, playFrames: 170, holdFrame: 169 },
  { component: EndTrailerScene, playFrames: 160, holdFrame: 159 },
];

export const ShowcaseComp: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT, overflow: "hidden" }}>
      <AmbientGlow frame={useCurrentFrame()} />
      <Particles frame={useCurrentFrame()} />
      <GridOverlay />

      {/* ── Scene visuals ── */}
      {SCENE_PLAYBACK.map(({ component: SceneComponent, playFrames, holdFrame }, index) => {
        const timing = SHOWCASE_AUDIO_TIMINGS[index] || {
          file: `missing-audio-${index}.mp3`,
          from: SCENE_PLAYBACK.slice(0, index).reduce((acc, curr, i) => acc + (SHOWCASE_AUDIO_TIMINGS[i]?.durationInFrames || curr.playFrames), 0),
          durationInFrames: playFrames
        };

        const animatedFrames = Math.min(playFrames, timing.durationInFrames);
        const holdFrames = Math.max(0, timing.durationInFrames - animatedFrames);

        return (
          <React.Fragment key={`visual-${timing.file}`}>
            <Sequence from={timing.from} durationInFrames={animatedFrames}>
              <SceneComponent />
            </Sequence>
            {holdFrames > 0 ? (
              <Sequence from={timing.from + animatedFrames} durationInFrames={holdFrames}>
                <Freeze frame={holdFrame}>
                  <SceneComponent />
                </Freeze>
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* ── Per-scene narration ── */}
      {SHOWCASE_AUDIO_TIMINGS.map((timing) => (
        <Sequence key={`audio-${timing.file}`} from={timing.from} durationInFrames={timing.durationInFrames}>
          <Audio src={staticFile(`audio/${timing.file}`)} volume={0.92} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};