$root = "E:\React Projects\VideoAI"
$project = "digital-scanning"
$region = "us-central1"
$service = "videoai-backend"
$image = "us-central1-docker.pkg.dev/digital-scanning/videoai-images/videoai:latest"
$tfDir = Join-Path $root "infra\terraform"

cd $root

# Run once per machine or when auth expires.
gcloud config set project $project
gcloud auth application-default login
gcloud auth configure-docker us-central1-docker.pkg.dev
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

# Build and push container image.
gcloud builds submit --tag $image --timeout=1200
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

# Deploy a new Cloud Run revision.
gcloud run deploy $service --image $image --region $region --project $project
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

# Apply infrastructure updates if needed.
cd $tfDir
terraform init
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

terraform apply -auto-approve
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Full cloud deploy completed successfully."
