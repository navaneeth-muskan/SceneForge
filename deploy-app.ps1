$root = "E:\React Projects\VideoAI"
$project = "digital-scanning"
$region = "us-central1"
$service = "videoai-backend"
$image = "us-central1-docker.pkg.dev/digital-scanning/videoai-images/videoai:latest"

cd $root

# Run once per machine or when auth expires.
gcloud config set project $project
gcloud auth application-default login
gcloud auth configure-docker us-central1-docker.pkg.dev

# App redeploy flow: build/push image and trigger a new Cloud Run revision.
gcloud builds submit --tag $image --timeout=1200
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

gcloud run deploy $service --image $image --region $region --project $project
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "App deploy completed successfully."
