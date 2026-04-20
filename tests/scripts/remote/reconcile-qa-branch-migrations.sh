#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <postgres-url> [migrations-dir]" >&2
  exit 1
fi

postgres_url=$1
migrations_dir=${2:-supabase/migrations}

if [[ ! -d "$migrations_dir" ]]; then
  echo "Migrations directory not found: $migrations_dir" >&2
  exit 1
fi

mapfile -t local_versions < <(find "$migrations_dir" -maxdepth 1 -type f -name '*.sql' | sort | sed -E 's#.*/([0-9]+)_.*#\1#')

if [[ ${#local_versions[@]} -eq 0 ]]; then
  echo "No local migration files found in $migrations_dir" >&2
  exit 1
fi

remote_json=$(npx supabase db query --db-url "$postgres_url" -o json "select version from supabase_migrations.schema_migrations order by version;")

mapfile -t remote_versions < <(REMOTE_JSON="$remote_json" node <<'NODE'
const rows = JSON.parse(process.env.REMOTE_JSON || '[]');
for (const row of rows) {
  if (row && row.version) {
    process.stdout.write(`${row.version}\n`);
  }
}
NODE
)

declare -A local_lookup=()
declare -A remote_lookup=()

for version in "${local_versions[@]}"; do
  local_lookup["$version"]=1
done

for version in "${remote_versions[@]}"; do
  remote_lookup["$version"]=1
done

revert_versions=()
apply_versions=()

for version in "${remote_versions[@]}"; do
  if [[ -z ${local_lookup[$version]+x} ]]; then
    revert_versions+=("$version")
  fi
done

for version in "${local_versions[@]}"; do
  if [[ -z ${remote_lookup[$version]+x} ]]; then
    apply_versions+=("$version")
  fi
done

if [[ ${#revert_versions[@]} -eq 0 && ${#apply_versions[@]} -eq 0 ]]; then
  echo "Remote branch migration history already matches local files."
  exit 0
fi

if [[ ${#revert_versions[@]} -gt 0 ]]; then
  npx supabase migration repair --db-url "$postgres_url" --status reverted "${revert_versions[@]}" --yes
fi

if [[ ${#apply_versions[@]} -gt 0 ]]; then
  npx supabase migration repair --db-url "$postgres_url" --status applied "${apply_versions[@]}" --yes
fi

echo "Reconciled remote branch migration history to local files."
