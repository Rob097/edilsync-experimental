#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)

source "$script_dir/ensure-node.sh"

cd "$project_root"
node ./tests/scripts/run-command-with-report.mjs \
  --suite=coverage-tests \
  --label="Vitest coverage" \
  --category=coverage \
  --command="npx vitest run --coverage"