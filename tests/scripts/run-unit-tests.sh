#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)

source "$script_dir/ensure-node.sh"

cd "$project_root"
node ./tests/scripts/run-command-with-report.mjs \
  --suite=unit-tests \
  --label="Vitest unit tests" \
  --category=unit \
  --command="npx vitest run"