#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
source "$script_dir/load-qa-env.sh"

required_env_names=(SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY)
missing_env_names=()

for env_name in "${required_env_names[@]}"; do
  if [[ -z "${!env_name:-}" ]]; then
    missing_env_names+=("$env_name")
  fi
done

if (( ${#missing_env_names[@]} > 0 )); then
  echo "QA env incomplete in $EDILSYNC_QA_ENV_FILE. Missing: ${missing_env_names[*]}." >&2
  exit 1
fi

bash "$project_root/tests/scripts/assert-qa-target.sh"

echo "QA env ready: $EDILSYNC_QA_ENV_FILE"
