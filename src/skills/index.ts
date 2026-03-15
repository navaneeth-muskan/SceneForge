import { examples } from "@/examples/code";

// Import markdown files at build time
import threeDSkill from "./3d.md";
import chartsSkill from "./charts.md";
import messagingSkill from "./messaging.md";
import sequencingSkill from "./sequencing.md";
import socialMediaSkill from "./social-media.md";
import springPhysicsSkill from "./spring-physics.md";
import transitionsSkill from "./transitions.md";
import typographySkill from "./typography.md";
import aiUiCinematicSkill from "./ai-ui-cinematic.md";
import imageGenerationSkill from "./image-generation.md";
import componentsSkill from "./components.md";
import mapsSkill from "./maps.md";
import terminalSkill from "./terminal.md";
import brandSkill from "./brand.md";
import travelSkill from "./travel.md";
import tutorialSkill from "./tutorial.md";
import tablesSkill from "./tables.md";
import mathematicsSkill from "./mathematics.md";
import ecommerceSkill from "./ecommerce.md";
import marketingSkill from "./marketing.md";
import portfolioSkill from "./portfolio.md";
import browserMockupSkill from "./browser-mockup.md";
import bentoGridSkill from "./bento-grid.md";
import scienceSkill from "./science.md";
import kidsStorySkill from "./kids-story.md";
import timelinePathSkill from "./timeline-path.md";
import chemistryPhysicsSkill from "./chemistry-physics.md";
import flowchartNodesSkill from "./flowchart-nodes.md";
import themedBackgroundsSkill from "./themed-backgrounds.md";

// Guidance skills (markdown files with patterns/rules)
const GUIDANCE_SKILLS = [
  "charts",
  "typography",
  "social-media",
  "messaging",
  "3d",
  "transitions",
  "sequencing",
  "spring-physics",
  "ai-ui-cinematic",
  "image-generation",
  "components",
  "maps",
  "terminal",
  "brand",
  "travel",
  "tutorial",
  "tables",
  "mathematics",
  "ecommerce",
  "marketing",
  "portfolio",
  "browser-mockup",
  "bento-grid",
  "science",
  "kids-story",
  "timeline-path",
  "chemistry-physics",
  "flowchart-nodes",
  "themed-backgrounds",
] as const;

// Example skills (complete working code references)
const EXAMPLE_SKILLS = [
  "example-histogram",
  "example-progress-bar",
  "example-text-rotation",
  "example-falling-spheres",
  "example-animated-shapes",
  "example-lottie",
  "example-gold-price-chart",
  "example-typewriter-highlight",
  "example-word-carousel",
  "example-lower-third",
  "example-title-card",
  "example-kinetic-text",
  "example-animated-counter",
  "example-gradient-bg",
  "example-world-map",
] as const;

export const SKILL_NAMES = [...GUIDANCE_SKILLS, ...EXAMPLE_SKILLS] as const;

export type SkillName = (typeof SKILL_NAMES)[number];

// Map guidance skill names to imported content
const guidanceSkillContent: Record<(typeof GUIDANCE_SKILLS)[number], string> = {
  charts: chartsSkill,
  typography: typographySkill,
  "social-media": socialMediaSkill,
  messaging: messagingSkill,
  "3d": threeDSkill,
  transitions: transitionsSkill,
  sequencing: sequencingSkill,
  "spring-physics": springPhysicsSkill,
  "ai-ui-cinematic": aiUiCinematicSkill,
  "image-generation": imageGenerationSkill,
  components: componentsSkill,
  maps: mapsSkill,
  terminal: terminalSkill,
  brand: brandSkill,
  travel: travelSkill,
  tutorial: tutorialSkill,
  tables: tablesSkill,
  mathematics: mathematicsSkill,
  ecommerce: ecommerceSkill,
  marketing: marketingSkill,
  portfolio: portfolioSkill,
  "browser-mockup": browserMockupSkill,
  "bento-grid": bentoGridSkill,
  science: scienceSkill,
  "kids-story": kidsStorySkill,
  "timeline-path": timelinePathSkill,
  "chemistry-physics": chemistryPhysicsSkill,
  "flowchart-nodes": flowchartNodesSkill,
  "themed-backgrounds": themedBackgroundsSkill,
};

// Map example skill names to example IDs
const exampleIdMap: Record<(typeof EXAMPLE_SKILLS)[number], string> = {
  "example-histogram": "histogram",
  "example-progress-bar": "progress-bar",
  "example-text-rotation": "text-rotation",
  "example-falling-spheres": "falling-spheres",
  "example-animated-shapes": "animated-shapes",
  "example-lottie": "lottie-animation",
  "example-gold-price-chart": "gold-price-chart",
  "example-typewriter-highlight": "typewriter-highlight",
  "example-word-carousel": "word-carousel",
  "example-lower-third": "lower-third",
  "example-title-card": "title-card",
  "example-kinetic-text": "kinetic-text",
  "example-animated-counter": "animated-counter",
  "example-gradient-bg": "gradient-bg",
  "example-world-map": "world-map",
};

export function getSkillContent(skillName: SkillName): string {
  // Handle example skills - return the code directly
  if (skillName.startsWith("example-")) {
    const exampleId =
      exampleIdMap[skillName as (typeof EXAMPLE_SKILLS)[number]];
    const example = examples.find((e) => e.id === exampleId);
    if (example) {
      return `## Example: ${example.name}\n${example.description}\n\n\`\`\`tsx\n${example.code}\n\`\`\``;
    }
    return "";
  }

  // Handle guidance skills - return imported markdown content
  return (
    guidanceSkillContent[skillName as (typeof GUIDANCE_SKILLS)[number]] || ""
  );
}

export function getCombinedSkillContent(skills: SkillName[]): string {
  if (skills.length === 0) {
    return "";
  }

  const contents = skills
    .map((skill) => getSkillContent(skill))
    .filter((content) => content.length > 0);

  return contents.join("\n\n---\n\n");
}

export const SKILL_DETECTION_PROMPT = `Classify this motion graphics prompt into ALL applicable categories.
A prompt can match multiple categories. Only include categories that are clearly relevant.

Guidance categories (patterns and rules):
- charts: data visualizations, graphs, histograms, bar charts, pie charts, progress bars, statistics, metrics
- typography: kinetic text, typewriter effects, text animations, word carousels, animated titles, text-heavy content
- social-media: Instagram stories, TikTok content, YouTube shorts, social media posts, reels, vertical video
- messaging: chat interfaces, WhatsApp conversations, iMessage, chat bubbles, text messages, DMs, messenger
- 3d: 3D objects, ThreeJS, spatial animations, rotating cubes, 3D scenes
- transitions: scene changes, fades between clips, slide transitions, wipes, multiple scenes
- sequencing: multiple elements appearing at different times, staggered animations, choreographed entrances
- spring-physics: bouncy animations, organic motion, elastic effects, overshoot animations
- ai-ui-cinematic: futuristic product UI, AI interface demo, prompt-to-result flow, file stacks, typing bars, cursor motion, tooltips, floating panels, audio visualizer, cinematic software reveal
- image-generation: AI-generated images, photorealistic backgrounds, stylized visuals, scenes needing a specific photo or illustration that isn't uploaded
- components: pre-built motion components, lower thirds, title cards, kinetic text, animated counters, gradient backgrounds, broadcast graphics
- maps: world maps, geographic data, country highlights, location markers, global reach, travel routes, regional visualizations
- terminal: code typing animation, terminal output, CLI commands, syntax highlighting, code walkthroughs, developer tools, programming, debug, diff
- brand: logo reveal, brand identity, portfolio, product mockup, social card, KPI stats, company presentation, business video, customer count, metrics
- travel: travel map, Mapbox, country zoom, city location, route animation, flight path, journey narrative, destination reveal, geographic data
- tutorial: step-by-step guide, how-to, tutorial, feature walkthrough, cursor spotlight, annotated screenshot, onboarding, explainer, numbered steps, arrow callout, annotation arrow, SVG pointer, callout label, highlight annotation, draw-on arrow, pointing arrow, callout line, label overlay
- mathematics: equation solving, derivatives, algebra steps, proof walkthrough, formula animation, graph reasoning, neural network explanation
- ecommerce: product feature callouts, product specs, review cards, testimonials, social proof, launch promo, shopping ad
- marketing: kinetic hook text, launch teaser, campaign promo, bold headline motion, short-form ad pacing, conversion messaging
- portfolio: developer portfolio, tech stack showcase, skill orbit, capability reel, agency intro, personal brand showcase
- browser-mockup: browser window, app demo, linkedin feed, youtube ui, focus highlight, spotlight cutout, social interface
- bento-grid: asymmetrical card grid, feature summary cards, apple-style layout, saas overview, modular tiles
- science: biology, microscope, magnify, technical diagram, science labels, cell structures, annotation callouts
- kids-story: storybook, fairy tale, whimsical, kids animation, pop-up book, playful narrative, cartoon scene
- timeline-path: roadmap, timeline, curved journey, milestone path, lifecycle steps, progress over time
- chemistry-physics: AtomicOrbitals, ChemicalBonding, WavePhotonEmission, electrons, photon, radiation, covalent, atoms, quantum, wave emission
- flowchart-nodes: AnimatedFlowchart, nodes, logical paths, decision tree, data flow, software architecture, process graph
- themed-backgrounds: ThemedBackgrounds, blueprint grid, molecular hexagon, aurora background, ambient scientific background, abstract technical backdrop

Code examples (complete working references):
- example-histogram: animated bar chart with spring animations and @remotion/shapes
- example-progress-bar: loading bar animation from 0 to 100%
- example-text-rotation: rotating words with fade/blur transitions
- example-falling-spheres: 3D bouncing spheres with ThreeJS and physics simulation
- example-animated-shapes: bouncing/rotating SVG shapes (circle, triangle, rect, star)
- example-lottie: loading and displaying Lottie animations from URL
- example-gold-price-chart: bar chart with Y-axis labels, monthly data, staggered animations
- example-typewriter-highlight: typewriter effect with cursor blink, pause, and word highlight
- example-word-carousel: rotating words with crossfade and blur transitions
- example-lower-third: broadcast lower-third overlay with slide-in accent bar and name/title
- example-title-card: full-screen hero title card with animated gradient and spring text entrances
- example-kinetic-text: word-by-word kinetic typography with spring entrance and blur filter
- example-animated-counter: counting animation from 0 to a target stat value with spring easing
- example-gradient-bg: animated hue-shifting gradient background with floating orbs
- example-world-map: interactive SVG world map with highlighted countries and pulsing markers

Return an array of matching category names. Return an empty array if none apply.`;
