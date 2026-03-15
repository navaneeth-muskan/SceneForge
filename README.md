# SceneForge - Agentic Multimodal Motion Graphics Studio

AI-powered motion graphics and visual-explanation tool that transforms natural language prompts into colorful Remotion scenes for storytelling, explanation, and understanding.

## Quick Links

- Submission index: [HACKATHON_SUBMISSION.md](HACKATHON_SUBMISSION.md)
- Submission docs set: [docs/submission/README.md](docs/submission/README.md)
- How it works: [docs/submission/how-it-works.md](docs/submission/how-it-works.md)
- Project summary: [docs/submission/project-summary.md](docs/submission/project-summary.md)
- Local run instructions: [docs/submission/run-locally.md](docs/submission/run-locally.md)
- Deployment instructions: [docs/submission/deployment.md](docs/submission/deployment.md)
- Terraform notes: [docs/submission/terraform.md](docs/submission/terraform.md)
- Project structure: [docs/submission/project-structure.md](docs/submission/project-structure.md)

## Cross-Platform Deploy Scripts

- PowerShell app deploy: [deploy-app.ps1](deploy-app.ps1)
- PowerShell infra deploy: [deploy-infra.ps1](deploy-infra.ps1)
- Bash app deploy: [deploy-app.sh](deploy-app.sh)
- Bash infra deploy: [deploy-infra.sh](deploy-infra.sh)
- PowerShell launcher: [REDEPLOY_COMMANDS.ps1](REDEPLOY_COMMANDS.ps1)
- Bash launcher: [REDEPLOY_COMMANDS.sh](REDEPLOY_COMMANDS.sh)

## What This Repo Contains

- A Next.js app for prompt-driven motion graphics and visual explanation
- Remotion-based live composition and preview
- Gemini-powered agent workflows for planning, generation, multimodal analysis, and narration
- Google Cloud Storage-backed media handling
- Terraform-based Google Cloud deployment support

## Best Starting Points

If you are reviewing the project for the first time:

1. Read [docs/submission/project-summary.md](docs/submission/project-summary.md)
2. Read [docs/submission/how-it-works.md](docs/submission/how-it-works.md)
3. Open [docs/submission/architecture-diagram.md](docs/submission/architecture-diagram.md)
4. Use [docs/submission/project-structure.md](docs/submission/project-structure.md) to navigate the codebase
5. Use [docs/submission/deployment.md](docs/submission/deployment.md) for deploy and cloud proof

## Architecture

```
User Prompt → Validation → Skill Detection → Code Generation → Sanitization → Live Preview
```

## How It Works

### 1. Validation

Before expensive model calls, a lightweight classifier determines if the prompt describes valid motion graphics content.

**Accepted**: animated text, data visualizations, UI animations, social media content, abstract motion graphics

**Rejected**: questions, conversational requests, non-visual tasks

### 2. Skill Detection

The system analyzes the prompt to identify which **skills** are relevant. Skills are modular knowledge units that provide domain-specific guidance to the code generation model.

There are two types of skills:

- **Guidance Skills** - Pattern libraries with best practices for specific domains (charts, typography, transitions, etc.)
- **Example Skills** - Complete working code references that demonstrate specific animation patterns

This approach keeps the base prompt lightweight while dynamically injecting only the relevant expertise for each request.

### 3. Code Generation

Uses a one-shot prompt with the base Remotion knowledge plus any detected skills. The generated code follows these principles:

- **Constants-first design** - All text, colors, and timing values are declared as editable constants at the top
- **Aesthetic defaults** - Guidance on visual polish, spacing, and animation feel
- **Crossfade patterns** - Smooth state transitions without layout jumps
- **Spring physics** - Natural, organic motion using Remotion's spring() function

### 4. Sanitization & Compilation

The response is cleaned (removing markdown wrappers and trailing commentary), then compiled in-browser using Babel. The compiled component renders directly in the Remotion Preview with all necessary APIs injected.

## Skills System

Skills enable contextual expertise without bloating every prompt. Located in `src/skills/`:

### Guidance Skills

| Skill              | Purpose                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| **charts**         | Data visualization patterns - bar charts, pie charts, axis labels, staggered animations |
| **typography**     | Kinetic text - typewriter effects, word carousels, text highlights                      |
| **messaging**      | Chat UI - bubble layouts, WhatsApp/iMessage styling, staggered entrances                |
| **transitions**    | Scene changes - TransitionSeries, fade/slide/wipe effects                               |
| **sequencing**     | Timing control - Sequence, Series, staggered delays                                     |
| **spring-physics** | Organic motion - spring configs, bounce effects, chained animations                     |
| **social-media**   | Platform-specific formats - aspect ratios, safe zones                                   |
| **3d**             | Three.js integration - 3D scenes, camera setup                                          |

### Example Skills (Code Snippets)

Example skills provide complete working references (histogram, chat messages, typewriter effects, etc.) that demonstrate these patterns in action. We think of them like implementation archetypes that can be used and adjusted for the user prompt.

## Usage Tips

**Prompting best practices:**

- Be specific about colors, timing, and layout ("green sent bubbles on the right, gray received on the left")
- Include data directly in the prompt for charts and visualizations
- Describe the animation feel you want ("bouncy spring entrance", "smooth fade", "staggered timing")

**Images:**

- Direct image uploads are not supported
- Reference images via URL - the generated code will use Remotion's `<Img>` component
- Example: _"Create a DVD screensaver animation of this image https://example.com/logo.png"_

**What works well:**

- Kinetic typography and text animations
- Data visualizations with animated entrances
- Chat/messaging UI mockups
- Social media content (Stories, Reels, TikTok)
- Logo animations and brand intros
- Abstract motion graphics

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Production Build**

```console
npm run build
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Project docs:

- [docs/submission/README.md](docs/submission/README.md)
- [docs/submission/how-it-works.md](docs/submission/how-it-works.md)
- [docs/submission/run-locally.md](docs/submission/run-locally.md)
- [docs/submission/deployment.md](docs/submission/deployment.md)
- [docs/submission/project-structure.md](docs/submission/project-structure.md)

Remotion fundamentals:

- [https://www.remotion.dev/docs/the-fundamentals](https://www.remotion.dev/docs/the-fundamentals)

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

## Hackathon Spin-Up Instructions (Judge Friendly)

For the split version of these instructions, see [docs/submission/run-locally.md](docs/submission/run-locally.md).

Use these steps to reproduce the project locally.

### 1) Prerequisites

- Node.js 20+
- npm 10+
- A Gemini API key
- (Optional for cloud media workflows) Google Cloud project + Storage bucket + service account

### 2) Install

```console
npm i
```

### 3) Configure environment

Create `.env.local` in the project root:

```bash
GOOGLE_GENAI_API_KEY=your_gemini_api_key

# Optional: Enables OpenAI model choice in /api/generate
OPENAI_API_KEY=your_openai_api_key

# Optional: Required for Google Cloud Storage upload/list/delete features
GCP_PROJECT_ID=your_gcp_project_id
BUCKET_NAME=your_gcs_bucket
SERVICE_ACCOUNT_FILE=./digital-scanning-service_account.json
# Or use SERVICE_ACCOUNT_JSON with the full JSON string instead of SERVICE_ACCOUNT_FILE

# Optional: Enables map-based scene rendering
REMOTION_MAPBOX_TOKEN=your_mapbox_token

# Optional: If using remote render server mode
NEXT_PUBLIC_DEFAULT_RENDER_BACKEND=renderServer
RENDER_SERVER_URL=https://your-render-server-url
```

### 4) Run

```console
npm run dev
```

Open http://localhost:3000

### 5) Quick verification

- Prompt-to-video generation: Use the landing prompt and generate a Remotion scene.
- Agentic story build: Open Agent panel and run a story plan/build.
- Multimodal analysis: Upload an image/video/PDF and run Understand.
- GCS integration (if configured): Upload media and confirm returned `gs://` URI.
