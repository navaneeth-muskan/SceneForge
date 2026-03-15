$root = "E:\React Projects\VideoAI"
$tfDir = Join-Path $root "infra\terraform"

cd $tfDir

# Run only first time here, or after provider/backend/module changes.
terraform init
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

# Run when Terraform files (.tf/.tfvars) changed.
terraform apply -auto-approve
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "Infra deploy completed successfully."
