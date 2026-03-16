import * as Babel from "@babel/standalone";
import { Lottie } from "@remotion/lottie";
import * as RemotionShapes from "@remotion/shapes";
import { ThreeCanvas } from "@remotion/three";
import {
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  Video,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";
import * as mapboxglModule from "mapbox-gl";
const mapboxgl = (mapboxglModule as any).default || mapboxglModule;

export interface CompilationResult {
  Component: React.ComponentType | null;
  error: string | null;
}

function findInvalidInterpolateOutputRange(code: string): string | null {
  const interpolateCallPattern = /interpolate\s*\(([^)]|\)(?!\s*;))*\)/gms;
  const matches = code.match(interpolateCallPattern) ?? [];

  for (const call of matches) {
    const arrayMatches = [...call.matchAll(/\[((?:[^\[\]]|\[[^\[\]]*\])*)\]/gms)];
    if (arrayMatches.length < 2) continue;

    const outputRange = arrayMatches[1]?.[1] ?? "";
    if (/['"`]/.test(outputRange)) {
      return "Generated scene code uses interpolate() with string output values. Remotion interpolate() only supports numeric output ranges. Use numeric interpolation and wrap it in a template string, or use discrete conditionals for string values like colors, degrees, or percentages.";
    }
  }

  return null;
}

// Strip imports and extract component body from LLM-generated code
// Safety layer in case LLM includes full ES6 syntax despite instructions
function extractComponentBody(code: string): string {
  // Strip all import statements (handles multi-line imports with newlines in braces)
  let cleaned = code;

  // Scrub invisible / non-standard Unicode characters that LLMs occasionally inject.
  // These are invisible to humans but trip up Babel's lexer before it even starts
  // parsing, producing misleading "Missing semicolon" errors at backtick positions.
  //   \u200B  zero-width space — LLMs use this as a word separator in string literals,
  //           e.g. `import\u200Bpandas\u200Bas\u200Bpd` which renders as `importpandasaspd`.
  //           Replace with a real space so word boundaries are preserved.
  cleaned = cleaned.replace(/\u200B/g, " ");
  //   \u200C-\u200D  non-joiner / joiner
  //   \uFEFF         BOM (byte-order mark)
  //   \u2028-\u2029  Unicode line/paragraph separators
  cleaned = cleaned.replace(/[\u200C\u200D\uFEFF\u2028\u2029]/g, "");
  // Non-breaking space → ordinary space (preserves alignment, fixes token boundaries)
  cleaned = cleaned.replace(/\u00A0/g, " ");

  // Remove type imports: import type { ... } from "...";
  cleaned = cleaned.replace(
    /import\s+type\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
    "",
  );
  // Remove combined default + named imports: import X, { ... } from "...";
  cleaned = cleaned.replace(
    /import\s+\w+\s*,\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
    "",
  );
  // Remove multi-line named imports: import { ... } from "...";
  cleaned = cleaned.replace(
    /import\s*\{[\s\S]*?\}\s*from\s*["'][^"']+["'];?/g,
    "",
  );
  // Remove namespace imports: import * as X from "...";
  cleaned = cleaned.replace(
    /import\s+\*\s+as\s+\w+\s+from\s*["'][^"']+["'];?/g,
    "",
  );
  // Remove default imports: import X from "...";
  cleaned = cleaned.replace(/import\s+\w+\s+from\s*["'][^"']+["'];?/g, "");
  // Remove side-effect imports: import "...";
  cleaned = cleaned.replace(/import\s*["'][^"']+["'];?/g, "");

  cleaned = cleaned.trim();

  // Strip all "export default Name;" lines anywhere in the code (LLMs sometimes add this,
  // and when multiple scenes are concatenated it lands mid-file causing Babel errors)
  cleaned = cleaned.replace(/^export\s+default\s+\w+\s*;?\s*$/gm, "").trimEnd();

  // Strip registerRoot(...) calls — these are Remotion CLI entry-point calls that the
  // LLM sometimes adds at the end of generated code. They must not run in the browser sandbox.
  cleaned = cleaned.replace(/^registerRoot\s*\([^)]*\)\s*;?\s*$/gm, "").trimEnd();

  // Neutralise JSX elements whose tag name starts with a non-ASCII character
  // (e.g. <展现 />, <展现>…</展现>). Babel compiles these to React.createElement(展现, …)
  // which throws a ReferenceError at runtime because no such binding exists in the sandbox.
  // Neutralise JSX self-closing and paired tags whose name starts with a non-ASCII character.
  // Using new RegExp() so TypeScript (target:es5) doesn't reject the 'u' flag on regex literals.
  // Self-closing: <非ASCII … /> → {null}
  cleaned = cleaned.replace(new RegExp("<(\\P{ASCII}[^\\s>/]*)((?:\\s[^>]*)?)\\s*\\/>", "gu"), "{null}");
  // Opening tag: <非ASCII …> → <>
  cleaned = cleaned.replace(new RegExp("<(\\P{ASCII}[^\\s>/]*)((?:\\s[^>]*)?)>", "gu"), "<>");
  // Closing tag: </非ASCII> → </>
  cleaned = cleaned.replace(new RegExp("<\\/(\\P{ASCII}[^\\s>/]*)>", "gu"), "</>");

  // Sanitise non-ASCII *identifiers* (variable / function / const names that contain
  // non-ASCII characters, e.g. `const 获得应用 = …`). The LLM sometimes names helpers
  // after the translated description. These compile fine via Babel but throw a
  // ReferenceError at runtime because the sandbox has no binding for them.
  // Strategy: build a rename map from non-ASCII declaration identifiers and replace
  // occurrences only outside quoted/template literals so visible text isn't mutated.
  {
    const nonAsciiIdPattern = new RegExp(
      "\\b(?:const|let|var|function)\\s+([\\p{L}_$][\\p{L}\\p{N}_$]*)",
      "gu",
    );
    const identifierChar = new RegExp("[\\p{L}\\p{N}_$]", "u");
    const renameMap = new Map<string, string>();

    const replaceOutsideQuotedLiterals = (
      source: string,
      from: string,
      to: string,
    ): string => {
      let out = "";
      let i = 0;
      let inSingle = false;
      let inDouble = false;
      let inTemplate = false;
      while (i < source.length) {
        const ch = source[i];
        const prev = i > 0 ? source[i - 1] : "";

        if (!inSingle && !inDouble && !inTemplate) {
          if (ch === "'") {
            inSingle = true;
            out += ch;
            i++;
            continue;
          }
          if (ch === '"') {
            inDouble = true;
            out += ch;
            i++;
            continue;
          }
          if (ch === "`") {
            inTemplate = true;
            out += ch;
            i++;
            continue;
          }

          if (source.startsWith(from, i)) {
            const before = i > 0 ? source[i - 1] : "";
            const after = i + from.length < source.length ? source[i + from.length] : "";
            const boundaryBefore = !before || !identifierChar.test(before);
            const boundaryAfter = !after || !identifierChar.test(after);
            if (boundaryBefore && boundaryAfter) {
              out += to;
              i += from.length;
              continue;
            }
          }

          out += ch;
          i++;
          continue;
        }

        out += ch;
        i++;

        if (inSingle && ch === "'" && prev !== "\\") {
          inSingle = false;
        } else if (inDouble && ch === '"' && prev !== "\\") {
          inDouble = false;
        } else if (inTemplate && ch === "`" && prev !== "\\") {
          inTemplate = false;
        }
      }

      return out;
    };

    let idxCounter = 0;
    let m: RegExpExecArray | null;
    nonAsciiIdPattern.lastIndex = 0;
    while ((m = nonAsciiIdPattern.exec(cleaned)) !== null) {
      const token = m[1];
      if (!token || !/[^\x00-\x7F]/.test(token)) {
        continue;
      }
      if (!renameMap.has(token)) {
        renameMap.set(token, `_nonAscii_${idxCounter++}`);
      }
    }
    if (renameMap.size > 0) {
      // Sort longest-first so shorter tokens don't partially match longer ones
      const sorted = Array.from(renameMap.keys()).sort((a, b) => b.length - a.length);
      for (const token of sorted) {
        cleaned = replaceOutsideQuotedLiterals(cleaned, token, renameMap.get(token)!);
      }

      // Pre-declare any _nonAscii_N that was renamed from a *reference* but has no
      // corresponding declaration (const/let/var/function). Without this, the code
      // compiles fine but throws "_nonAscii_N is not defined" at runtime because the
      // original identifier was used without ever being declared by the LLM.
      const undeclared: string[] = [];
      for (const renamed of Array.from(renameMap.values())) {
        const hasDeclared = new RegExp("\\b(const|let|var|function)\\s+" + renamed + "\\b").test(cleaned);
        if (!hasDeclared) {
          undeclared.push(renamed);
        }
      }
      if (undeclared.length > 0) {
        // Prepend var declarations so they're in scope everywhere in the function body.
        // Using 'var' (not const/let) to avoid redeclaration errors if the same name
        // somehow appears as a later declaration.
        cleaned = "var " + undeclared.join(" = null, ") + " = null;\n" + cleaned;
      }
    }
  }

  // Replace hardcoded pk.* Mapbox token literals with the env-sourced token so that
  // generated code flow (const MAPBOX_TOKEN = ...; mapboxgl.accessToken = MAPBOX_TOKEN)
  // is preserved but the actual token always comes from the host app's .env.
  const ENV_TOKEN_EXPR = '(process.env.REMOTION_MAPBOX_TOKEN||process.env.NEXT_PUBLIC_MAPBOX_TOKEN||"")';
  // 1. const/let/var MAPBOX_TOKEN = 'pk.xxx'  →  ... = (process.env…)
  cleaned = cleaned.replace(
    /\b((?:const|let|var)\s+\w*[Tt][Oo][Kk][Ee][Nn]\w*\s*=\s*)(['"])pk\.[^'"]*\2/g,
    `$1${ENV_TOKEN_EXPR}`,
  );
  // 2. mapboxgl.accessToken = 'pk.xxx'  →  ... = (process.env…)
  cleaned = cleaned.replace(
    /((?:window\.)?(?:mapboxgl|mapboxGl)\.accessToken\s*=\s*)(['"])pk\.[^'"]*\2/g,
    `$1${ENV_TOKEN_EXPR}`,
  );

  // Extract body from "export const Name[: Type] = () => { ... }"
  // [^=]* handles optional TypeScript type annotations like ": React.FC" before the "="
  const match = cleaned.match(
    /^([\s\S]*?)export\s+const\s+\w+[^=]*=\s*\(\s*\)\s*=>\s*\{([\s\S]*)\};?\s*$/,
  );

  if (match) {
    let helpers = match[1].trim();
    const body = match[2].trim();
    // Strip any remaining `export` keywords from helpers — these are placed inside
    // DynamicAnimation's function body where `export` declarations are a syntax error.
    if (helpers) {
      helpers = helpers.replace(/^export\s+(const|let|var|function|class|type|interface)\b/gm, "$1");
    }
    return helpers ? `${helpers}\n\n${body}` : body;
  }

  // Fallback: strip `export` keyword from any top-level declarations so the code
  // can safely be placed inside the DynamicAnimation wrapper function.
  cleaned = cleaned.replace(/^export\s+default\s+\w+\s*;?/gm, "");
  cleaned = cleaned.replace(
    /^export\s+(const|let|var|function|class|type|interface)\b/gm,
    "$1",
  );

  return cleaned;
}

const compilationCache = new Map<string, CompilationResult>();

// Standalone compile function for use outside React components
export function compileCode(code: string): CompilationResult {
  if (!code?.trim()) {
    return { Component: null, error: "No code provided" };
  }

  // Check cache first to preserve Component reference identity
  // This is CRITICAL for performance of external libraries like Mapbox
  // which re-initialize on every component remount.
  const cached = compilationCache.get(code);
  if (cached) {
    return cached;
  }

  const interpolateRangeError = findInvalidInterpolateOutputRange(code);
  if (interpolateRangeError) {
    const errorResult = { Component: null, error: interpolateRangeError };
    return errorResult;
  }

  try {
    const mapboxToken =
      process.env.REMOTION_MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
    
    if (mapboxgl) {
      mapboxgl.accessToken = mapboxToken;
    } else {
      console.warn("[compiler] mapboxgl is undefined after import normalization.");
    }

    const componentBody = extractComponentBody(code);
    const wrappedSource = `const DynamicAnimation = () => {\n${componentBody}\n};`;

    const transpiled = Babel.transform(wrappedSource, {
      presets: [
        "react",
        ["typescript", { isTSX: true, allExtensions: true }],
      ],
      // "script" matches how new Function(...) executes — no implicit strict mode,
      // no module-level import/export constraints. Default "module" adds semantics
      // that are incompatible with sandbox execution and can confuse the parser when
      // it encounters template literals inside JSX attributes.
      sourceType: "script",
      // Explicitly activate JSX + TypeScript in Babel's underlying parser so that
      // template literals inside JSX attributes (e.g. style={{ background: `${x}deg` }})
      // are always parsed correctly, even inside nested functions / IIFEs.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parserOpts: { plugins: ["jsx", "typescript"] } as any,
      filename: "dynamic-animation.tsx",
    });

    if (!transpiled.code) {
      return { Component: null, error: "Transpilation failed" };
    }

    const safeInterpolate = (
      value: number,
      inputRange: number[],
      outputRange: number[],
      options?: Parameters<typeof interpolate>[3],
    ) => {
      if (!Array.isArray(inputRange) || !Array.isArray(outputRange) || inputRange.length !== outputRange.length) {
        return interpolate(value, inputRange, outputRange, options);
      }
      if (inputRange.length < 2) {
        return interpolate(value, inputRange, outputRange, options);
      }

      let isStrictlyIncreasing = true;
      for (let i = 1; i < inputRange.length; i++) {
        if (!(inputRange[i]! > inputRange[i - 1]!)) {
          isStrictlyIncreasing = false;
          break;
        }
      }
      if (isStrictlyIncreasing) {
        return interpolate(value, inputRange, outputRange, options);
      }

      const pairs = inputRange.map((x, idx) => ({ x, y: outputRange[idx]! }));
      pairs.sort((a, b) => a.x - b.x);

      // Ensure strict monotonicity even if duplicate values are generated.
      for (let i = 1; i < pairs.length; i++) {
        if (pairs[i]!.x <= pairs[i - 1]!.x) {
          pairs[i]!.x = pairs[i - 1]!.x + 1e-6;
        }
      }

      return interpolate(
        value,
        pairs.map((p) => p.x),
        pairs.map((p) => p.y),
        options,
      );
    };

    const Remotion = {
      AbsoluteFill,
      Audio,
      Video,
      interpolate: safeInterpolate,
      useCurrentFrame,
      useVideoConfig,
      spring,
      Sequence,
      Img,
      delayRender,
      continueRender,
    };

    // Common easing functions available as `Easing` in generated code.
    // Mirrors the API shape LLMs expect (React Native / Remotion community convention).
    const Easing = {
      linear:    (t: number) => t,
      quad:      (t: number) => t * t,
      cubic:     (t: number) => t * t * t,
      poly:      (n: number) => (t: number) => Math.pow(t, n),
      sin:       (t: number) => 1 - Math.cos((t * Math.PI) / 2),
      circle:    (t: number) => 1 - Math.sqrt(1 - t * t),
      exp:       (t: number) => Math.pow(2, 10 * t - 10),
      elastic:   (bounciness = 1) => {
        const p = bounciness * Math.PI;
        return (t: number) => 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p);
      },
      back:      (s = 1.70158) => (t: number) => t * t * ((s + 1) * t - s),
      bounce:    (t: number) => {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
        if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
        t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
      },
      // Cubic bezier: Easing.bezier(x1, y1, x2, y2)(t) — matches CSS cubic-bezier
      bezier: (x1: number, y1: number, x2: number, y2: number) => {
        // Newton-Raphson solver for cubic bezier easing
        const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
        const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
        const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
        const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
        const sampleDX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
        const getTForX = (x: number) => {
          let t = x;
          for (let i = 0; i < 8; i++) {
            const dx = sampleX(t) - x;
            if (Math.abs(dx) < 1e-7) return t;
            const d = sampleDX(t);
            if (Math.abs(d) < 1e-6) break;
            t -= dx / d;
          }
          return t;
        };
        return (t: number) => sampleY(getTForX(t));
      },
      // Higher-order helpers: Easing.out(Easing.cubic)(t)
      in:    (easing: (t: number) => number) => easing,
      out:   (easing: (t: number) => number) => (t: number) => 1 - easing(1 - t),
      inOut: (easing: (t: number) => number) => (t: number) =>
        t < 0.5 ? easing(t * 2) / 2 : 1 - easing((1 - t) * 2) / 2,
    };

    const wrappedCode = `${transpiled.code}\nreturn DynamicAnimation;`;

    const ReactWithRemotion = {
      ...React,
      useCurrentFrame,
      useVideoConfig,
      interpolate: safeInterpolate,
      spring,
      AbsoluteFill,
      Audio,
      Video,
      Sequence,
      Img,
      // Pass common hooks flatly too
      useState,
      useEffect,
      useMemo,
      useRef,
    };


    const createComponent = new Function(
      "React",
      "Remotion",
      "RemotionShapes",
      "Lottie",
      "ThreeCanvas",
      "THREE",
      "AbsoluteFill",
      "Audio",
      "Video",
      "interpolate",
      "useCurrentFrame",
      "useVideoConfig",
      "spring",
      "Sequence",
      "Img",
      "delayRender",
      "continueRender",
      "delayRender", // Hallucination alias
      "useState",
      "useEffect",
      "useMemo",
      "useRef",
      "Rect",
      "Circle",
      "Triangle",
      "Star",
      "Polygon",
      "Ellipse",
      "Heart",
      "Pie",
      "makeRect",
      "makeCircle",
      "makeTriangle",
      "makeStar",
      "makePolygon",
      "makeEllipse",
      "makeHeart",
      "makePie",
      // Transitions
      "TransitionSeries",
      "linearTiming",
      "springTiming",
      "fade",
      "slide",
      "wipe",
      "flip",
      "clockWipe",
      // Easing utility (mirrors React Native / community convention)
      "Easing",
      // Common LLM helper used in generated text-highlighting snippets.
      "isKeyword",
      // Safety no-op: LLMs sometimes emit registerRoot(SceneComp) at the end of generated
      // code. Providing it as a no-op prevents ReferenceError in the browser sandbox.
      "registerRoot",
      // Optional injected Mapbox instance for map scenes.
      "mapboxgl",
      "mapboxGl",
      wrappedCode,
    );

    const Component = createComponent(
      ReactWithRemotion,
      Remotion,
      RemotionShapes,
      Lottie,
      ThreeCanvas,
      THREE,
      AbsoluteFill,
      Audio,
      Video,
      safeInterpolate,
      useCurrentFrame,
      useVideoConfig,
      spring,
      Sequence,
      Img,
      delayRender,
      continueRender,
      delayRender, // useDelayRender alias
      useState,
      useEffect,
      useMemo,
      useRef,
      RemotionShapes.Rect,
      RemotionShapes.Circle,
      RemotionShapes.Triangle,
      RemotionShapes.Star,
      RemotionShapes.Polygon,
      RemotionShapes.Ellipse,
      RemotionShapes.Heart,
      RemotionShapes.Pie,
      RemotionShapes.makeRect,
      RemotionShapes.makeCircle,
      RemotionShapes.makeTriangle,
      RemotionShapes.makeStar,
      RemotionShapes.makePolygon,
      RemotionShapes.makeEllipse,
      RemotionShapes.makeHeart,
      RemotionShapes.makePie,
      // Transitions
      TransitionSeries,
      linearTiming,
      springTiming,
      fade,
      slide,
      wipe,
      flip,
      clockWipe,
      // Easing utility
      Easing,
      // Fallback helper for generated snippets that call isKeyword(word, keywords).
      (word: unknown, keywords: unknown) => {
        if (typeof word !== "string" || !Array.isArray(keywords)) return false;
        return keywords.some((entry) => typeof entry === "string" && entry.toLowerCase() === word.toLowerCase());
      },
      // no-op safety net
      () => {},
      // Optional mapbox instance
      mapboxgl,
      mapboxgl, // Alias mapboxGl to mapboxgl
    );

    if (typeof Component !== "function") {
      return {
        Component: null,
        error: "Code must be a function that returns a React component",
      };
    }

    const result = { Component, error: null };
    compilationCache.set(code, result);
    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown compilation error";
    const errorResult = { Component: null, error: errorMessage };
    return errorResult;
  }
}
