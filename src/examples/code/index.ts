import { animatedShapesExample } from "./animated-shapes";
import { fallingSpheresExample } from "./falling-spheres";
import { goldPriceChartExample } from "./gold-price-chart";
import { histogramExample } from "./histogram";
import { lottieAnimationExample } from "./lottie-animation";
import { progressBarExample } from "./progress-bar";
import { textRotationExample } from "./text-rotation";
import { typewriterHighlightExample } from "./typewriter-highlight";
import { wordCarouselExample } from "./word-carousel";
import { lowerThirdExample } from "./lower-third";
import { titleCardExample } from "./title-card";
import { kineticTextExample } from "./kinetic-text";
import { animatedCounterExample } from "./animated-counter";
import { gradientBgExample } from "./gradient-bg";
import { worldMapExample } from "./world-map";

export interface RemotionExample {
  id: string;
  name: string;
  description: string;
  code: string;
  durationInFrames: number;
  fps: number;
  category: "Text" | "Charts" | "Animation" | "3D" | "Other";
}

export const examples: RemotionExample[] = [
  textRotationExample,
  histogramExample,
  progressBarExample,
  animatedShapesExample,
  lottieAnimationExample,
  fallingSpheresExample,
  goldPriceChartExample,
  typewriterHighlightExample,
  wordCarouselExample,
  lowerThirdExample,
  titleCardExample,
  kineticTextExample,
  animatedCounterExample,
  gradientBgExample,
  worldMapExample,
];

export function getExampleById(id: string): RemotionExample | undefined {
  return examples.find((e) => e.id === id);
}

export function getExamplesByCategory(
  category: RemotionExample["category"],
): RemotionExample[] {
  return examples.filter((e) => e.category === category);
}
