#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../../.." && pwd)"

# shellcheck source=/dev/null
source "${repo_root}/tests/scripts/ensure-node.sh"

cd "$repo_root"

production_project_ref=${SUPABASE_PRODUCTION_PROJECT_REF:-eeautkvckrbuorngkvyi}
configured_project_ref=$(sed -nE 's/^project_id = "([^"]+)"/\1/p' supabase/config.toml | head -n 1)

if [[ "$configured_project_ref" != "$production_project_ref" ]]; then
  echo "supabase/config.toml is not linked to the expected production project ref '${production_project_ref}'." >&2
  exit 1
fi

mapfile -t local_versions < <(find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sed -E 's/^([0-9]{14}).*/\1/' | sort -u)

if [[ ${#local_versions[@]} -eq 0 ]]; then
  echo "No local migration files were found under supabase/migrations." >&2
  exit 1
fi

remote_json="$(npx --no-install supabase db query "select version from supabase_migrations.schema_migrations order by version;" --linked --output json)"
mapfile -t remote_versions < <(REMOTE_JSON="$remote_json" node <<'NODE'
const rows = JSON.parse(process.env.REMOTE_JSON || '[]');
for (const row of rows) {
  if (row?.version) {
    console.log(row.version);
  }
}
NODE
)

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT
local_file="$tmp_dir/local.txt"
remote_file="$tmp_dir/remote.txt"

: > "$local_file"
for version in "${local_versions[@]}"; do
  printf '%s\n' "$version" >> "$local_file"
done

: > "$remote_file"
for version in "${remote_versions[@]}"; do
  printf '%s\n' "$version" >> "$remote_file"
done

mapfile -t remote_only_versions < <(comm -13 "$local_file" "$remote_file")
mapfile -t local_only_versions < <(comm -23 "$local_file" "$remote_file")

printf 'Local migration versions: %s\n' "${#local_versions[@]}"
printf 'Remote migration versions before repair: %s\n' "${#remote_versions[@]}"

if [[ ${#remote_only_versions[@]} -eq 0 && ${#local_only_versions[@]} -eq 0 ]]; then
  echo "Linked migration history already matches local supabase/migrations." 
  exit 0
fi

if [[ ${#remote_only_versions[@]} -gt 0 ]]; then
  printf 'Reverting remote-only migration versions:\n'
  printf '  - %s\n' "${remote_only_versions[@]}"
  npx --no-install supabase migration repair --linked --status reverted "${remote_only_versions[@]}" --yes
fi

if [[ ${#local_only_versions[@]} -gt 0 ]]; then
  printf 'Applying local-only migration versions to history:\n'
  printf '  - %s\n' "${local_only_versions[@]}"
  npx --no-install supabase migration repair --linked --status applied "${local_only_versions[@]}" --yes
fi

final_json="$(npx --no-install supabase db query "select version from supabase_migrations.schema_migrations order by version;" --linked --output json)"
mapfile -t final_versions < <(REMOTE_JSON="$final_json" node <<'NODE'
const rows = JSON.parse(process.env.REMOTE_JSON || '[]');
for (const row of rows) {
  if (row?.version) {
    console.log(row.version);
  }
}
NODE
)

final_file="$tmp_dir/final.txt"
: > "$final_file"
for version in "${final_versions[@]}"; do
  printf '%s\n' "$version" >> "$final_file"
done

if ! diff -u "$local_file" "$final_file" > /dev/null; then
  echo "Linked migration history still does not match local supabase/migrations after repair." >&2
  diff -u "$local_file" "$final_file" || true
  exit 1
fi

echo "Linked migration history now matches local supabase/migrations." 