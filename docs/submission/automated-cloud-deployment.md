# Automated Cloud Deployment

This document is the single reference note for the bonus point about automated cloud deployment.

## What Is Automated

SceneForge automates both application deployment and infrastructure deployment.

### 1. Application Deployment Automation

Application deployment is automated with scripts that:

- build the container image
- push the image to Artifact Registry
- trigger a new Cloud Run revision using the new image

Primary script references:

- `deploy-app.ps1`
- `deploy-app.sh`

### 2. Infrastructure-as-Code Automation

Infrastructure deployment is automated with Terraform.

Terraform manages:

- Cloud Run service
- Artifact Registry repository
- IAM service accounts and permissions
- Google Cloud Storage resources

Primary infrastructure reference:

- `infra/terraform/`

### 3. Combined Deployment Launcher

There is also a launcher script that can run app deploy, infra deploy, or both.

Launcher references:

- `REDEPLOY_COMMANDS.ps1`
- `REDEPLOY_COMMANDS.sh`

## Best Code References To Cite

If the submission form wants code, use one of these all-in-one deploy files:

- `deploy-all.ps1`
- `deploy-all.sh`

These contain the full cloud deployment flow in one place:

- project selection and auth setup
- container build and push
- Cloud Run deploy
- Terraform init and apply

If the reviewer wants the underlying split implementation as well, additional references are:

- `deploy-app.ps1`
- `deploy-infra.ps1`
- `infra/terraform/`

## Suggested Submission Wording

Automated cloud deployment is implemented through deployment scripts and infrastructure-as-code. The full deployment flow is available in `deploy-all.ps1` and `deploy-all.sh`, and the infrastructure is managed with Terraform in `infra/terraform/`.
