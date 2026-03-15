#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT="digital-scanning"
REGION="us-central1"
SERVICE="videoai-backend"
IMAGE="us-central1-docker.pkg.dev/digital-scanning/videoai-images/videoai:latest"
TF_DIR="$ROOT/infra/terraform"

cd "$ROOT"

# Run once per machine or when auth expires.
gcloud config set project "$PROJECT"
gcloud auth application-default login
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and push container image.
gcloud builds submit --tag "$IMAGE" --timeout=1200

# Deploy a new Cloud Run revision.
gcloud run deploy "$SERVICE" --image "$IMAGE" --region "$REGION" --project "$PROJECT"

# Apply infrastructure updates if needed.
cd "$TF_DIR"
terraform init
terraform apply -auto-approve

echo "Full cloud deploy completed successfully."
