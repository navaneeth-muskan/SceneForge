# Gemini Live Agent Challenge Checklist

Project: SceneForge - Agentic Multimodal Motion Graphics Studio

## 1) Pick Your Track (Do This First)

- [ ] Choose one official category for your final submission:
  - Live Agents
  - Creative Storyteller
  - UI Navigator
- [ ] Update your pitch/title so it clearly matches the chosen category.

Current best fit: Creative Storyteller (or Live Agents if you show real-time interruptible voice flow).

## 2) Mandatory Technical Requirements

- [x] Uses a Gemini model.
  - Evidence: src/lib/gemini/adk-tools.ts, src/app/api/agent/story/route.ts, src/app/api/agent/understand/route.ts
- [x] Built using Google GenAI SDK or ADK.
  - Evidence: src/lib/gemini/adk-tools.ts, src/lib/gemini/tools.ts
- [x] Uses at least one Google Cloud service.
  - Evidence: src/lib/gcs.ts, infra/terraform/main.tf
- [x] Hosted on Google Cloud.
  - Evidence: Cloud Run deployed, Terraform outputs include cloud_run_url.
  - Live URL: https://videoai-backend-pjymq552ea-uc.a.run.app

Track-specific mandatory check:

- [ ] If submitting as Live Agents: show natural real-time audio interaction with interruptions.
- [x] If submitting as Creative Storyteller: show Gemini interleaved/mixed output in one cohesive flow.
  - Evidence: Story pipeline + image generation + TTS narration are produced in one agentic flow and presented as a cohesive mixed-media output.
- [ ] If submitting as UI Navigator: show screenshot/screen-recording understanding and executable action output.

## 3) Required Submission Artifacts

### A) Text Description
- [x] Project summary with features, tech, data sources, learnings exists.
  - Evidence: HACKATHON_SUBMISSION.md

### B) Public Code Repository URL
- [x] Public repo URL included.
  - Evidence: HACKATHON_SUBMISSION.md

### C) Spin-up Instructions in README
- [x] Reproducible setup steps included.
  - Evidence: README.md section "Hackathon Spin-Up Instructions (Judge Friendly)"

### D) Proof of Google Cloud Deployment
- [x] Code-level proof included.
  - Evidence: HACKATHON_SUBMISSION.md section "Proof of Google Cloud Deployment"
- [x] Public deployed backend URL documented.
  - URL: https://videoai-backend-pjymq552ea-uc.a.run.app
- [ ] Add short proof recording (recommended): Cloud Run service + logs + successful request.

### E) Architecture Diagram
- [x] Diagram exists in markdown.
  - Evidence: HACKATHON_SUBMISSION.md (Mermaid diagram)
- [ ] Export it as an image (PNG/SVG) and include in submission carousel for easier judging.

### F) Demo Video (<4 minutes)
- [ ] Record and upload final demo video showing real-time multimodal/agentic features (no mockups).
- [ ] Ensure it clearly explains problem, solution value, and live capability.

## 4) Bonus Points

- [x] Automated cloud deployment present (Terraform + scripts).
  - Evidence: infra/terraform/, DEPLOY.md, REDEPLOY_COMMANDS.ps1
- [ ] Publish blog/podcast/video mentioning hackathon participation + hashtag #GeminiLiveAgentChallenge.
- [x] Join GDG and include public GDG profile link.
  - Profile: https://gdg.community.dev/u/mgh8z6/#/about

## 5) Final Pre-Submit Quality Gate

- [ ] One-line category statement added at top of HACKATHON_SUBMISSION.md.
- [ ] All links open correctly (repo, deployment proof, any media links).
- [ ] Demo video is under 4:00 and includes live, non-mock interaction.
- [ ] Secrets rotated if exposed in local files.
- [ ] Architecture image attached with submission.

## 6) Fastest Path to Finish (Suggested)

1. Pick final category now (Creative Storyteller recommended based on current feature set).
2. Record 30-60s Google Cloud proof clip.
3. Record <4 min demo clip.
4. Export architecture diagram image and attach.
5. Add final links into HACKATHON_SUBMISSION.md.
