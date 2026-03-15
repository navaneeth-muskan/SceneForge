# Learnings and Next Steps

## Findings and Learnings

1. Building agentic AI with Gemini ADK
- Multi-agent design worked best when each agent had a focused role: planning, scene-building, image generation, narration, and web search.
- Agent decomposition made complex outputs more consistent and failures easier to isolate and recover.

2. Pipelining models into a communicative system
- Gemini Pro, Gemini Flash, image models, and TTS can be chained into one coherent flow where outputs from one model feed downstream systems.
- Structured Zod schemas were essential to make model output reliably consumable.

3. Multimodal input processing
- Diverse media types such as base64, signed URLs, gs:// URIs, and YouTube links were normalized into a unified multimodal payload for Gemini.
- Reference-image editing improved visual consistency across generated assets.

4. Bringing Gemini power to life with Remotion
- Natural-language prompts can be turned into runnable Remotion TSX and compiled live in the browser using Babel.
- The skills system improved code quality without inflating every request.

5. Live internet data via grounded search
- Google Search grounding gave agents access to current web information.
- The agent can decide when web search is required instead of relying on manual routing.

6. Agent autonomy
- Letting the agent decide which tools to invoke, what to edit, and in what order made the system genuinely agentic rather than a fixed script.

7. Terraform and automated Google Cloud deployment
- Terraform was used to provision Cloud Run, Artifact Registry, IAM service accounts, and GCS.
- Deployment automation reduced redeploy work to repeatable scripts and a clear release flow.

8. Google Cloud Storage as a shared asset layer
- GCS became the common backbone for uploads, references, retrieval, and signed access.
- This decoupled storage from compute and made large media handling practical.

## What Was Not Finished

- Video rendering to a downloadable file was planned but not completed during the hackathon window.

## What Is Next

- Integrate video generation models such as Veo or other Gemini-powered video systems.
- Add a vector-based component library powered by Gemini embeddings.
- Enable automatic social media publishing as a post-production agent step.
- Expand the interactive creative workflow and agent autonomy surface area.
