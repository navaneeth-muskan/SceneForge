# Final Story

## SceneForge

SceneForge began from a simple observation: many people do not understand ideas best through plain text or static slides. They understand through color, movement, sequencing, diagrams, narration, and visual storytelling. That is especially true for kids, visual learners, educators, and anyone trying to explain something complex in a more intuitive way.

Most existing tools pushed in one of two directions. Either they focused on generic video generation, or they required manual motion-design and editing workflows. We wanted something different. We wanted a system that could help people explain ideas beautifully in a motion-graphics style.

That became the core direction for SceneForge: not just generating video, but generating visual explanation.

## What Inspired Us

The inspiration came from how often people use visualizations to make something understandable. A concept that feels dense in text can become clear once it is animated, sequenced, and narrated with intention. We were interested in colorful, creative, motion-graphics-driven explanation rather than footage-like video generation.

So instead of asking, "How do we generate a video?", we asked, "How do we help someone explain something in a visually beautiful way using motion graphics?"

That shift changed the product completely. It pushed us toward story structure, scene planning, diagrams, typography, timelines, and visual pacing.

## What We Built

We built an agentic multimodal motion-graphics studio powered by Gemini, Remotion, and Google Cloud.

At a high level, SceneForge lets a user:

- describe an animation or story in natural language
- upload supporting media such as images, PDFs, video, or audio
- include YouTube links or website URLs directly in prompts so the system can extract data/context and visualize it
- generate Remotion scenes and timeline-ready motion graphics
- use agentic planning to break a larger brief into multiple scenes
- preview results live in the browser
- attach narration and synchronize it with scenes
- persist media in Google Cloud Storage for scalable workflows

The system is closer to a visual storytelling engine than a generic video generator.

## How We Built It

We used Next.js as the app surface, Remotion as the motion-graphics engine, Gemini models for planning and multimodal generation, Google ADK for agent orchestration, and Google Cloud Storage for media persistence.

The workflow is layered.

1. A prompt is validated and classified.
2. Relevant skills are selected to guide generation.
3. Agents decide how to plan scenes and which model capabilities to use.
4. Gemini generates structured scene output and Remotion TSX code.
5. The response is sanitized and compiled for live preview.
6. Media assets are stored and retrieved through cloud-backed workflows.
7. Narration can be generated and attached scene by scene.

For story generation, the project uses scene planning instead of treating the whole output as one undifferentiated video. That was an important design choice because it made the system feel more explainable, editable, and visually intentional.

Even the timing model followed that principle. Scene timing was derived from narration duration so that visual pacing followed the explanation instead of forcing audio into fixed windows. In simplified form, the start frame of scene $i$ is:

$$
start_i = \sum_{k=0}^{i-1} duration_k
$$

That small idea reflects the larger product philosophy: the motion should serve the explanation.

## What We Learned

We learned that agentic systems become much more reliable when each agent has a narrow, well-defined role. Splitting planning, scene generation, multimodal understanding, narration, and support tools into focused responsibilities made the pipeline easier to reason about and easier to recover when something failed.

We also learned how important structure is when multiple models have to cooperate. Zod schemas and structured outputs made it possible to feed one model's result into the next stage without turning the pipeline into guesswork.

On the motion side, we learned that generating visuals is not enough. The experience becomes much stronger when timing, layout, captions, pacing, and narration are treated as one coordinated system.

We also learned practical cloud lessons: deployment needs a reliable revision trigger, build systems need stable production settings, and media storage must be decoupled from app runtime if the system is going to scale beyond toy examples.

## Challenges We Faced

One challenge was deciding what this product actually was. It would have been easy to drift into the vague category of "AI video generation." But that description was too broad and missed the real point. We had to keep refining the problem statement until it matched the product: visual explanation through motion graphics.

Another challenge was coordinating multiple moving parts at once:

- prompt interpretation
- scene planning
- code generation
- multimodal inputs
- narration generation
- timeline synchronization
- cloud storage
- deployment

Each one worked on its own, but making them feel like one coherent creative system took repeated iteration.

We also faced technical challenges around synchronization and playback. Narration timing, scene duration, caption visibility, and player behavior all had to align. Fixing those details mattered because the product is not just about generating assets, it is about presenting them clearly.

Deployment also surfaced real-world issues. Production builds had to be stabilized, and the release flow needed to separate app deploys from infrastructure changes so iteration stayed practical.

## Why We Care About This Direction

We think there is a meaningful opportunity in tools that help people explain and understand visually. Not every problem needs a cinematic AI-generated clip. Sometimes the better answer is a carefully paced motion-graphics sequence that makes a concept finally click.

That is the direction SceneForge is built around.

## Closing

SceneForge is our attempt to build a system for visual understanding: colorful, animated, agent-driven, and editable. It is designed for storytelling, explanation, learning, and communication through motion graphics.

The project is still early, but the core idea is already clear to us: the goal is not just to generate video. The goal is to help people make ideas understandable through motion.
