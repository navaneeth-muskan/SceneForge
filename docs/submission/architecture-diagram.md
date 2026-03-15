# Architecture Diagram

Interactive Mermaid link: [Mermaid diagram](https://mermaid.ai/d/23852a3d-1f82-4abb-a5ae-9994e40ba781)

```mermaid
flowchart LR
  U[User Browser - Next.js UI] --> FE[Client Components and Agent Panel]
  FE --> API[Next.js API Routes Node Runtime]

  API --> SP[Story Planner Agent - Gemini Pro]
  API --> SB[Scene Builder Agent - Gemini Flash]
  API --> MM[Multimodal Understand API]
  API --> IMG[Image Generation API]
  API --> TTS[TTS API]

  MM --> GM[Gemini Models]
  IMG --> GM
  TTS --> GM
  SP --> GM
  SB --> GM
  GM --> API

  API --> GCS[Google Cloud Storage]
  GCS --> API

  API --> RM[Remotion Compiler and Timeline Builder]
  RM --> FE

  FE --> RV[Live Preview]
```

## Diagram Notes

- The browser hosts the interactive editor and agent panel.
- Next.js API routes orchestrate the agent pipeline.
- Gemini-backed services cover planning, scene generation, multimodal understanding, image generation, and narration.
- Google Cloud Storage persists uploaded and generated media.
- Remotion compiles and previews the resulting timeline.
