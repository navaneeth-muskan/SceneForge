# Deployment Guide (Terraform + Cloud Run)

This guide deploys the Node.js app to Google Cloud Run using Terraform.

## 1. Prerequisites

- gcloud CLI installed and authenticated
- Terraform 1.5+
- Docker installed (if building locally)
- Access to target GCP project

## 2. Authenticate and select project

```powershell
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
```

## 3. Build and push the container image

Use Cloud Build (recommended):

```powershell
$PROJECT_ID="YOUR_GCP_PROJECT_ID"
$REGION="us-central1"
$REPO="videoai-images"
$IMAGE_URI="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/videoai:latest"

gcloud builds submit --tag $IMAGE_URI
```

Notes:
- The Terraform stack creates the Artifact Registry repository if it does not exist.
- If your first build fails because the repository does not exist yet, run Terraform apply once first, then rerun build.

## 4. Configure Terraform variables

From the repo root:

```powershell
Copy-Item infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
```

Edit infra/terraform/terraform.tfvars and set:
- project_id
- container_image (use the same IMAGE_URI from build step)
- bucket_name (optional override)
- service_account_file (keep: digital-scanning-service_account.json)
- google_genai_api_key (from .env)
- openai_api_key (from .env)
- gemini_api_key (from .env)
- render_server_url (from .env)
- remotion_mapbox_token (from .env)

Important:
- `project_id` must be the project ID string, not the numeric project number.
- Use the same values you already have in your `.env`:
  - `OPENAI_API_KEY=...`
  - `GEMINI_API_KEY=...`
  - `GOOGLE_GENAI_API_KEY=...`
  - `RENDER_SERVER_URL=...`
  - `REMOTION_MAPBOX_TOKEN=...`
  - `SERVICE_ACCOUNT_FILE=digital-scanning-service_account.json`
  - `GCP_PROJECT_ID=...` (must be project ID string)
  - `BUCKET_NAME=gemini-video-analyser`

## 5. Deploy infrastructure and service

```powershell
cd infra/terraform
terraform init
terraform plan
terraform apply
```

When apply finishes, copy the output value cloud_run_url.

## 6. Verify deployment

1. Open cloud_run_url in browser.
2. Test a backend endpoint, for example:

```powershell
Invoke-WebRequest -Method Get "$((terraform output -raw cloud_run_url))/api/agent/image"
```

3. Upload a file in the app and confirm GCS usage:
- API response includes gs://... URI
- Object appears in your bucket in Cloud Storage console

## 7. Update deployments

For each update:

```powershell
gcloud builds submit --tag $IMAGE_URI
cd infra/terraform
terraform apply
```

If image tag is unchanged (latest), force a new revision by changing an env var value or using a unique image tag per release.

## 8. Simple fallback commands (if you skip tfvars secrets)

If you leave `google_genai_api_key` empty in tfvars, set it directly on Cloud Run after deploy:

```powershell
gcloud run services update videoai-backend \
  --region us-central1 \
  --set-env-vars GOOGLE_GENAI_API_KEY=YOUR_KEY
```

If needed, set service account JSON directly instead of shipping file:

```powershell
gcloud run services update videoai-backend \
  --region us-central1 \
  --set-env-vars SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

## 9. Destroy resources

```powershell
cd infra/terraform
terraform destroy
```
