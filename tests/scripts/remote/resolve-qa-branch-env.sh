#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <parent-project-ref> <branch-name> [max-attempts]" >&2
  exit 1
fi

parent_project_ref=$1
branch_name=$2
max_attempts=${3:-40}
attempt=1

if [[ "$branch_name" == "main" ]]; then
  echo "Refusing to resolve the default Supabase branch as a QA target." >&2
  exit 1
fi

while true; do
  if branch_list_json=$(npx supabase branches list --project-ref "$parent_project_ref" -o json 2>/dev/null) \
    && branch_json=$(npx supabase branches get "$branch_name" --project-ref "$parent_project_ref" -o json 2>/dev/null); then
    env_lines=$(BRANCH_LIST_JSON="$branch_list_json" BRANCH_JSON="$branch_json" BRANCH_NAME="$branch_name" PARENT_PROJECT_REF="$parent_project_ref" node <<'NODE'
const branches = JSON.parse(process.env.BRANCH_LIST_JSON || '[]');
const branchName = String(process.env.BRANCH_NAME || '');
const parentProjectRef = String(process.env.PARENT_PROJECT_REF || '');
const branchMeta = branches.find((candidate) => String(candidate.name || '') === branchName) || {};
const branchEnv = JSON.parse(process.env.BRANCH_JSON || '{}');

const previewStatus = String(branchMeta.preview_project_status || '');
const status = String(branchMeta.status || '');
const projectRef = String(branchMeta.project_ref || '');
const supabaseUrl = String(branchEnv.SUPABASE_URL || '');
const anonKey = String(branchEnv.SUPABASE_ANON_KEY || '');
const serviceRoleKey = String(branchEnv.SUPABASE_SERVICE_ROLE_KEY || '');
const postgresUrl = String(branchEnv.POSTGRES_URL || '');
const postgresUrlCli = postgresUrl
  ? `${postgresUrl}${postgresUrl.includes('?') ? '&' : '?'}statement_cache_mode=describe`
  : '';
const postgresUrlNonPooling = String(branchEnv.POSTGRES_URL_NON_POOLING || '');

const isReady = previewStatus === 'ACTIVE_HEALTHY' && projectRef && supabaseUrl && anonKey && postgresUrl;

if (projectRef && projectRef === parentProjectRef) {
  process.stderr.write('Resolved branch points to the production project ref; refusing QA targeting.\n');
  process.exit(1);
}

const values = {
  BRANCH_NAME: String(branchMeta.name || branchName),
  BRANCH_ID: String(branchMeta.id || ''),
  BRANCH_PROJECT_REF: projectRef,
  BRANCH_STATUS: status,
  BRANCH_PREVIEW_STATUS: previewStatus,
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  POSTGRES_URL: postgresUrl,
  POSTGRES_URL_CLI: postgresUrlCli,
  POSTGRES_URL_NON_POOLING: postgresUrlNonPooling,
  BRANCH_READY: isReady ? 'true' : 'false',
};

for (const [key, value] of Object.entries(values)) {
  process.stdout.write(`${key}=${String(value).replace(/\r?\n/g, '')}\n`);
}
NODE
)

    if grep -q '^BRANCH_READY=true$' <<<"$env_lines"; then
      env_lines=${env_lines//$'\n'BRANCH_READY=true/}
      while IFS='=' read -r key value; do
        printf 'export %s=%q\n' "$key" "$value"
      done <<<"$env_lines"
      exit 0
    fi
  fi

  if (( attempt >= max_attempts )); then
    echo "Supabase branch '$branch_name' is not ready after $max_attempts attempts." >&2
    exit 1
  fi

  attempt=$((attempt + 1))
  sleep 15
done
