#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)

env_file=""
for candidate in "$project_root/.env.qa.local" "$project_root/.env.qa"; do
  if [[ -f "$candidate" ]]; then
    env_file=$candidate
    break
  fi
done

if [[ -z "$env_file" ]]; then
  echo "Missing QA env file. Create .env.qa.local from .env.qa.example." >&2
  return 1 2>/dev/null || exit 1
fi

set -a
source "$env_file"
set +a

export SUPABASE_URL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${VITE_SUPABASE_ANON_KEY:-}}"
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY:-}}"
export EDILSYNC_QA_ENV_FILE="$env_file"
export EDILSYNC_REMOTE_QA="1"