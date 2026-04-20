#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)

source "$script_dir/ensure-node.sh"
source "$script_dir/load-qa-env.sh"
bash "$script_dir/assert-qa-target.sh"

export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:4173}"
export VITE_APP_BASE_URL="${VITE_APP_BASE_URL:-$PLAYWRIGHT_BASE_URL}"

cd "$project_root"
node ./tests/scripts/run-command-with-report.mjs \
	--suite=e2e-regression \
	--label="Playwright regression" \
	--category=e2e \
	--command="npx playwright test --project=regression"
