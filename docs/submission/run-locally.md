# Run Locally

## Prerequisites

- Node.js 20+
- npm 10+
- A Gemini API key
- Optional: Google Cloud project, storage bucket, and service account for cloud media workflows

## Install

```bash
npm i
```

## Configure Environment

Create `.env.local` in the project root.

```bash
GOOGLE_GENAI_API_KEY=your_gemini_api_key

# Optional: OpenAI model choice in /api/generate
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

## Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quick Verification

- Prompt-to-video generation: Use the landing prompt and generate a Remotion scene.
- Agentic story build: Open the Agent panel and run a story plan/build.
- Multimodal analysis: Upload an image, video, or PDF and run Understand.
- GCS integration if configured: Upload media and confirm the returned gs:// URI.
