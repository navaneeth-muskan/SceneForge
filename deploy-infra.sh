#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="$ROOT/infra/terraform"

cd "$TF_DIR"

# Run only first time here, or after provider/backend/module changes.
terraform init

# Run when Terraform files (.tf/.tfvars) changed.
terraform apply -auto-approve

echo "Infra deploy completed successfully."