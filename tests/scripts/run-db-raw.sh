#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)

source "$script_dir/ensure-node.sh"

cd "$project_root"
node ./tests/scripts/run-command-with-report.mjs \
  --suite=db-raw \
  --label="Supabase pgTAP" \
  --category=db \
  --command="npx supabase test db"