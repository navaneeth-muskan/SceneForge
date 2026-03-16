// ─── Gemini ADK Agent Definitions ──────────────────────────────────────────
// Server-only. These agents run inside Next.js route handlers.
// Requires: GOOGLE_GENAI_API_KEY environment variable

import { LlmAgent, InMemoryRunner, FunctionTool, AgentTool, GOOGLE_SEARCH, isFinalResponse } from "@google/adk";
import type { AssetRef, StoryPlan, SceneSpec, AgentCapabilities } from "./types";
import { DEFAULT_CAPABILITIES } from "./types";
import { GEMINI_MODELS } from "./models";
import { analyzeMediaTool, generateImageTool, generateSvgTool, resolveConfigTool, editImageTool } from "./adk-tools";
import { z } from "zod";

// ─── Capability helpers ─────────────────────────────────────────────────────

function capabilityBlock(c: AgentCapabilities): string {
  const lines: string[] = [];
  if (c.generateImages) lines.push("✅ generate_image — AI-create photorealistic/stylized images for image-type scenes");
  else lines.push("❌ Image generation DISABLED — do NOT plan scenes that require AI image creation");
  if (c.generateAudio) lines.push("✅ Text-to-speech narration — plan audio scenes with narrationText populated");
  else lines.push("❌ Audio/TTS DISABLED — do NOT include audio-type scenes");
  if (c.useCharts) lines.push("✅ Charts & data visualisation — animated bars, histograms, line graphs");
  if (c.use3D) lines.push("✅ 3D scenes — ThreeJS / @remotion/three for spatial animations");
  if (c.useMaps) lines.push("✅ SVG world maps — react-simple-maps for geographic stories");
  if (c.useComponents) lines.push("✅ Pre-built motion components — LowerThird, TitleCard, KineticText, AnimatedCounter, GradientBackground");
  if (c.useTerminal) lines.push("✅ Code/terminal animations — CodeWindow (typing), TerminalOutput, CodeHighlight, DiffView");
  if (c.useBrand) lines.push("✅ Brand & portfolio — LogoReveal, SocialCard, ProductMockup, StatHighlight, BrandTicker");
  if (c.useTravel) lines.push("✅ Mapbox GL travel maps — MapboxScene (fly-to camera), RouteOverlay, LocationPin");
  if (c.useTutorial) lines.push("✅ Tutorial/explainer — StepCallout, SpotlightCursor, ProgressTracker, AnnotationArrow, ZoomRegion");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Tool: commit_story_plan
// The planner agent calls this to output a structured StoryPlan.
// ---------------------------------------------------------------------------

const SceneSpecSchema = z.object({
  index: z.number(),
  type: z.enum(["animation", "title", "video", "image", "audio", "transition"]),
  description: z.string(),
  durationSeconds: z.number(),
  assetHint: z.string().optional(),
  generateFromAsset: z.boolean().optional(),
  titleText: z.string().optional(),
  titlePreset: z.string().optional(),
  narrationText: z.string().optional(),
  voice: z.string().optional(),
});

const StoryPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  scenes: z.array(SceneSpecSchema),
  totalDurationSeconds: z.number(),
  skillHints: z.array(z.string()),
});

const commitStoryPlanTool = new FunctionTool({
  name: "commit_story_plan",
  description:
    "Commit the final story plan as structured output. Call this once you have determined all scenes.",
  parameters: StoryPlanSchema,
  execute: async (input) => {
    // Strip undefined values — ADK resolves undefined as context variable lookups
    return JSON.parse(JSON.stringify({ status: "committed", plan: input }));
  },
});

// ---------------------------------------------------------------------------
// Story Planner Agent (GEMINI_MODELS.pro)
// ---------------------------------------------------------------------------

export function createStoryPlannerAgent(
  availableAssets: AssetRef[],
  capabilities: AgentCapabilities = DEFAULT_CAPABILITIES
) {
  const assetList =
    availableAssets.length > 0
      ? availableAssets
          .map((a) => {
            const gcsSuffix = a.gcsUri ? `, gcsUri: ${a.gcsUri}` : "";
            return `- "${a.name}" (${a.mediaType}, id: ${a.id}${gcsSuffix})`;
          })
          .join("\n")
      : "No assets uploaded.";

  return new LlmAgent({
    name: "story_planner",
    model: GEMINI_MODELS.pro,
    instruction: `You are a creative video story director specialising in short-to-long-form video production (up to 400 seconds).

Your job: receive a creative brief → decompose it into a sequence of vivid, engaging scenes that form a compelling story.

## Available Capabilities
${capabilityBlock(capabilities)}

## Available Uploaded Assets
${assetList}

## Scene Type Rules
- **"animation"** — an animated Remotion React scene (kinetic text, data viz, lower thirds, particle effects, gradient backgrounds, motion graphics). PREFER this for visual storytelling.
- **"title"** — a simple full-screen text card (use only for very brief 1-2s text moments, not as a substitute for animation)
- **"video"** — analysis-only source type. Use uploaded video assets for understanding, narration grounding, and region/event extraction, but do NOT place raw uploaded video footage in the final rendered timeline.
- **"image"** — a still image scene. ${capabilities.generateImages ? "To use an uploaded asset AS-IS, provide its ID/name in `assetHint`. To GENERATE a new image based closely on an uploaded asset, provide both `assetHint` AND set `generateFromAsset=true`. If no asset matches or you want a fresh image without a reference, omit the assetHint." : "ONLY use if a matching image asset is uploaded above."}
${capabilities.generateImages ? "Image scenes must remain clean base visuals: do not ask for baked arrows, callout boxes, labels, or annotation marks inside the generated pixels; those guidance elements are added later via Remotion overlays." : ""}
- **"audio"** — ${capabilities.generateAudio ? "a narration-primary scene where speech IS the main event (animated visual backing is auto-generated). Use this ONLY when narration is the focus. For visual scenes (animation/image/video), add narrationText directly on those scenes instead." : "DISABLED — do not plan audio scenes."}
- **"transition"** — a brief visual bridge (1-2 seconds) between major section changes

## Creative Mandate
1. Plan **4-20 scenes** for a rich story. Each scene: 2-60 seconds (durationSeconds). Prefer longer outputs by default: target around 200-300 seconds unless the user explicitly asks for a short cut. Never exceed 400 seconds total.
2. **When no assets are uploaded, be FULLY creative** — use animation and image scenes to bring the story to life. Never produce a boring story.
3. **Mix scene types with rhythm**: use fast cuts (2-3s transitions) and slow beats (6-12s hero moments).
4. Open with a HIGH-IMPACT scene (animation or generated image). End memorably.
5. ${capabilities.generateImages ? "Use 'image' type scenes liberally for establishing shots, backgrounds, environments, characters, products." : ""}
6. ${capabilities.generateAudio ? "Add `narrationText` to EVERY scene (animation, image, video, title) so narration plays continuously throughout the video with NO silent gaps. Write narrationText as a full engaging sentence explaining or describing what is happening in that specific scene — not a summary, but a real spoken line a presenter would say. Pick one voice for the whole story and set it on every scene's `voice` field. Valid voices: aoede (warm female), charon (deep male), kore (calm female), puck (upbeat male), fenrir (strong male), leda (bright female), zephyr (airy female), orus (rich male). Voice names are lowercase. The standalone 'audio' scene type is optional — prefer embedding narrationText on animation/image scenes instead. Critical timing rule: each scene's narration must fully finish before the next scene starts and should leave roughly 1 second of breathing room after the spoken line; if a line needs more time, increase that scene duration rather than cutting or spilling narration." : ""}
11. For uploaded video assets: treat them as analysis/reference input only. Convert insights into generated visuals (animation/image/motion graphics). Do not plan scenes that directly show the raw uploaded video as final output.
7. Populate **skillHints** per scene with tags the builder should use. Available tags: charts, typography, social-media, messaging, 3d, transitions, sequencing, spring-physics, ai-ui-cinematic, image-generation, mathematics, ecommerce, marketing, portfolio, browser-mockup, bento-grid, science, kids-story, timeline-path, chemistry-physics, flowchart-nodes, themed-backgrounds${capabilities.useComponents ? ", components" : ""}${capabilities.useMaps ? ", maps" : ""}${capabilities.useCharts ? ", charts" : ""}${capabilities.useTerminal ? ", terminal" : ""}${capabilities.useBrand ? ", brand" : ""}${capabilities.useTravel ? ", travel" : ""}${capabilities.useTutorial ? ", tutorial" : ""}
8. For animation scenes, suggest vivid descriptions: colours, layout, motion style, mood — not just "animation about X".
9. When the brief involves AI products, software demos, agent workflows, prompt-to-result storytelling, futuristic interfaces, or cinematic UI reveals, include "ai-ui-cinematic" in skillHints and describe the scene with specific interface motifs such as prompt bars, floating panels, file stacks, cursors, tooltips, waveform feedback, glow lighting, and staged reveal choreography.
10. When planning explanatory annotations or region callouts, prefer point-led explanations: identify what the object is, where the anchor point is, and how a cursor/arrow/tooltip should guide the eye as timeline overlays. Do not request baked annotation graphics inside generated image pixels, and avoid planning visible rectangular boundary-box overlays unless the user explicitly asks for them.
${capabilities.useComponents ? `
## Pre-Built Components Available
The scene builder knows these motion components by name — reference them in descriptions:
- **LowerThird** — animated broadcast name/title overlay with slide-in accent bar
- **TitleCard** — full-screen hero title with animated gradient background and spring entrances
- **KineticText** — word-by-word kinetic typography for quotes/key messages
- **AnimatedCounter** — counting number animation for statistics/metrics
- **GradientBackground** — animated gradient color shift for dynamic backgrounds
Include "components" in skillHints when a scene description references any of these.
` : ""}${capabilities.useMaps ? `
## Maps Available
The scene builder can render an animated SVG world map. Include "maps" in skillHints for geographic/travel/global scenes.
` : ""}${capabilities.useCharts ? `
## Charts Available
The scene builder can create animated bar/line/histogram scenes. Include "charts" in skillHints for data-heavy scenes.
` : ""}${capabilities.useTerminal ? `
## Code / Terminal Animations Available
Comp patterns: CodeWindow (character-by-character typing), TerminalOutput ($ prompt + line-by-line output), CodeHighlight (line spotlight), DiffView (red/green diff). Include "terminal" in skillHints for scenes showing code, CLI commands, developer workflows, or syntax.
` : ""}${capabilities.useBrand ? `
## Brand & Portfolio Components Available
Comp patterns: LogoReveal (clip-mask wipe), SocialCard (engagement counter), ProductMockup (3-D device frame), StatHighlight (KPI count-up), BrandTicker (infinite scroll). Include "brand" in skillHints for logo reveals, company stats, social showcases, or product launches.
` : ""}${capabilities.useTravel ? `
## Mapbox GL Travel Maps Available
Comp patterns:
- MapboxScene (fly-to camera driven by frame)
- RouteOverlay (animated GeoJSON route)
- LocationPin (pulsing marker + label)
- MultiLocationTour (multi-city sequence with per-stop info card)
- LocationRevealCard (3D card over map; supports overlay-zoom, split-screen, full-expand reveal)

Use these when scenes mention places, cities, countries, routes, travel stories, global comparison, or location reveals.
For each destination, show clear visual location context (marker/route/camera focus) and an accompanying location card.
Card content should be minimal and clean: city name + country, with optional image panel if available.
Required choreography for place reveals:
- Start from global/world framing when multiple places are involved.
- Move toward destination with a visible pointer/marker motion.
- Keep map visible while the location card appears; do not hide map behind full opaque overlays unless explicitly requested.
- Final zoom MUST be map camera zoom (center/zoom/pitch/bearing via map.jumpTo), not image/card-only scaling.
- Add text overlays where appropriate (kicker, destination title, subline, stop/progress label).
Uses REMOTION_MAPBOX_TOKEN from .env. Never invent, hardcode, or paste Mapbox tokens in generated code. Include "travel" in skillHints for map-based scenes, destinations, journeys, geographic storytelling, or place reveals.
` : ""}${capabilities.useTutorial ? `
## Tutorial / Explainer Components Available
Comp patterns: StepCallout (numbered spring-in steps), SpotlightCursor (SVG mask spotlight), ProgressTracker (animated step bar), AnnotationArrow (self-drawing SVG arrow), ZoomRegion (scale+pan zoom). Include "tutorial" in skillHints for how-to guides, walkthroughs, feature explanations, or annotated demos.
` : ""}

## AI UI Cinematic Style
When a scene uses "ai-ui-cinematic", plan it like a premium software reveal instead of a generic dashboard.
- Prefer layered glass panels, prompt bars, streaming text, floating inspectors, result cards, or file stacks.
- Choreograph the scene in stages: prompt/input, processing feedback, then reveal/payoff.
- Use cursor motion, click pulses, selection states, highlight masks, or tooltip cards to guide the eye.
- Add depth with glow, blur, shadows, bloom-like radial gradients, and parallax between foreground and background layers.
- Keep text concise and product-like; let motion and composition carry the cinematic feel.
- For AI explanations or object analysis, use point-based callouts with arrows, cursor cues, and short tooltip-like descriptions as overlay elements rather than baked image content.
- For cursors, pointers, badges, arrows, and UI accents, use inline SVG or icon-like vector paths, and reuse existing \`public/\` assets when they already fit the scene.
## Live Web Search
You have access to a \`web_search_agent\` tool. Call it when the user's brief involves:
- Current events, recent news, trending topics, or real-time data
- Factual accuracy about real people, companies, places, or products
- Statistics, prices, or any information that may have changed recently
Pass the most relevant search query as the \`request\` argument.
If the brief is clearly fictional or purely creative with no factual dependencies, skip the search.After calling web_search_agent, read its response carefully and incorporate the returned facts, dates, names, and figures directly into your scene descriptions and narrationText. Do not ignore the search results.
For each uploaded asset with a URL, call analyze_media before committing the plan. For document/PDF assets, call analyze_media with fileType "pdf". Signed HTTPS URLs are valid for analysis; gcsUri (if provided) is metadata/reference.
Use the returned description, colorPalette, and tags to write richer scene descriptions and assetHints.

## Resource Provisioning
You have access to a \`provision_resource\` tool. Call it if you need a specific asset (image, SVG icon, logo, pattern) or want to check if a service (like Mapbox) is configured, and no suitable asset was uploaded. After calling it, use the provided resource or guidance in your plan.
You also have an \`edit_image\` agent. To maintain character, subject, or stylistic consistency across your planned scenes, you MUST instruct these tools to use a \`referenceImageUrl\` (from an uploaded asset or previously generated image URL).

When you have the plan, call commit_story_plan.`,
    tools: [
      commitStoryPlanTool,
      analyzeMediaTool,
      new AgentTool({ agent: createWebSearchAgent() }),
      provisionResourceTool(),
      editImageAgentTool(),
    ],
  });
}

// ---------------------------------------------------------------------------
// Scene Builder Agent (GEMINI_MODELS.flash)
// ---------------------------------------------------------------------------

const commitSceneCodeTool = new FunctionTool({
  name: "commit_scene_code",
  description:
    "Commit the Remotion animation code for this scene. Only used for animation and transition scenes.",
  parameters: z.object({
    code: z
      .string()
      .describe("Full Remotion TSX component code for the animation or transition scene."),
  }),
  execute: async (input) => ({
    status: "committed",
    code: input.code,
  }),
});

export function createSceneBuilderAgent(
  scene: SceneSpec,
  fps: number,
  capabilities: AgentCapabilities = DEFAULT_CAPABILITIES
) {
  const frames = Math.round(scene.durationSeconds * fps);
  const skillHints = (scene as SceneSpec & { skillHints?: string[] }).skillHints ?? [];

  return new LlmAgent({
    name: "scene_builder",
    model: GEMINI_MODELS.flash,
    instruction: `You are an expert Remotion motion graphics engineer. Build exactly one scene.

## Scene Spec
- Description: ${scene.description}
- Type: ${scene.type}
- Duration: ${scene.durationSeconds}s (${frames} frames at ${fps} fps)
${scene.narrationText ? `- Narration: "${scene.narrationText}"` : ""}
${skillHints.length > 0 ? `- Skill hints: ${skillHints.join(", ")}` : ""}

## General Code Rules
1. Export as: \`export const SceneComp = () => { ... }\`
2. Imports ONLY from \`"remotion"\`: useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring, Sequence, Img
3. **CRITICAL: NEVER prefix hooks or components with \`React.\`** (e.g. use \`useCurrentFrame()\`, NOT \`React.useCurrentFrame()\`). The sandbox environment provides them as flat top-level bindings.
4. ALL constants (colors, text, sizes, timing) defined INSIDE the component body
5. Use the FULL canvas — no small centered boxes; fill the entire 1920×1080 space
6. Prefer \`spring()\` for entrances/reveals, \`interpolate()\` for linear progress
7. ALWAYS clamp: \`{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }\`
8. Rich visuals — use gradients, layered elements, geometric shapes, rich color palettes
9. Avoid plain black or white backgrounds — use atmosphere: deep blues, purples, teals, warm ambers
10. **CRITICAL: Use ONLY ASCII identifiers** (a–z, A–Z, 0–9, _) for ALL variable names, function names, component names, and JSX tag names. Non-ASCII characters (Chinese, Arabic, emoji, etc.) cause ReferenceErrors at runtime. Translated text MUST be plain JS string values like \`const label = "展现";\`, never used as an identifier.
11. **CRITICAL: NEVER use unescaped backticks (\`\`)** inside string literals or template literals because your generated code is wrapped inside a larger template literal by the compiler. If you need dynamic CSS values, ALWAYS use React inline style objects \`style={{ background: \`radial-gradient... \` }}\` instead of concatenating raw CSS strings with backticks.
12. If skill hints include \`ai-ui-cinematic\`, build a cinematic software scene with modular UI layers: prompt bars, floating cards, file stacks, cursors, callouts, waveform/progress feedback, and atmospheric glow.
13. For explanatory overlays, do NOT draw rectangular region boxes unless explicitly requested. Prefer a point marker, a curved arrow, a small cursor or spotlight, and a concise callout card.
14. For cursor/callout/UI accent elements, inline SVG and icon-like vector shapes are encouraged. If relevant assets already exist in \`public/\`, reuse them instead of rebuilding heavier structures.
15. If you need a brand-new image asset mid-scene, use \`generate_image\`. If you need to transform an existing image, use the \`edit_image\` tool/agent. To enforce character or stylistic consistency across generated images, you MUST pass a \`referenceImageUrl\` (e.g., an uploaded asset or a previously generated image URL).
16. If skill hints include \`travel\` or \`maps\` and the scene asks for fly-to/zoom/route/city-to-city movement, use a REAL map implementation:
        - Use \`delayRender()\` and \`continueRender()\` ONLY in the map init flow (never per-frame).
        - Initialize \`new mapboxgl.Map(...)\` in a primary \`useEffect\` (dependencies MUST be strictly \`[]\`).
        - Map constructor MUST include \`interactive: false\` and \`fadeDuration: 0\` to avoid frame-to-frame tile ghosting/flicker in Remotion renders.
        - Prefer stable map styles for video rendering: avoid terrain and heavy POI/label transition effects that animate outside frame control.
        - Use a second \`useEffect\` (dependencies MUST be strictly \`[frame, map]\`) to drive camera movement.
        - Inside the camera effect:
            1. NEVER call \`delayRender()\`, \`continueRender()\`, or \`setState()\` here.
            2. Update camera via \`map.jumpTo\` or \`map.setFreeCameraOptions\` keyed to \`frame / fps\`.
            3. Keep it pure and idempotent so pause/resume/scrub does not trigger render loops.
14. NEVER hardcode Mapbox access tokens (no literal pk.* strings). Do NOT declare a MAPBOX_TOKEN const or set \`mapboxgl.accessToken\` in generated scene code. Tokens are injected by the host app from .env (REMOTION_MAPBOX_TOKEN). Use the injected \`mapboxgl\` object directly — \`mapboxgl.accessToken\` is already set before your code runs.
15. NEVER access Mapbox through \`window.mapboxgl\` or any \`window.*\` alias. Always use the injected \`mapboxgl\` binding directly (\`new mapboxgl.Map(...)\`).
16. **CRITICAL: STRICT useEffect RULES:** 
    - NEVER omit the dependency array in a \`useEffect\`. Omitting it causes infinite loops that will crash the editor immediately.
    - NEVER use dynamic lengths or \`.filter(Boolean)\` in dependency arrays (e.g., \`[map, flag ? true : false]\`). React requires a constant array size.
    - ALWAYS provide a static, hardcoded array like \`[]\` or \`[frame, map]\`.
17. ${capabilities.useComponents ? `
## Pre-Built Motion Component Patterns
Inline these battle-tested patterns directly in your animation code:

### LowerThird (broadcast name overlay)
\`\`\`
const barScale = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
const textOp = interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" });
const slideX = interpolate(frame, [0, 12], [-40, 0], { extrapolateRight: "clamp" });
// Place at: position:"absolute", bottom:120, left:80
// Bar: width barScale*240, height:4, backgroundColor:"#3b82f6"
// Name: fontSize:36, fontWeight:700, color:"#fff"
// Title: fontSize:22, color:"#94a3b8"
\`\`\`

### TitleCard (full-screen hero title)
\`\`\`
const entrance = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
const bgAngle = interpolate(frame, [0, durationInFrames], [135, 225], { extrapolateRight: "clamp" });
// background: linear-gradient(bgAngle deg, #0f0c29, #302b63, #24243e)
// title: opacity:entrance, scale:0.8+entrance*0.2, translateY:(1-entrance)*40
\`\`\`

### KineticText (word-by-word entrance)
\`\`\`
const words = "Your message here".split(" ");
// Per word: spring({ frame: frame - i*6, fps, config:{damping:10,stiffness:200} })
// opacity: interpolate(wordFrame,[0,8],[0,1])
// transform: scale(0.4+entrance*0.6) translateY((1-entrance)*60px)
\`\`\`

### AnimatedCounter (statistics)
\`\`\`
const progress = spring({ frame, fps, from:0, to:1, config:{damping:20,stiffness:60} });
const value = Math.round(progress * TARGET).toLocaleString();
// Display: fontSize:140, fontWeight:900, color:"#3b82f6"
\`\`\`

### GradientBackground (animated backdrop)
\`\`\`
const angle = interpolate(frame,[0,durationInFrames],[135,315],{extrapolateRight:"clamp"});
// background: linear-gradient(angle deg, #1e1b4b, #312e81, #1e40af)
\`\`\`
` : ""}${capabilities.use3D ? `
## 3D Scenes
Use ThreeCanvas from "@remotion/three" and primitives from "@react-three/fiber".
Only for scenes that genuinely need 3D depth — not for flat motion graphics.
` : ""}${capabilities.useCharts ? `
## Charts & Data Viz
Use custom SVG bars/paths — no external chart library.
Stagger bars: spring({ frame: frame - i*5, fps }). Bar height = spring * maxH, anchored at bottom.
Use @remotion/shapes for additional SVG shapes.
` : ""}${capabilities.useMaps ? `
## SVG World Maps
Import: { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
GeoJSON: "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
Animate country fill with interpolate(frame, ...) for highlight transitions.
` : ""}${capabilities.useTerminal ? `
## Code / Terminal Animation Patterns
Build INLINE — do NOT import external libs. Pure Remotion + React.

### CodeWindow (typing animation)
\`\`\`
const code = \`function greet(name) { return "Hello " + name; }\`;
const typeProgress = interpolate(frame, [0, durationInFrames * 0.8], [0, 1], { extrapolateRight: "clamp" });
const visibleCode = code.slice(0, Math.floor(typeProgress * code.length));
const cursorVisible = Math.floor(frame / 15) % 2 === 0;
// Container: background:#1e1e1e, fontFamily:"Courier New", fontSize:16, padding:24
// Title bar: background:#2d2d2d, colored dots (red#ff5f56 yellow#ffbd2e green#27c93f)
// Line numbers: color:#555, fixed width 40px right-aligned
// Blink: append a <span style={{background:"#aeafad",width:2,height:16,verticalAlign:"middle"}}/>
\`\`\`

### TerminalOutput ($ prompt + line-by-line output)
\`\`\`
const command = "git clone https://github.com/user/repo.git";
const outputLines = ["Cloning into 'repo'...", "remote: Done.", "✓ Success"];
const cmdProgress = interpolate(frame, [0, durationInFrames * 0.3], [0, 1], { extrapolateRight: "clamp" });
const visibleCmd = command.slice(0, Math.floor(cmdProgress * command.length));
const outputStart = durationInFrames * 0.35;
const outputLineInterval = (durationInFrames * 0.5) / outputLines.length;
const visibleLines = Math.max(0, Math.floor((frame - outputStart) / outputLineInterval));
// Container: background:#161b22, fontFamily:monospace, borderRadius:10
// Prompt: color:#3fb950 (user@host), color:#58a6ff (path), color:#8b949e ($)
// Output lines: color:#8b949e for normal, color:#3fb950 for ✓ success lines
\`\`\`

### DiffView (before/after code diff)
\`\`\`
const diffLines = [
  { type:"unchanged", text:"function fetch(id) {" },
  { type:"removed",   text:"-  return fetch('/api/'+id);" },
  { type:"added",     text:"+  return await fetch('/api/' + id);" },
];
const lineRevealInterval = durationInFrames / diffLines.length;
const visibleCount = Math.min(Math.ceil(frame / lineRevealInterval) + 1, diffLines.length);
// removed: background:rgba(243,139,168,0.15), color:#f38ba8, borderLeft:"3px solid #f38ba8"
// added: background:rgba(166,227,161,0.12), color:#a6e3a1, borderLeft:"3px solid #a6e3a1"
\`\`\`
` : ""}

## AI UI Cinematic Patterns
Use these motifs when skill hints include ai-ui-cinematic:

### PromptBar / Streaming Input
\`\`\`
const promptText = "Generate launch visuals for a voice AI workspace";
const typeProgress = interpolate(frame, [0, durationInFrames * 0.32], [0, 1], { extrapolateRight: "clamp" });
const visiblePrompt = promptText.slice(0, Math.floor(typeProgress * promptText.length));
const caretVisible = Math.floor(frame / 12) % 2 === 0;
// Container: glass panel, borderRadius:24, border:"1px solid rgba(255,255,255,0.12)", backdropFilter:"blur(18px)"
// Accent chip + subtle inner shadow for premium UI feel
\`\`\`

### FileStack / Result Cards
\`\`\`
const cards = [0, 1, 2];
// Each card: delayed spring with slight y-offset, scale falloff, and opacity ramp
// Back cards should be slightly blurred / dimmed to create depth
// Use translateY + translateX + scale to fan the stack rather than identical centered boxes
\`\`\`

### Cursor / Tooltip Choreography
\`\`\`
const cursorX = interpolate(frame, [12, 42, 70], [420, 940, 1180], { extrapolateRight: "clamp" });
const cursorY = interpolate(frame, [12, 42, 70], [720, 420, 500], { extrapolateRight: "clamp" });
const clickPulse = interpolate(frame, [42, 50], [0, 1], { extrapolateRight: "clamp" });
// Tooltip card can spring in 6-10 frames after the cursor reaches target
// Add a ring pulse or soft glow to the active focus point
\`\`\`

### Visualizer / Processing Feedback
\`\`\`
const bars = new Array(12).fill(true);
// Per bar: height driven by sin(frame*0.12 + i*0.8) mapped into 18..88
// Use low-alpha cyan/indigo fills and rounded tops for subtle AI-processing motion
\`\`\`

### Atmosphere
\`\`\`
// Add 1-2 large blurred radial glows behind the main UI.
// Use a dark cinematic base with brighter focal highlights around the active panel.
// Sequence reveals so the scene tells a story: input -> thinking -> reveal -> hold.
\`\`\`
${capabilities.useBrand ? `
## Brand & Portfolio Patterns

### LogoReveal (clip-mask text wipe)
\`\`\`
const revealProgress = spring({ frame, fps, config: { stiffness: 80, damping: 22 } });
const clipWidth = interpolate(revealProgress, [0, 1], [0, 100]);
// h1 style: clipPath:\`inset(0 \${100 - clipWidth}% 0 0)\`, fontSize:96, fontWeight:900
// Accent bar: height:4, width animates from 0 to 140, background:"linear-gradient(90deg,#f59e0b,#fbbf24)"
// Tagline: opacity interpolated from frame 30→45, translateY 20→0
\`\`\`

### StatHighlight (KPI count-up)
\`\`\`
const countProgress = interpolate(frame, [10, durationInFrames - 10], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp",
  easing: (t) => 1 - Math.pow(1 - t, 3),
});
const value = Math.round(countProgress * TARGET_VALUE);
// Display: fontSize:80, fontWeight:900, color:#fff; suffix in brand color
// Animated bar: width interpolated frame-delay → durationInFrames-8
\`\`\`

### BrandTicker (infinite scroll strip)
\`\`\`
const items = ["Innovation","Quality","Speed","Scale","Innovation","Quality","Speed","Scale"];
const itemWidth = 220;
const offset = (frame * 1.5) % (items.length * itemWidth);
// transform: translateX(-offset px) — NO transitions, pure frame math
// Fade edges: gradient left/right overlays (position:absolute, width:120, pointer-events:none)
\`\`\`
` : ""}${capabilities.useTutorial ? `
## Tutorial / Explainer Patterns

### StepCallout (spring-in numbered steps)
\`\`\`
const steps = ["Install package", "Configure API key", "Start building"];
const stepDuration = Math.floor(durationInFrames / steps.length);
// Per step i: stepFrame = frame - i*stepDuration
// entryScale = spring({ frame: Math.max(0, stepFrame), fps, config:{stiffness:150,damping:18} })
// Number badge: width:48, height:48, borderRadius:"50%", background: activeColor when isActive
// isActive = stepFrame >= 0 && frame < (i+1)*stepDuration + stepDuration*0.5
// dimOpacity = isActive ? 1 : 0.35
\`\`\`

### AnnotationArrow (self-drawing SVG arrow)
\`\`\`
const drawProgress = interpolate(frame, [10, durationInFrames * 0.4], [0, 1], { extrapolateRight: "clamp" });
const pathLength = 380;
const dashOffset = pathLength * (1 - drawProgress);
// <svg><defs><marker id="arrowhead" ...><polygon points="0 0,10 3.5,0 7" fill="#f59e0b"/></marker></defs>
// <path d="M 200 320 Q 300 180 520 200" fill="none" stroke="#f59e0b" strokeWidth="2.5"
//       strokeDasharray=PATHLEN strokeDashoffset=DASHOFFSET markerEnd="url(#arrowhead)" />
// Note: set strokeDasharray to pathLength, strokeDashoffset to dashOffset variable
\`\`\`

### SpotlightCursor (SVG mask spotlight)
\`\`\`
const spotProgress = spring({ frame, fps, config: { stiffness: 90, damping: 22 } });
const spotX = interpolate(spotProgress, [0, 1], [startX, endX]);
const spotY = interpolate(spotProgress, [0, 1], [startY, endY]);
// <svg style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
//   <defs><mask id="m"><rect width="100%" height="100%" fill="white"/>
//   <circle cx=SPOT_X cy=SPOT_Y r="140" fill="black"/></mask></defs>
// Note: set cx/cy to spotX/spotY variables
//   <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#m)"/>
// </svg>
// Cursor dot: position:absolute, left:spotX-10, top:spotY-10, width:20, borderRadius:"50%"
\`\`\`
` : ""}
Return ONLY the code. No markdown fences, no explanation.`,
    tools: [
      commitSceneCodeTool,
      analyzeMediaTool,
      generateImageTool,
      editImageAgentTool(),
    ],
  });
}

// ---------------------------------------------------------------------------
// Code Fixer Agent (GEMINI_MODELS.flash)
// Receives potentially-broken LLM-generated Remotion code and returns a
// corrected version that will compile cleanly inside the browser sandbox.
// ---------------------------------------------------------------------------

const commitFixedCodeTool = new FunctionTool({
  name: "commit_fixed_code",
  description:
    "Commit the corrected Remotion animation code. Call this once with the fully fixed code.",
  parameters: z.object({
    code: z
      .string()
      .describe("The corrected, compile-ready Remotion TSX component code."),
  }),
  execute: async (input) => ({ status: "committed", code: input.code }),
});

export function createCodeFixerAgent(fps: number) {
  return new LlmAgent({
    name: "code_fixer",
    model: GEMINI_MODELS.flash,
    instruction: `You are a Remotion TypeScript code reviewer and fixer.
You receive a Remotion animation component that may contain bugs. Fix every issue you find, then call commit_fixed_code with the corrected code.

## What to check and fix
1. **Trailing prose** — remove any natural-language text that appears after the component's closing \`}\` or \`};\` (e.g. "empty style line", "This animation shows...", stray identifiers or comments outside the component body). The code must end at the component's closing brace.
2. **Export shape** — the component MUST be exported as exactly \`export const SceneComp = () => { ... }\`. If the name differs, rename it to SceneComp. If it uses a function declaration, convert to an arrow-function const.
3. **Non-ASCII identifiers** — variable/function/JSX tag names MUST use only ASCII (a–z, A–Z, 0–9, _). Replace non-ASCII identifiers with descriptive ASCII equivalents. Translated text must be a plain string value (\`const label = "展现";\`), never an identifier. If you see any variable named \`_nonAsciiN\`, replace it with a descriptive string value (e.g. \`const _nonAscii3 = "Label";\`). If the original text is available, use it as the value.
4. **Imports** — REMOVE all import statements. The sandbox injects all dependencies at runtime.
5. **registerRoot / export default** — remove any \`registerRoot(...)\` call and any \`export default ...\` statement.
6. **Unclosed JSX / mismatched braces** — fix any unclosed JSX tags or mismatched \`{\` / \`}\` that would cause a parse error.
7. **Syntax errors** — fix missing semicolons at statement boundaries, stray tokens, invalid property names, or any other TypeScript/JSX parse errors.
8. **Remotion API** — if \`useVideoConfig()\` is used, ensure \`durationInFrames\` and \`fps\` are destructured from it (scene fps = ${fps}). Clamp all interpolations with \`{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }\`.
9. **interpolate() output ranges** — Remotion \`interpolate()\` output ranges must contain only numbers. Never write \`interpolate(..., ["0%", "100%"] )\`, colors, transform strings, or CSS strings in the output range. Instead interpolate numbers and embed them into template strings, or use conditionals / helper functions for non-numeric values.
10. **Mapbox binding safety** — NEVER access Mapbox through \`window.mapboxgl\`, \`globalThis.mapboxgl\`, or \`(window as any).mapboxgl\`. Always use the injected \`mapboxgl\` variable directly.
11. **React hooks in sandbox** — NEVER use \`React.useState/useEffect/useMemo/useRef\`; use flat bindings \`useState/useEffect/useMemo/useRef\`.
12. **Map camera lifecycle** — in any \`useEffect(..., [frame, map])\` camera driver, NEVER call \`delayRender()\`, \`continueRender()\`, \`setState()\`, or \`map.once('idle', ...)\`. Keep this effect pure and idempotent (camera/source updates only).
13. **delayRender usage** — if needed for map scenes, use \`delayRender\` only once in map-init flow (\`useEffect(..., [])\`) and call \`continueRender\` only from load/init completion.

## What NOT to change
- Do not redesign the animation — preserve the visual intent and all working logic.
- Do not add or remove helper constants/functions unless required by a fix.
- Do not add any import statements.

Call commit_fixed_code with the corrected code. No markdown fences, no explanation.`,
    tools: [commitFixedCodeTool],
  });
}

export async function runCodeFixer(code: string, fps: number): Promise<string> {
  const agent = createCodeFixerAgent(fps);
  const runner = new InMemoryRunner({ agent, appName: "videoai-fixer" });

  let fixed: string | undefined;

  const events = runner.runEphemeral({
    userId: "user",
    newMessage: {
      role: "user",
      parts: [{ text: `Review and fix this Remotion animation code:\n\n${code}` }],
    },
  });

  for await (const event of events) {
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if (
          "functionCall" in part &&
          part.functionCall?.name === "commit_fixed_code"
        ) {
          const args = part.functionCall.args as { code?: string };
          console.log(`[fixer] Fixed code committed (${args?.code?.length ?? 0} chars)`);
          if (args?.code) fixed = args.code;
        }
        if ("functionCall" in part && part.functionCall) {
          console.log(`[fixer] Calling tool: ${part.functionCall.name}`, part.functionCall.args);
        }
        if ("functionResponse" in part && part.functionResponse) {
          console.log(`[fixer] Tool response: ${part.functionResponse.name}`, part.functionResponse.response);
        }
        // Fallback: accept final text response if the tool call was not made
        if (isFinalResponse(event) && "text" in part && part.text && !fixed) {
          const fenceMatch = part.text.match(
            /```(?:tsx?|jsx?|typescript|javascript)?\n?([\s\S]*?)\n?```/i,
          );
          fixed = fenceMatch ? fenceMatch[1].trim() : part.text.trim();
        }
      }
    }
  }

  // If the agent returned nothing useful, fall back to the original
  return fixed?.trim() || code;
}

function isLikelyMapSceneCode(code: string): boolean {
  return (
    /\bmapboxgl\.Map\s*\(/.test(code) ||
    /\bwindow\s*\.\s*mapboxgl\b/.test(code) ||
    /\(window\s+as\s+any\)\.mapboxgl/.test(code) ||
    /\bglobalThis\s*\.\s*mapboxgl\b/.test(code)
  );
}

function sanitizeGeneratedSceneCode(code: string): string {
  let next = code;

  // Normalize hook access for sandboxed execution.
  next = next
    .replace(/\bReact\.useState\b/g, "useState")
    .replace(/\bReact\.useEffect\b/g, "useEffect")
    .replace(/\bReact\.useMemo\b/g, "useMemo")
    .replace(/\bReact\.useRef\b/g, "useRef");

  // Normalize all window/global mapbox access to injected mapboxgl binding.
  next = next
    .replace(/\(window\s+as\s+any\)\.mapboxgl/g, "mapboxgl")
    .replace(/\bwindow\s*\.\s*mapboxgl\b/g, "mapboxgl")
    .replace(/\bglobalThis\s*\.\s*mapboxgl\b/g, "mapboxgl")
    .replace(/\bmapboxGl\b/g, "mapboxgl");

  // Remove per-frame render-handle usage that can trigger Player update loops.
  next = next.replace(
    /(useEffect\s*\(\s*\(\s*\)\s*=>\s*\{)([\s\S]*?)(\}\s*,\s*\[\s*frame\s*,\s*map\s*\]\s*\))/g,
    (_whole, prefix: string, body: string, suffix: string) => {
      const cleanedBody = body
        .replace(/^\s*const\s+\w+\s*=\s*delayRender\([^)]*\)\s*;?\s*$/gm, "")
        .replace(/^\s*delayRender\([^)]*\)\s*;?\s*$/gm, "")
        .replace(/^\s*continueRender\([^)]*\)\s*;?\s*$/gm, "")
        .replace(
          /^\s*map\.once\(\s*["']idle["']\s*,\s*\(\)\s*=>\s*continueRender\([^)]*\)\s*\)\s*;?\s*$/gm,
          "",
        );
      return `${prefix}${cleanedBody}${suffix}`;
    },
  );

  return next.trim();
}

function hasObviousSyntaxRisk(code: string): boolean {
  const bracesOpen = (code.match(/\{/g) ?? []).length;
  const bracesClose = (code.match(/\}/g) ?? []).length;
  const parensOpen = (code.match(/\(/g) ?? []).length;
  const parensClose = (code.match(/\)/g) ?? []).length;

  return (
    bracesOpen !== bracesClose ||
    parensOpen !== parensClose ||
    /```/.test(code) ||
    /^\s*import\s+/m.test(code)
  );
}

function shouldRunCodeFixer(scene: SceneSpec, code: string): boolean {
  if (!code.trim()) return false;
  const isMapScene = scene.type === "animation" && isLikelyMapSceneCode(code);
  if (!isMapScene) return true;

  // For map scenes, skip fixer unless there are obvious structural issues.
  return hasObviousSyntaxRisk(code);
}

// ---------------------------------------------------------------------------
// Run a story planner agent and extract the plan
// ---------------------------------------------------------------------------

export async function runStoryPlanner(
  prompt: string,
  availableAssets: AssetRef[],
  capabilities: AgentCapabilities = DEFAULT_CAPABILITIES
): Promise<{ plan: StoryPlan; reasoning: string }> {
  const agent = createStoryPlannerAgent(availableAssets, capabilities);
  const runner = new InMemoryRunner({ agent, appName: "videoai-story" });

  let plan: StoryPlan | null = null;
  let reasoning = "";

  const events = runner.runEphemeral({
    userId: "user",
    newMessage: {
      role: "user",
      parts: [{ text: prompt }],
    },
  });

  for await (const event of events) {
    // Collect reasoning/text for display
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        if ("text" in part && part.text) {
          reasoning += part.text;
        }
        // Log tool activity
        if ("functionCall" in part && part.functionCall) {
          console.log(`[planner] Calling tool: ${part.functionCall.name}`, part.functionCall.args);
        }
        if ("functionResponse" in part && part.functionResponse) {
          console.log(`[planner] Tool response: ${part.functionResponse.name}`, part.functionResponse.response);
        }
        // Extract plan from tool call responses
        if (
          "functionCall" in part &&
          part.functionCall?.name === "commit_story_plan" &&
          part.functionCall.args
        ) {
          const args = part.functionCall.args as Record<string, unknown>;
          console.log(`[planner] Story plan committed: ${args.title}`);
          plan = args as unknown as StoryPlan;
        }
        if (
          "functionResponse" in part &&
          part.functionResponse?.name === "commit_story_plan"
        ) {
          const resp = part.functionResponse.response as Record<string, unknown>;
          if (resp?.plan) {
            plan = resp.plan as StoryPlan;
          }
        }
      }
    }
  }

  // Fallback: parse from reasoning text if tool wasn't called
  if (!plan) {
    plan = parsePlanFromText(reasoning, prompt);
  }

  return { plan, reasoning };
}

// ---------------------------------------------------------------------------
// Run a scene builder agent and extract the code
// ---------------------------------------------------------------------------

export async function runSceneBuilder(
  scene: SceneSpec,
  fps: number,
  capabilities: AgentCapabilities = DEFAULT_CAPABILITIES
): Promise<{ code?: string }> {
  const agent = createSceneBuilderAgent(scene, fps, capabilities);
  const runner = new InMemoryRunner({ agent, appName: "videoai-scene" });

  let code: string | undefined;

  const events = runner.runEphemeral({
    userId: "user",
    newMessage: {
      role: "user",
      parts: [
        {
          text: `Generate the Remotion animation for: ${scene.description}`,
        },
      ],
    },
  });

  for await (const event of events) {
    if (event.content?.parts) {
      for (const part of event.content.parts) {
        // Log tool activity
        if ("functionCall" in part && part.functionCall) {
          console.log(`[builder] [scene ${scene.index}] Calling tool: ${part.functionCall.name}`, part.functionCall.args);
        }
        if ("functionResponse" in part && part.functionResponse) {
          console.log(`[builder] [scene ${scene.index}] Tool response: ${part.functionResponse.name}`, part.functionResponse.response);
        }
        // Extract code from commit_scene_code call
        if (
          "functionCall" in part &&
          part.functionCall?.name === "commit_scene_code"
        ) {
          const args = part.functionCall.args as { code?: string };
          console.log(`[builder] [scene ${scene.index}] Code committed (${args?.code?.length ?? 0} chars)`);
          if (args?.code) code = args.code;
        }
        // Collect raw text as fallback code source (final response only).
        // Prefer extracting the content of the first code fence — this discards
        // any surrounding prose ("Here is the code:", "This animation shows...").
        if (isFinalResponse(event) && "text" in part && part.text && !code) {
          const fenceMatch = part.text.match(
            /```(?:tsx?|jsx?|typescript|javascript)?\n?([\s\S]*?)\n?```/i,
          );
          code = fenceMatch ? fenceMatch[1].trim() : (code ?? "") + part.text;
        }
      }
    }
  }

  // Strip markdown fences if the model wrapped the code
  let cleanCode = code
    ? code
        .replace(/^```(?:tsx|typescript|ts|jsx|js)?\n?/i, "")
        .replace(/```$/, "")
        .replace(/^export\s+default\s+\w+\s*;?\s*$/gm, "") // strip rogue export default lines
        .replace(/^registerRoot\s*\([^)]*\)\s*;?\s*$/gm, "") // strip CLI-only registerRoot calls
        .trim()
    : undefined;

  // Discard any trailing prose / stray tokens that appear after the component
  // closes (e.g. "empty style line" hallucinated by the LLM). Find the export
  // const or export function declaration and brace-count to its end, then slice.
  if (cleanCode) {
    const compStart = cleanCode.search(
      /export\s+(?:const|function)\s+\w+/,
    );
    if (compStart !== -1) {
      // Locate the opening brace of the component body
      const braceOpen = cleanCode.indexOf("{", compStart);
      if (braceOpen !== -1) {
        let depth = 1;
        let end = -1;
        for (let i = braceOpen + 1; i < cleanCode.length; i++) {
          const ch = cleanCode[i];
          if (ch === "{") depth++;
          else if (ch === "}") {
            if (--depth === 0) { end = i; break; }
          }
        }
        if (end !== -1) {
          // Preserve helpers declared before the export (slice from 0, not compStart)
          cleanCode = cleanCode.slice(0, end + 1).trimEnd();
        }
      }
    }
  }

  const sanitizedCode = cleanCode ? sanitizeGeneratedSceneCode(cleanCode) : undefined;

  // Pass code through fixer only when needed. For map scenes with valid structure,
  // skip fixer to avoid reintroducing unstable lifecycle patterns.
  const maybeFixedCode =
    sanitizedCode && shouldRunCodeFixer(scene, sanitizedCode)
      ? await runCodeFixer(sanitizedCode, fps)
      : sanitizedCode;

  const finalCode = maybeFixedCode
    ? sanitizeGeneratedSceneCode(maybeFixedCode)
    : undefined;

  return { code: finalCode };
}

// ---------------------------------------------------------------------------
// Grounded Web Search Agent (GEMINI_MODELS.flash + GOOGLE_SEARCH only)
// ---------------------------------------------------------------------------

export interface WebSearchSuggestion {
  title: string;
  url: string;
  snippet?: string;
}

export interface WebSearchResult {
  answer: string;
  renderedContent: string;
  searchSuggestions: WebSearchSuggestion[];
}

export function createWebSearchAgent() {
  return new LlmAgent({
    name: "web_search_agent",
    model: GEMINI_MODELS.flash,
    instruction: `You are a live web research assistant. Use Google Search to find current information about the requested topic.

Respond with a concise factual summary (3-6 sentences) covering the key facts, dates, names, figures, and context you found. If confidence is low or results conflict, state that clearly. Do not wrap output in markdown fences.`,
    tools: [GOOGLE_SEARCH],
  });
}

export async function runWebSearch(query: string): Promise<WebSearchResult> {
  const agent = createWebSearchAgent();
  const runner = new InMemoryRunner({ agent, appName: "videoai-search" });

  let finalText = "";

  const events = runner.runEphemeral({
    userId: "user",
    newMessage: {
      role: "user",
      parts: [{ text: query }],
    },
  });

  for await (const event of events) {
    if (!event.content?.parts) continue;
    for (const part of event.content.parts) {
      if (isFinalResponse(event) && "text" in part && part.text) {
        finalText += part.text;
      }
    }
  }

  const answer = finalText.trim() || "No grounded search response was generated.";
  return {
    answer,
    renderedContent: `<p>${answer.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
    searchSuggestions: [],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePlanFromText(text: string, prompt: string): StoryPlan {
  // Best-effort: extract JSON block if the model emitted one
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i) ||
    text.match(/\{[\s\S]*"scenes"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[1] ?? jsonMatch[0]);
      if (json.scenes) return json as StoryPlan;
    } catch {
      // ignore parse error
    }
  }

  // Hard fallback: long-form default plan aligned with planner targets.
  return {
    title: prompt.slice(0, 60),
    description: prompt,
    scenes: [
      {
        index: 0,
        type: "animation",
        description: `Opening: ${prompt}`,
        durationSeconds: 36,
      },
      {
        index: 1,
        type: "title",
        description: "Main message",
        durationSeconds: 24,
        titleText: prompt.slice(0, 80),
        titlePreset: "modern-title",
      },
      {
        index: 2,
        type: "image",
        description: `Context scene for: ${prompt}`,
        durationSeconds: 36,
      },
      {
        index: 3,
        type: "animation",
        description: `Detailed walkthrough for: ${prompt}`,
        durationSeconds: 42,
      },
      {
        index: 4,
        type: "image",
        description: `Supporting visual chapter for: ${prompt}`,
        durationSeconds: 30,
      },
      {
        index: 5,
        type: "animation",
        description: `Closing animation for: ${prompt}`,
        durationSeconds: 42,
      },
    ],
    totalDurationSeconds: 210,
    skillHints: [],
  };
}

// ---------------------------------------------------------------------------
// Resource Provisioner Agent (GEMINI_MODELS.pro + creative tools)
// ---------------------------------------------------------------------------

export function createResourceProvisionerAgent() {
  return new LlmAgent({
    name: "resource_provisioner",
    model: GEMINI_MODELS.pro,
    instruction: `You are a Resource Provisioning Assistant. Your job is to resolve missing assets or configurations for a video story.

## Your Capabilities
1. **SVG Generation**: Use \`generate_svg\` to create raw SVG code for icons, logos, or patterns.
2. **Image Generation**: Use \`generate_image\` to create base visuals when no uploaded assets exist.
3. **Config Resolution**: Use \`resolve_config\` to check if services like Mapbox are available.

## Your Workflow
- If the planner needs an icon/graphic: call \`generate_svg\`, then provide the raw <svg> code.
- If the planner needs a specific image: call \`generate_image\`, then provide the \`imageDataUrl\`.
- If the planner is unsure about env variables: call \`resolve_config\`.
- Always be creative and autonomous. If a resource isn't provided, MAKE it.
- If the planner asks to maintain consistency with an existing photo/asset, pass its URL as \`referenceImageUrl\` when calling \`generate_image\`.`,
    tools: [generateImageTool, generateSvgTool, resolveConfigTool, editImageAgentTool()],
  });
}

/**
 * Tool wrapper for the Resource Provisioner Agent.
 * Story Planner calls this to autonomously resolve missing resources.
 */
export function provisionResourceTool() {
  return new AgentTool({
    agent: createResourceProvisionerAgent(),
  });
}

// ---------------------------------------------------------------------------
// Image Editor Agent (GEMINI_MODELS.flash + image-to-image tools)
// ---------------------------------------------------------------------------

export function createImageEditorAgent() {
  return new LlmAgent({
    name: "image_editor",
    model: GEMINI_MODELS.flash,
    instruction: `You are a Visual Aesthetic Assistant. Your job is to edit or transform images based on reference photos.
    
The Story Planner or User will provide a URL to a reference image in their request. You MUST extract that URL and use it directly. NEVER ask the user to upload a photo or provide a base photo — you are a backend agent, you cannot converse directly with the user. If a URL is in the prompt, pass it immediately as the \`referenceUrl\` to the \`edit_image\` tool.

## Your Capabilities
1. **Image-to-Image**: Use \`edit_image\` to transform a reference image (e.g., style transfer, branding, background swap).
2. **Analysis**: Use \`analyze_media\` to understand the content and style of a reference image before editing.

## Your Workflow
- If the planner provides a photo URL and wants a "similar style": call \`analyze_media\` to extract style tags, then call \`edit_image\` with those tags and the \`referenceUrl\`.
- If the planner wants to "brand" an image: call \`edit_image\` with instructions to add logos or brand colors, passing the \`referenceUrl\`.
- Always maintain subject consistency from the reference image unless asked to change it.`,
    tools: [editImageTool, analyzeMediaTool],
  });
}

/**
 * Tool wrapper for the Image Editor Agent.
 */
export function editImageAgentTool() {
  return new AgentTool({
    agent: createImageEditorAgent(),
  });
}
