"use client";

// Old page preserved at page.tsx.bak

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { SHOWCASE_DURATION, ShowcaseComp } from "@/remotion/ShowcaseComp";

/* ── white particle canvas ── */
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const dots = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.45 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const d of dots) {
        d.x = (d.x + d.vx + canvas.width) % canvas.width;
        d.y = (d.y + d.vy + canvas.height) % canvas.height;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d.a})`;
        ctx.fill();
      }
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x, dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(255,255,255,${0.08 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden />;
}

/* ── feature card ── */
function FeatureCard({ title, desc, delay }: { title: string; desc: string; delay: number }) {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ 
        transitionDelay: `${delay}ms`, 
        opacity: vis ? 1 : 0, 
        transform: vis ? "translateY(0) scale(1)" : "translateY(36px) scale(0.98)", 
        filter: vis ? "blur(0px)" : "blur(3px)",
        transition: "opacity 0.95s cubic-bezier(0.16, 1, 0.3, 1), transform 0.95s cubic-bezier(0.16, 1, 0.3, 1), filter 0.95s cubic-bezier(0.16, 1, 0.3, 1)" 
      }}
      className="group relative flex overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.06] to-transparent p-7 backdrop-blur-xl min-h-[220px] hover:border-white/25 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_42px_-18px_rgba(0,0,0,0.58)]"
    >
      {/* inner glow */}
      <div className="absolute inset-px rounded-[23px] bg-gradient-to-br from-white/[0.10] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute left-6 right-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />
      
      <div className="relative z-10 flex flex-1 min-h-[160px] flex-col justify-center overflow-hidden">
        <h3
          className="mb-3 text-[18px] leading-[1.15] font-bold tracking-tight text-white text-center group-hover:text-white transition-colors"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
          }}
        >
          {title}
        </h3>
        <p
          className="mx-auto text-[14px] leading-[1.6] text-center text-white/52 group-hover:text-white/68 transition-colors"
          style={{
            maxWidth: "92%",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
          }}
        >
          {desc}
        </p>
      </div>

      {/* decorative corner accent */}
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/[0.03] blur-3xl group-hover:bg-white/[0.08] transition-colors duration-500" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function Home() {
  const showcasePlayerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    // Try autoplay after mount (helps when media metadata lags behind first paint).
    const mountKick = window.setTimeout(() => {
      showcasePlayerRef.current?.play();
    }, 120);

    // Browsers may block unmuted autoplay after refresh; resume on first user gesture.
    const resumeOnGesture = () => {
      showcasePlayerRef.current?.play();
    };

    window.addEventListener("pointerdown", resumeOnGesture, { once: true });
    window.addEventListener("keydown", resumeOnGesture, { once: true });
    window.addEventListener("touchstart", resumeOnGesture, { once: true });

    return () => {
      window.clearTimeout(mountKick);
      window.removeEventListener("pointerdown", resumeOnGesture);
      window.removeEventListener("keydown", resumeOnGesture);
      window.removeEventListener("touchstart", resumeOnGesture);
    };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        html, body { font-family: 'Inter', sans-serif; background: #000; color: #fff; overflow-y: auto !important; }
        ::selection { background: rgba(255,255,255,0.15); }

        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #aaa 40%, #fff 60%, #aaa 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3.5s linear infinite;
        }
        .hero-fade { animation: fade-up 0.8s ease both; }
        .hero-fade-2 { animation: fade-up 0.8s 0.15s ease both; }
        .hero-fade-3 { animation: fade-up 0.8s 0.3s ease both; }
        .float-anim { animation: float 6s ease-in-out infinite; }

        .btn-primary {
          background: #fff;
          color: #000;
          font-weight: 700;
          border-radius: 12px;
          padding: 14px 32px;
          font-size: 15px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s, transform 0.2s;
        }
        .btn-primary:hover { opacity: 0.88; transform: scale(1.03); }
        .btn-secondary {
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.75);
          border-radius: 12px;
          padding: 14px 32px;
          font-size: 15px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: border-color 0.2s, color 0.2s;
          backdrop-filter: blur(8px);
        }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.45); color: #fff; }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          border-radius: 999px;
          padding: 5px 16px;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
        }
      `}</style>

      <Particles />

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(0,0,0,0.6)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
          {/* logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>SceneForge</span>
          </div>
          {/* nav right */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span className="badge">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse 2s infinite" }} />
              Gemini Live
            </span>
            <Link href="/editor" style={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "#fff", backdropFilter: "blur(8px)", transition: "border-color 0.2s" }}>
              Open Editor →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden" }}>
        {/* subtle radial glow */}
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="hero-fade" style={{ marginBottom: 20 }}>
          <span className="badge">🏆 Gemini Live Agent Challenge 2026</span>
        </div>

        <h1 className="hero-fade-2" style={{ fontSize: "clamp(2.8rem, 6vw, 5.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 840, marginBottom: 24 }}>
          Turn Words Into{" "}
          <span className="shimmer-text">Cinematic Motion.</span>
        </h1>

        <p className="hero-fade-3" style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", maxWidth: 580, lineHeight: 1.65, marginBottom: 40 }}>
          SceneForge: Agentic Multimodal Motion Graphics Studio. Describe your vision, upload media, and watch AI compose, annotate, and animate professional‑grade videos — live in the browser, powered by Gemini.
        </p>

        <div className="hero-fade-3" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 60 }}>
          <Link href="/editor" id="hero-cta" className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Launch Studio
          </Link>
          <a href="#features" className="btn-secondary">Explore Features</a>
        </div>

        {/* mock editor window */}
        <div className="float-anim" style={{ width: "100%", maxWidth: 720, borderRadius: 18, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.7)" }}>
          {/* window chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
            <div style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
            <span style={{ marginLeft: 10, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>sceneforge — editor</span>
          </div>
          {/* mock timeline */}
          <div style={{ padding: "20px 24px" }}>
            {[
              { label: "Visual Layer",    w: "80%",  opacity: 0.55 },
              { label: "Audio Track",     w: "60%",  opacity: 0.4 },
              { label: "AI Annotations",  w: "65%",  opacity: 0.5 },
              { label: "Text Overlay",    w: "50%",  opacity: 0.35 },
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                <span style={{ width: 110, textAlign: "right", fontSize: 10, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>{t.label}</span>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: 3 }}>
                  <div style={{ height: 16, borderRadius: 3, width: t.w, background: `rgba(255,255,255,${t.opacity})` }} />
                </div>
              </div>
            ))}
            {/* playhead */}
            <div style={{ position: "relative", height: 2, borderRadius: 2, background: "rgba(255,255,255,0.1)", marginTop: 8 }}>
              <div style={{ position: "absolute", left: "38%", top: -4, width: 2, height: 10, borderRadius: 2, background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.7)" }} />
              <div style={{ height: "100%", width: "38%", borderRadius: 2, background: "linear-gradient(90deg,rgba(255,255,255,0.4),transparent)" }} />
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.2)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, animation: "float 2.5s ease-in-out infinite" }}>
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontSize: 10, letterSpacing: "0.15em" }}>SCROLL</span>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 940, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, padding: "40px 24px" }}>
          {[
            "Gemini-Powered Generation",
            "Agentic Scene Orchestration",
            "Multimodal Media Input",
            "Cloud Asset Management",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 14,
                padding: "16px 18px",
                textAlign: "center",
                color: "rgba(255,255,255,0.78)",
                fontSize: 13,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "120px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 78 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Capabilities</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#fff" }}>Everything you need to create</h2>
            <p style={{ marginTop: 12, color: "rgba(255,255,255,0.4)", fontSize: 15 }}>One studio. Every AI superpower.</p>
          </div>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "stretch" }}>
            {[
              { title: "Prompt → Animation", desc: "Describe any animation in plain language. Gemini generates live Remotion TSX scenes instantly.", delay: 0 },
              { title: "Agentic Story Pipeline", desc: "ADK planner decomposes your brief into scenes, builds each one in parallel, and assembles a timeline-ready composition.", delay: 80 },
              { title: "Multimodal Understanding", desc: "Upload images, audio, or PDFs. Gemini extracts structured insights for direct timeline use.", delay: 160 },
              { title: "AI Image Generation", desc: "Generate and edit 16:9 visual assets with Gemini image models. Reference-image workflows keep scenes consistent.", delay: 240 },
              { title: "AI Narration & TTS", desc: "Convert scene text to natural-sounding voiceovers with Gemini speech models and sync to your timeline.", delay: 320 },
              { title: "Cloud Media Pipeline", desc: "All assets stored securely in Google Cloud Storage with signed URLs — accessible anywhere, any time.", delay: 400 },
            ].map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── SHOWCASE VIDEO ── */}
      <section id="showcase" style={{ padding: "96px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>In Action</p>
            <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, color: "#fff" }}>SceneForge in Motion</h2>
            <p style={{ marginTop: 12, color: "rgba(255,255,255,0.4)", fontSize: 15 }}>A full agentic motion-graphics pipeline — from prompt to timeline — powered by Gemini.</p>
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }}>
            <Player
              ref={showcasePlayerRef}
              component={ShowcaseComp}
              durationInFrames={SHOWCASE_DURATION}
              fps={30}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: "100%", aspectRatio: "16/9" }}
              controls
              loop
              autoPlay
            />
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "56px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 28 }}>Built with</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {["Gemini Pro / Flash", "Google ADK", "Remotion 4", "Next.js 16", "React 19", "Cloud Storage", "Vercel AI SDK", "TypeScript"].map((t) => (
              <span key={t} style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "6px 16px", fontSize: 12, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.03)" }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding: "80px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: "64px 40px", textAlign: "center", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(16px)" }}>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)", fontWeight: 900, color: "#fff", marginBottom: 14 }}>Ready to create?</h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 16, lineHeight: 1.6, marginBottom: 36 }}>
            Open the studio and start building your first AI-generated video composition in under a minute.
          </p>
          <Link href="/editor" id="bottom-cta" className="btn-primary">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Open the Editor
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "28px 24px", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg viewBox="0 0 24 24" fill="none" style={{ width: 14, height: 14 }}>
                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>SceneForge</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Gemini Live Agent Challenge 2026 · Built with ❤️ and AI</p>
          <a href="https://github.com/navaneeth-algorithm/VideoAI" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", transition: "color 0.2s" }}>
            GitHub →
          </a>
        </div>
      </footer>
    </>
  );
}
