# Project Summary

## Project Name

SceneForge - Agentic Multimodal Motion Graphics Studio

## Problem Solved

Many people, especially kids and visual learners, understand ideas better when they are shown through color, movement, sequencing, and visual storytelling instead of plain text or static explanation. Existing tools often focus either on generic video generation or on manual design workflows that take too much effort. SceneForge is designed for a different goal: helping people explain and understand ideas in a beautiful, colorful, motion-graphics-driven way through animated visualizations and story-based scenes.

## Core Features and Functionality

1. Prompt-to-animation code generation
- Users describe a desired animation in natural language.
- The app classifies prompt intent, detects relevant skills, generates Remotion TSX code, sanitizes output, and renders live preview.

2. Agentic story pipeline
- Gemini ADK planner decomposes a brief into scene specs.
- Scene builder generates each scene in parallel.
- Timeline-ready output includes scene durations and start frames.

3. Multimodal understanding
- Understand endpoint supports image, video, audio, PDF, and YouTube URL analysis.
- Structured outputs are produced via schemas for downstream timeline usage.

4. Image generation and editing
- Gemini image models generate 16:9 or other-ratio visual assets.
- Edit mode supports reference-image workflows for consistency.

5. Narration and voiceover
- TTS generation uses Gemini speech models.
- Story scenes can include narration text and voice assignment.

6. Region-aware annotation helpers
- Optional region analysis for image and video scenes.
- Enables timeline overlay behavior and guided visual explanations.

7. Cloud media pipeline
- Media upload, list, and delete are backed by Google Cloud Storage.
- Signed URLs and gs:// URIs support secure access and processing.

8. Live editor and preview workflow
- In-browser code editing and real-time preview.
- Video export and server-side rendering are not available in the current build.

## Technologies Used

- Frontend: Next.js 16, React 19, TypeScript, Tailwind
- Video engine: Remotion 4
- AI and agent stack: Gemini models, Google ADK, Vercel AI SDK
- Multimodal inference: Gemini Flash, Pro, Image, and TTS model family
- Cloud services: Google Cloud Storage, Google Auth, Vertex AI-compatible Gemini access
- Supporting libraries: Zod, Monaco Editor, Mapbox GL, Three.js, OpenTelemetry packages

## Data Sources Used

1. User-provided data
- Prompt text
- Uploaded assets: images, videos, PDFs, audio
- Optional reference images for image editing

2. Model outputs
- Structured scene plans
- Generated TSX animation code
- Generated images and narration audio
- Structured multimodal analysis objects

3. Cloud storage objects
- Uploaded files in Google Cloud Storage
- Signed read and write URLs for secure file operations

4. Optional grounded web context
- Agent web-search tool for fact-sensitive prompts
