#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="digital-scanning"
REGION="us-central1"
SERVICE="videoai-backend"
IMAGE="us-central1-docker.pkg.dev/digital-scanning/videoai-images/videoai:latest"

cd "$ROOT"

# Run once per machine or when auth expires.
gcloud config set project "$PROJECT"
gcloud auth application-default login
gcloud auth configure-docker us-central1-docker.pkg.dev

# App redeploy flow: build/push image and trigger a new Cloud Run revision.
gcloud builds submit --tag "$IMAGE" --timeout=1200
gcloud run deploy "$SERVICE" --image "$IMAGE" --region "$REGION" --project "$PROJECT"

echo "App deploy completed successfully."