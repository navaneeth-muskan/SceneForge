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
} from "remotion";
import { SHOWCASE_AUDIO_TIMINGS, SHOWCASE_DURATION } from "./showcase-audio-timings";

export { SHOWCASE_DURATION };

const EO = Easing.out(Easing.cubic);
const FONT = "Inter, system-ui, sans-serif";
const MONO = "'Fira Code', 'Consolas', monospace";
const TAGLINE = "Agentic Multimodal Motion Graphics Studio";

function spr(frame: number, fps: number, delay = 0, damping = 15, stiffness = 100) {
  return spring({
    frame: frame - delay,
    fps,
    config: { damping, stiffness, mass: 1 },
  });
}

function fi(frame: number, f0: number, f1: number, v0: number, v1: number) {
  return interpolate(frame, [f0, f1], [v0, v1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EO,
  });
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
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path
          d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
          stroke="#000"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ShimmerText({
  text,
  frame,
  fontSize,
  align = "left",
  lineHeight = 1,
}: {
  text: string;
  frame: number;
  fontSize: number;
  align?: "left" | "center";
  lineHeight?: number;
}) {
  const pulse = (Math.sin(frame / 16) + 1) / 2;
  const opacity = 0.86 + pulse * 0.14;
  const glow = 18 + pulse * 16;
  return (
    <div
      style={{
        fontSize,
        fontWeight: 900,
        lineHeight,
        letterSpacing: "-0.045em",
        textAlign: align,
        color: `rgba(255,255,255,${opacity})`,
        textShadow: `0 0 ${glow}px rgba(255,255,255,0.22), 0 0 ${Math.max(6, glow - 8)}px rgba(255,255,255,0.16)`,
      }}
    >
      {text}
    </div>
  );
}

function Pill({ label, frame, delay = 0 }: { label: string; frame: number; delay?: number }) {
  const o = fi(frame, delay, delay + 18, 0, 1);
  return (
    <div
      style={{
        opacity: o,
        transform: `translateY(${interpolate(o, [0, 1], [12, 0])}px)`,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.06)",
        borderRadius: 999,
        padding: "10px 18px",
        fontSize: 17,
        color: "rgba(255,255,255,0.68)",
        fontWeight: 500,
      }}
    >
      {label}
    </div>
  );
}

function CaptionBar({
  left,
  right,
  bottom,
  text,
  opacity,
}: {
  left: number;
  right: number;
  bottom: number;
  text: string;
  opacity: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        right,
        bottom,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
        padding: "16px 22px",
        color: "rgba(255,255,255,0.82)",
        fontSize: 24,
        lineHeight: 1.5,
        opacity,
      }}
    >
      {text}
    </div>
  );
}

const FEATURES = [
  { id: "01", title: "Prompt-to-animation code generation", desc: "Intent classification, skill selection, TSX generation, sanitize, live preview." },
  { id: "02", title: "Agentic story pipeline", desc: "Gemini ADK planner decomposes briefs, scenes build in parallel, timeline-ready durations land in sequence." },
  { id: "03", title: "Multimodal understanding", desc: "Images, video, audio, PDF, and YouTube can be understood and structured for downstream use." },
  { id: "04", title: "Image generation and editing", desc: "Gemini image workflows generate 16:9 assets and support reference-image consistency." },
  { id: "05", title: "Narration and voiceover", desc: "Gemini speech models produce voice tracks tied directly to story scenes." },
  { id: "06", title: "Region-aware annotations", desc: "Optional image and video region analysis supports guided overlays and visual explanation." },
  { id: "07", title: "Cloud media pipeline", desc: "GCS-backed upload, list, delete, signed URLs, and gs:// URIs for scalable storage." },
  { id: "08", title: "Live editor + preview", desc: "In-browser editing with real-time preview today; export is explicitly not in the current build." },
];

const FLOW_NODES = [
  { key: "browser", label: "User Browser\nNext.js UI", x: 44, y: 278, w: 190, h: 92 },
  { key: "panel", label: "Client Components\nAgent Panel", x: 294, y: 278, w: 200, h: 92 },
  { key: "api", label: "API Routes\nNode Runtime", x: 554, y: 278, w: 190, h: 92 },
  { key: "planner", label: "Story Planner\nGemini Pro", x: 812, y: 52, w: 180, h: 78 },
  { key: "builder", label: "Scene Builder\nGemini Flash", x: 812, y: 160, w: 180, h: 78 },
  { key: "understand", label: "Multimodal\nUnderstand", x: 812, y: 268, w: 180, h: 78 },
  { key: "image", label: "Image Gen\nEdit", x: 812, y: 376, w: 180, h: 78 },
  { key: "tts", label: "TTS\nNarration", x: 812, y: 484, w: 180, h: 78 },
  { key: "models", label: "Gemini Models", x: 1080, y: 126, w: 188, h: 88 },
  { key: "gcs", label: "Google Cloud Storage", x: 1080, y: 318, w: 188, h: 88 },
  { key: "remotion", label: "Remotion Compiler\nTimeline Builder", x: 1080, y: 510, w: 210, h: 92 },
  { key: "preview", label: "Live Preview", x: 1350, y: 510, w: 148, h: 92 },
];

const CONNECTORS = [
  ["browser", "panel"],
  ["panel", "api"],
  ["api", "planner"],
  ["api", "builder"],
  ["api", "understand"],
  ["api", "image"],
  ["api", "tts"],
  ["planner", "models"],
  ["builder", "models"],
  ["understand", "models"],
  ["image", "models"],
  ["tts", "models"],
  ["api", "gcs"],
  ["api", "remotion"],
  ["remotion", "preview"],
];

const STACK_CARDS = [
  {
    title: "Tech stack",
    lines: [
      "Next.js 16, React 19, TypeScript, Tailwind",
      "Remotion 4 for motion graphics and timeline composition",
      "Gemini models, Google ADK, Vercel AI SDK",
      "Zod, Monaco Editor, Mapbox GL, Three.js",
    ],
  },
  {
    title: "Data sources",
    lines: [
      "Prompt text and uploaded media",
      "Structured scene plans and generated TSX",
      "Generated images and narration audio",
      "Signed URLs, gs:// URIs, optional grounded web context",
    ],
  },
  {
    title: "Key learnings",
    lines: [
      "Focused ADK agents are easier to recover and improve",
      "Schemas make multimodal outputs safe for downstream tools",
      "Babel + Remotion enabled live TSX compilation in-browser",
      "Terraform + GCP made redeployments repeatable",
    ],
  },
  {
    title: "Cloud proof",
    lines: [
      "Cloud Run backend deployed and healthy",
      "Google Cloud Storage stores and serves project media",
      "Upload route returns signed URL + gs:// URI",
      "Current build ships live preview; download export is next",
    ],
  },
];

function EditorIntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = fi(frame, 0, 16, 0, 1);
  const prompt = "Build a cinematic explainer showing how SceneForge turns prompts, files, and Gemini agents into a Remotion timeline.";
  const typed = prompt.slice(0, Math.max(0, Math.floor((frame - 10) * 1.55)));
  const sendProgress = fi(frame, 80, 94, 0, 1);
  const loading = fi(frame, 100, 128, 0, 1);
  const preview = fi(frame, 132, 168, 0, 1);
  const panelSpring = spr(frame, fps, 8);
  const panelY = interpolate(panelSpring, [0, 1], [50, 0]);

  const captions = [
    { from: 6, to: 58, text: "Type your idea in plain language. SceneForge understands creative intent and routes the right skills." },
    { from: 58, to: 102, text: "Press Generate. The agent pipeline starts planning scenes and preparing Remotion-ready structure." },
    { from: 102, to: 146, text: "Gemini-powered scene generation, asset preparation, and timeline composition run in sequence." },
    { from: 146, to: 198, text: "Live preview appears with a playable scene timeline, ready for iteration inside the editor." },
  ];
  const activeCaption = captions.find((caption) => frame >= caption.from && frame < caption.to)?.text ?? captions[0].text;
  const captionOpacity = fi(frame, 4, 20, 0, 1) * fi(frame, 178, 198, 1, 0);

  const steps = [
    { label: "Type brief", from: 12, to: 62 },
    { label: "Send to agent", from: 78, to: 96 },
    { label: "Planning + build", from: 100, to: 136 },
    { label: "Live preview", from: 132, to: 174 },
  ];

  return (
    <AbsoluteFill style={{ opacity: frame < 182 ? 1 : fi(frame, 182, 200, 1, 0), padding: "48px 92px 82px" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 14 }}>
        Submission Walkthrough
      </div>

      <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
        {steps.map((step) => {
          const active = fi(frame, step.from, step.to, 0.3, 1);
          return (
            <div
              key={step.label}
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: `rgba(255,255,255,${0.04 + active * 0.05})`,
                color: `rgba(255,255,255,${0.45 + active * 0.4})`,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {step.label}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: 26,
          transform: `translateY(${panelY}px)`,
          opacity: reveal,
        }}
      >
        <div style={{ ...glass(0.035), borderRadius: 28, padding: 26, minHeight: 560 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", gap: 10 }}>
              {[0, 1, 2].map((index) => (
                <div key={index} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.18)" }} />
              ))}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Editor Clone
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <Pill label="Prompt" frame={frame} delay={14} />
            <Pill label="PDF / Image / Audio" frame={frame} delay={20} />
            <Pill label="Gemini ADK" frame={frame} delay={26} />
          </div>

          <div
            style={{
              ...glass(0.025),
              borderRadius: 20,
              minHeight: 280,
              padding: 22,
              fontFamily: MONO,
              fontSize: 22,
              lineHeight: 1.8,
              color: "rgba(255,255,255,0.76)",
              whiteSpace: "pre-wrap",
            }}
          >
            {typed}
            <span style={{ opacity: frame % 18 < 9 ? 1 : 0, color: "rgba(255,255,255,0.95)" }}>|</span>
          </div>

          <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 18 }}>
              Intent classification, skill routing, TSX generation, sanitization.
            </div>
            <div
              style={{
                width: 240,
                height: 62,
                borderRadius: 18,
                background: "#fff",
                color: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                transform: `scale(${1 - sendProgress * 0.04})`,
                boxShadow: `0 0 ${16 + sendProgress * 14}px rgba(255,255,255,0.16)`,
              }}
            >
              Generate story
            </div>
          </div>
        </div>

        <div style={{ ...glass(0.03), borderRadius: 28, padding: 24, minHeight: 560, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Live Preview
            </div>
            <div style={{ color: "rgba(255,255,255,0.34)", fontSize: 16 }}>Remotion Player</div>
          </div>

          <div style={{ ...glass(0.025), borderRadius: 22, height: 330, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.01))" }} />
            <div style={{ position: "absolute", inset: 0, opacity: 1 - preview, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.16)",
                  borderTopColor: "rgba(255,255,255,0.95)",
                  transform: `rotate(${frame * 8}deg)`,
                  opacity: loading,
                }}
              />
              <div style={{ fontSize: 22, color: "rgba(255,255,255,0.54)", opacity: loading }}>
                Planning scenes, generating assets, composing timeline...
              </div>
            </div>

            <div style={{ position: "absolute", inset: 0, opacity: preview }}>
              <div
                style={{
                  position: "absolute",
                  inset: 24,
                  borderRadius: 18,
                  background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 58%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                }}
              >
                <LogoIcon size={66} />
                <div style={{ marginTop: 18 }}>
                  <ShimmerText text="Scene ready" frame={frame} fontSize={44} align="center" />
                </div>
                <div style={{ marginTop: 12, fontSize: 18, color: "rgba(255,255,255,0.46)" }}>
                  Prompt, files, Gemini agents, and timeline now visible together.
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {[
              "Planner output",
              "Scene-by-scene build",
              "Timeline-ready preview",
            ].map((label, index) => (
              <div
                key={label}
                style={{
                  ...glass(0.025),
                  borderRadius: 18,
                  padding: "16px 18px",
                  opacity: fi(frame, 100 + index * 8, 114 + index * 8, 0, 1),
                }}
              >
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

function FeaturesScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);
  const outOp = frame < 150 ? 1 : fi(frame, 150, 170, 1, 0);
  const captions = [
    { from: 6, to: 60, text: "These cards map directly to the submission: prompt-to-code, agent planning, multimodal input, and cloud-backed media flow." },
    { from: 60, to: 118, text: "SceneForge handles generation, understanding, image workflows, narration, and timeline composition in one coherent experience." },
    { from: 118, to: 170, text: "What you see here is feature proof, not mock copy: each capability is represented in the actual implementation and docs." },
  ];
  const activeCaption = captions.find((caption) => frame >= caption.from && frame < caption.to)?.text ?? captions[0].text;
  const captionOpacity = fi(frame, 8, 24, 0, 1) * fi(frame, 148, 170, 1, 0);

  return (
    <AbsoluteFill style={{ opacity: inOp * outOp, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 88px 110px" }}>
      <div style={{ width: "100%" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 14 }}>
          Everything In The Submission
        </div>

        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {FEATURES.map((feature, index) => {
            const p = spr(frame, fps, 8 + index * 6, 16, 105);
            const opacity = interpolate(p, [0, 0.55], [0, 1], { extrapolateRight: "clamp" });
            const y = interpolate(p, [0, 1], [26, 0]);
            return (
              <div
                key={feature.id}
                style={{
                  ...glass(0.035),
                  borderRadius: 24,
                  minHeight: 188,
                  padding: 22,
                  opacity,
                  transform: `translateY(${y}px)`,
                  borderLeft: "3px solid rgba(255,255,255,0.26)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.30)", letterSpacing: "0.16em", marginBottom: 12 }}>
                  {feature.id}
                </div>
                <div style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
                  {feature.title}
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>
                  {feature.desc}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
          <Pill label="Creative Storyteller fit" frame={frame} delay={78} />
          <Pill label="Mixed media output" frame={frame} delay={84} />
          <Pill label="Export pending, preview live" frame={frame} delay={90} />
        </div>
      </div>

      <CaptionBar left={88} right={88} bottom={22} text={activeCaption} opacity={captionOpacity} />
    </AbsoluteFill>
  );
}

function nodeByKey(key: string) {
  const node = FLOW_NODES.find((item) => item.key === key);
  if (!node) {
    throw new Error(`Missing node ${key}`);
  }
  return node;
}

function Connector({ from, to, opacity }: { from: string; to: string; opacity: number }) {
  const a = nodeByKey(from);
  const b = nodeByKey(to);
  const x1 = a.x + a.w;
  const y1 = a.y + a.h / 2;
  const x2 = b.x;
  const y2 = b.y + b.h / 2;
  const elbowX = x1 + Math.max(34, (x2 - x1) * 0.48);
  const top = Math.min(y1, y2) - 10;
  const left = Math.min(x1, elbowX, x2);
  const width = Math.max(x1, elbowX, x2) - left + 16;
  const height = Math.abs(y2 - y1) + 24;
  const startX = x1 - left;
  const midX = elbowX - left;
  const endX = x2 - left;
  const startY = y1 - top;
  const endY = y2 - top;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        pointerEvents: "none",
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: startX,
          top: startY,
          width: Math.max(2, midX - startX),
          height: 2,
          background: "rgba(255,255,255,0.26)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: midX,
          top: Math.min(startY, endY),
          width: 2,
          height: Math.max(2, Math.abs(endY - startY)),
          background: "rgba(255,255,255,0.26)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: Math.min(midX, endX),
          top: endY,
          width: Math.max(2, Math.abs(endX - midX) - 12),
          height: 2,
          background: "rgba(255,255,255,0.26)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: endX - 12,
          top: endY - 5,
          width: 12,
          height: 12,
          borderTop: "2px solid rgba(255,255,255,0.26)",
          borderRight: "2px solid rgba(255,255,255,0.26)",
          transform: "rotate(45deg)",
        }}
      />
    </div>
  );
}

function FlowchartScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);
  const outOp = frame < 150 ? 1 : fi(frame, 150, 170, 1, 0);
  const captions = [
    { from: 8, to: 66, text: "Flow starts at browser and agent panel, then enters API routes where planner, builder, and multimodal services are orchestrated." },
    { from: 66, to: 126, text: "Gemini services and Google Cloud Storage support generation, understanding, narration, and media persistence." },
    { from: 126, to: 170, text: "Remotion compiler and timeline builder return a live preview loop back to the interface." },
  ];
  const activeCaption = captions.find((caption) => frame >= caption.from && frame < caption.to)?.text ?? captions[0].text;
  const captionOpacity = fi(frame, 8, 24, 0, 1) * fi(frame, 148, 170, 1, 0);

  return (
    <AbsoluteFill style={{ opacity: inOp * outOp, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 72px 110px" }}>
      <div style={{ width: "100%" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 8, opacity: fi(frame, 0, 12, 0, 1) }}>
            How It Is Done
          </div>
        </div>

        <div style={{ ...glass(0.028), borderRadius: 30, marginTop: 2, height: 712, position: "relative", overflow: "hidden" }}>
          {CONNECTORS.map(([from, to], index) => (
            <Connector key={`${from}-${to}`} from={from} to={to} opacity={fi(frame, 18 + index * 3, 30 + index * 3, 0, 1)} />
          ))}

          {FLOW_NODES.map((node, index) => {
            const p = spr(frame, fps, 10 + index * 3, 16, 105);
            const opacity = interpolate(p, [0, 0.45], [0, 1], { extrapolateRight: "clamp" });
            const scale = interpolate(p, [0, 1], [0.95, 1]);
            const lines = node.label.split("\n");
            return (
              <div
                key={node.key}
                style={{
                  position: "absolute",
                  left: node.x,
                  top: node.y,
                  width: node.w,
                  height: node.h,
                  borderRadius: 20,
                  ...glass(0.035),
                  opacity,
                  transform: `scale(${scale})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  textAlign: "center",
                }}
              >
                {lines.map((line) => (
                  <div key={line} style={{ fontSize: 19, lineHeight: 1.22, color: "#fff", fontWeight: 700 }}>
                    {line}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
          <Pill label="Planner decomposes the brief" frame={frame} delay={66} />
          <Pill label="Scene builder runs in parallel" frame={frame} delay={72} />
          <Pill label="Remotion returns live timeline output" frame={frame} delay={78} />
        </div>
      </div>

      <CaptionBar left={72} right={72} bottom={22} text={activeCaption} opacity={captionOpacity} />
    </AbsoluteFill>
  );
}

function StackProofScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inOp = fi(frame, 0, 16, 0, 1);
  const outOp = frame < 150 ? 1 : fi(frame, 150, 170, 1, 0);
  const captions = [
    { from: 8, to: 68, text: "This scene packs judge-facing proof: stack, data paths, cloud deployment evidence, and practical implementation learnings." },
    { from: 68, to: 128, text: "Cards summarize real modules and workflows used in the build, including Gemini ADK orchestration and GCS media infrastructure." },
    { from: 128, to: 170, text: "Cloud Run endpoint and Terraform/GCP setup are surfaced here as direct deployment proof." },
  ];
  const activeCaption = captions.find((caption) => frame >= caption.from && frame < caption.to)?.text ?? captions[0].text;
  const captionOpacity = fi(frame, 8, 24, 0, 1) * fi(frame, 148, 170, 1, 0);

  return (
    <AbsoluteFill style={{ opacity: inOp * outOp, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 88px 110px" }}>
      <div style={{ width: "100%" }}>
        <div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: 10 }}>
          Tech, Data, Learnings, Proof
        </div>

        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {STACK_CARDS.map((card, index) => {
            const p = spr(frame, fps, 8 + index * 6, 17, 105);
            const opacity = interpolate(p, [0, 0.45], [0, 1], { extrapolateRight: "clamp" });
            const y = interpolate(p, [0, 1], [24, 0]);
            return (
              <div
                key={card.title}
                style={{
                  ...glass(0.035),
                  borderRadius: 24,
                  minHeight: 360,
                  padding: 22,
                  opacity,
                  transform: `translateY(${y}px)`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
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

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
          <div style={{ ...glass(0.03), borderRadius: 22, padding: "18px 22px", flex: 1 }}>
            <div style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>
              Live Deployment
            </div>
            <div style={{ fontFamily: MONO, fontSize: 18, color: "rgba(255,255,255,0.76)" }}>
              https://videoai-backend-pjymq552ea-uc.a.run.app
            </div>
          </div>
          <Pill label="Terraform + Cloud Run + GCS" frame={frame} delay={72} />
        </div>
      </div>

      <CaptionBar left={88} right={88} bottom={22} text={activeCaption} opacity={captionOpacity} />
    </AbsoluteFill>
  );
}

function StartTrailerScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spr(frame, fps, 6, 16, 112);
  const logoOpacity = interpolate(p, [0, 0.55], [0, 1], { extrapolateRight: "clamp" });
  const logoY = interpolate(p, [0, 1], [34, 0]);
  const titleOpacity = fi(frame, 16, 42, 0, 1);
  const taglineOpacity = fi(frame, 34, 62, 0, 1);
  const badgesOpacity = fi(frame, 52, 78, 0, 1);
  const fadeOut = fi(frame, 104, 124, 1, 0);

  return (
    <AbsoluteFill style={{ opacity: fadeOut, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 160px" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 38%, transparent 75%)" }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.48) 100%)",
        }}
      />

      <div style={{ transform: `translateY(${logoY}px)`, opacity: logoOpacity, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <LogoIcon size={90} />
        </div>
        <div style={{ opacity: titleOpacity }}>
          <ShimmerText text="SceneForge" frame={frame} fontSize={122} align="center" lineHeight={1.02} />
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 34,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.60)",
            opacity: taglineOpacity,
          }}
        >
          {TAGLINE}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, opacity: badgesOpacity }}>
          <Pill label="Gemini ADK" frame={frame} delay={0} />
          <Pill label="Remotion" frame={frame} delay={6} />
          <Pill label="Google Cloud" frame={frame} delay={12} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function EndTrailerScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spr(frame, fps, 6, 16, 110);
  const opacity = interpolate(p, [0, 0.45], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(p, [0, 1], [44, 0]);
  const titleOpacity = fi(frame, 10, 34, 0, 1);
  const tagOpacity = fi(frame, 24, 52, 0, 1);
  const chipsOpacity = fi(frame, 38, 72, 0, 1);
  const ctaOpacity = fi(frame, 68, 108, 0, 1);
  const fadeOut = fi(frame, 128, 150, 1, 0);
  const chips = ["Prompt", "Multimodal", "Agents", "Remotion", "Google Cloud"];

  return (
    <AbsoluteFill style={{ opacity: fadeOut, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 140px" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 44%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.015) 42%, transparent 78%)" }} />
      <div style={{ opacity, transform: `translateY(${y}px)`, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <LogoIcon size={82} />
        </div>
        <div style={{ opacity: titleOpacity }}>
          <ShimmerText text="SceneForge" frame={frame + 24} fontSize={108} align="center" lineHeight={1.03} />
        </div>
        <div style={{ marginTop: 14, fontSize: 34, lineHeight: 1.35, color: "rgba(255,255,255,0.60)", opacity: tagOpacity }}>
          {TAGLINE}
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 28, opacity: chipsOpacity }}>
          {chips.map((chip, index) => (
            <Pill key={chip} label={chip} frame={frame} delay={18 + index * 6} />
          ))}
        </div>
        <div style={{ marginTop: 30, fontSize: 24, letterSpacing: "0.08em", color: "rgba(255,255,255,0.42)", opacity: ctaOpacity }}>
          Describe your vision. SceneForge builds the motion.
        </div>
      </div>
    </AbsoluteFill>
  );
}

const SCENE_PLAYBACK = [
  // playFrames intentionally stop before each scene's built-in fade-out.
  { component: StartTrailerScene, playFrames: 104, holdFrame: 98 },
  { component: EditorIntroScene, playFrames: 182, holdFrame: 170 },
  { component: FeaturesScene, playFrames: 150, holdFrame: 138 },
  { component: FlowchartScene, playFrames: 150, holdFrame: 138 },
  { component: StackProofScene, playFrames: 150, holdFrame: 138 },
  { component: EndTrailerScene, playFrames: 128, holdFrame: 120 },
];

export const ShowcaseComp: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: FONT, overflow: "hidden" }}>
      <AmbientGlow frame={useCurrentFrame()} />
      <Particles frame={useCurrentFrame()} />
      <GridOverlay />

      {/* ── Scene visuals ── */}
      {SCENE_PLAYBACK.map(({ component: SceneComponent, playFrames, holdFrame }, index) => {
        const timing = SHOWCASE_AUDIO_TIMINGS[index];
        if (!timing) return null;

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

      {/* ── Per-scene narration — run `npm run generate:audio` to create these ── */}
      {SHOWCASE_AUDIO_TIMINGS.map((timing) => (
        <Sequence key={`audio-${timing.file}`} from={timing.from} durationInFrames={timing.durationInFrames}>
          <Audio src={staticFile(`audio/${timing.file}`)} volume={0.92} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
