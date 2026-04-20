#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)

source "$script_dir/ensure-node.sh"

started_here=false

if ! npx supabase status > /dev/null 2>&1; then
  npm run supabase:start > /dev/null
  started_here=true
fi

cleanup() {
  if [[ "$started_here" == "true" ]]; then
    npm run supabase:stop > /dev/null || true
  fi
}

trap cleanup EXIT

cd "$project_root"
node ./tests/scripts/run-command-with-report.mjs \
  --suite=db-tests \
  --label="Supabase pgTAP with local stack bootstrap" \
  --category=db \
  --command="npx supabase test db"
