#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_APP=false
RUN_INFRA=false
RUN_ALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app)
      RUN_APP=true
      ;;
    --infra)
      RUN_INFRA=true
      ;;
    --all)
      RUN_ALL=true
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./REDEPLOY_COMMANDS.sh [--app] [--infra] [--all]"
      exit 1
      ;;
  esac
  shift
done

if [[ "$RUN_APP" == false && "$RUN_INFRA" == false && "$RUN_ALL" == false ]]; then
  RUN_ALL=true
fi

cd "$ROOT"

if [[ "$RUN_ALL" == true || "$RUN_APP" == true ]]; then
  "$ROOT/deploy-app.sh"
fi

if [[ "$RUN_ALL" == true || "$RUN_INFRA" == true ]]; then
  "$ROOT/deploy-infra.sh"
fi