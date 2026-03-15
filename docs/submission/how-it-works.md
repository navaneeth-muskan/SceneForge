# How It Works

## High-Level Flow

```text
User Prompt -> Validation -> Skill Detection -> Code Generation -> Sanitization -> Live Preview
```

SceneForge turns natural-language prompts and multimodal inputs into playable Remotion scenes through a staged pipeline.

## 1. Validation

Before expensive model calls, a lightweight classifier determines whether the prompt is valid motion-graphics content.

### Accepted

- Animated text
- Data visualizations
- UI animations
- Social media content
- Abstract motion graphics

### Rejected

- Questions
- Conversational requests
- Non-visual tasks

## 2. Skill Detection

The system analyzes the prompt to identify which skills are relevant.

Skills are modular knowledge units that provide domain-specific guidance to the generation model. This keeps the base prompt lightweight while dynamically injecting only the expertise needed for the current request.

### Skill Types

- Guidance skills: pattern libraries and best practices for specific domains such as charts, typography, transitions, and sequencing
- Example skills: complete working references that demonstrate specific animation patterns

## 3. Code Generation

The app uses a one-shot prompt with base Remotion knowledge plus any detected skills.

The generated code follows a few core principles:

- Constants-first design: text, colors, and timing are declared at the top for easy editing
- Aesthetic defaults: spacing, polish, and motion feel are guided intentionally
- Crossfade patterns: transitions avoid layout jumps
- Spring physics: Remotion spring-based motion gives more natural animation

## 4. Sanitization and Compilation

The model response is cleaned before use:

- Markdown wrappers are removed
- Trailing commentary is stripped
- Output is normalized into runnable TSX

The final code is compiled in the browser using Babel and rendered directly inside the Remotion preview.

## 5. Agentic Story Pipeline

For story-based generation, SceneForge expands beyond a single animation component.

- Gemini ADK planner decomposes a brief into scene specifications
- Scene builder generates scenes in parallel
- Timeline-ready output includes scene order, duration, and start frame data
- Narration and audio can be attached per scene

## 6. Multimodal Processing

The system can accept more than text.

Supported analysis and processing flows include:

- Images
- Video
- Audio
- PDFs
- YouTube URLs
- Website URLs
- Reference images for image editing

These inputs are normalized into structures the downstream Gemini and timeline systems can consume.
For URL-based prompts (YouTube and websites), the system fetches relevant content/context and converts it into visualization-ready structures such as highlights, key points, sequences, and table-like breakdowns.

## 7. Cloud Media Flow

Media is persisted through Google Cloud Storage.

- Uploaded files are stored in GCS
- Signed URLs are generated for secure access
- gs:// URIs are passed through workflows when needed
- Uploaded and generated assets are decoupled from runtime compute

## 8. Live Preview Loop

Generated code and story output are immediately surfaced in the editor.

- Users can inspect generated results
- Remotion preview updates in-browser
- The workflow supports iteration without leaving the editing environment

## Skills System Reference

The skills system lives in `src/skills/`.

Examples of guidance domains include:

- Charts
- Typography
- Messaging
- Transitions
- Sequencing
- Spring physics
- Social media
- 3D scenes

These skills improve output quality without forcing every generation request to carry the full knowledge base.

## Practical Summary

SceneForge is not a single prompt-to-video call. It is a layered system that:

1. Validates intent
2. Selects context and skills
3. Generates Remotion code or scene plans
4. Sanitizes output
5. Compiles and previews results live
6. Uses multimodal and cloud-backed workflows when required
