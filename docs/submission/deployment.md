# Deployment Instructions

## Recommended App Redeploy Flow

Use the dedicated app deploy script:

```powershell
.\deploy-app.ps1
```

Linux/macOS:

```bash
./deploy-app.sh
```

This performs:

1. Project selection and auth setup
2. Container build and push through Cloud Build
3. Cloud Run deploy with the new image to create a new revision

## Infra-Only Deploy Flow

Use:

```powershell
.\deploy-infra.ps1
```

Linux/macOS:

```bash
./deploy-infra.sh
```

## Combined Flow

Use the launcher if you want both:

```powershell
.\REDEPLOY_COMMANDS.ps1 -All
```

Linux/macOS:

```bash
./REDEPLOY_COMMANDS.sh --all
```

Or:

```powershell
.\REDEPLOY_COMMANDS.ps1 -App
.\REDEPLOY_COMMANDS.ps1 -Infra
```

Linux/macOS:

```bash
./REDEPLOY_COMMANDS.sh --app
./REDEPLOY_COMMANDS.sh --infra
```

## Manual App Deploy Commands

```powershell
gcloud builds submit --tag us-central1-docker.pkg.dev/digital-scanning/videoai-images/videoai:latest --timeout=1200
gcloud run deploy videoai-backend --image us-central1-docker.pkg.dev/digital-scanning/videoai-images/videoai:latest --region us-central1 --project digital-scanning
```

These same `gcloud` commands work in Bash as well.

## Build Note

Production builds use Webpack for stability:

```bash
next build --webpack
```

This avoids the Turbopack production panic encountered during Cloud Build.
