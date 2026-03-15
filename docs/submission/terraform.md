# Terraform Infrastructure Notes

## Location

Terraform files are in `infra/terraform/`.

## What Terraform Manages

- Cloud Run service
- Artifact Registry repository
- IAM service accounts and roles
- Google Cloud Storage bucket and related configuration

## Typical Commands

```powershell
cd infra/terraform
terraform init
terraform plan
terraform apply -auto-approve
```

## When To Run Terraform

- First-time infrastructure setup
- Changes to `.tf`, backend configuration, providers, or modules
- Service configuration changes that are intentionally managed through Terraform

## Important Practical Note

App-only code changes do not require Terraform if infrastructure is unchanged.
Use the app deploy script for normal code redeploys and use Terraform only for infra changes.
