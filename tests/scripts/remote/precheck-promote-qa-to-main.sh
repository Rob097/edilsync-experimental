#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../../.." && pwd)"

# shellcheck source=/dev/null
source "${repo_root}/tests/scripts/ensure-node.sh"

cd "$repo_root"

production_project_ref=${SUPABASE_PRODUCTION_PROJECT_REF:-eeautkvckrbuorngkvyi}
qa_project_ref=${SUPABASE_QA_PROJECT_REF:-csjphzmyacnfmhllgqnq}
production_branch_name=${SUPABASE_PRODUCTION_BRANCH_NAME:-main}
qa_branch_name=${SUPABASE_QA_BRANCH_NAME:-qa}

status=0
warn_count=0
branch_health_failed=0
history_drift_failed=0
qa_local_mismatch_failed=0

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

print_section() {
  printf '\n== %s ==\n' "$1"
}

report_ok() {
  printf 'OK: %s\n' "$1"
}

report_warn() {
  warn_count=$((warn_count + 1))
  printf 'WARN: %s\n' "$1"
}

report_fail() {
  status=1
  printf 'FAIL: %s\n' "$1"
}

write_lines_file() {
  local output_file=$1
  shift
  : > "$output_file"
  for item in "$@"; do
    printf '%s\n' "$item" >> "$output_file"
  done
}

print_list() {
  local prefix=$1
  shift
  for item in "$@"; do
    printf '  - %s%s\n' "$prefix" "$item"
  done
}

configured_project_ref=$(sed -nE 's/^project_id = "([^"]+)"/\1/p' supabase/config.toml | head -n 1)

print_section "Context"
printf 'Repo root: %s\n' "$repo_root"
printf 'Configured project_id: %s\n' "$configured_project_ref"
printf 'Production project ref: %s\n' "$production_project_ref"
printf 'QA project ref: %s\n' "$qa_project_ref"

if [[ "$configured_project_ref" != "$production_project_ref" ]]; then
  report_fail "supabase/config.toml is not linked to the expected production project ref."
else
  report_ok "supabase/config.toml points to the expected production project ref."
fi

print_section "Branch health"
if ! branches_json="$(npx --no-install supabase branches list --project-ref "$production_project_ref" --output json)"; then
  report_fail "Unable to list Supabase branches. Run npm run supabase:login and retry."
  exit 1
fi

declare prod_found=0
declare qa_found=0
declare prod_branch_id=""
declare prod_branch_status=""
declare qa_branch_id=""
declare qa_branch_status=""

while IFS='=' read -r key value; do
  case "$key" in
    PROD_FOUND) prod_found=$value ;;
    PROD_ID) prod_branch_id=$value ;;
    PROD_STATUS) prod_branch_status=$value ;;
    QA_FOUND) qa_found=$value ;;
    QA_ID) qa_branch_id=$value ;;
    QA_STATUS) qa_branch_status=$value ;;
  esac
done < <(
  BRANCHES_JSON="$branches_json" \
  PROD_NAME="$production_branch_name" \
  PROD_REF="$production_project_ref" \
  QA_NAME="$qa_branch_name" \
  QA_REF="$qa_project_ref" \
  node <<'NODE'
const branches = JSON.parse(process.env.BRANCHES_JSON || '[]');
const prod = branches.find((branch) => branch.project_ref === process.env.PROD_REF || branch.name === process.env.PROD_NAME || branch.is_default) || null;
const qa = branches.find((branch) => branch.project_ref === process.env.QA_REF || branch.name === process.env.QA_NAME) || null;

const emit = (prefix, branch) => {
  console.log(`${prefix}_FOUND=${branch ? '1' : '0'}`);
  if (!branch) return;
  console.log(`${prefix}_ID=${branch.id || ''}`);
  console.log(`${prefix}_STATUS=${branch.status || ''}`);
};

emit('PROD', prod);
emit('QA', qa);
NODE
)

if [[ "$prod_found" != "1" ]]; then
  branch_health_failed=1
  report_fail "Production branch '${production_branch_name}' was not found in Supabase Branching."
else
  printf 'Production branch id: %s\n' "$prod_branch_id"
  printf 'Production branch status: %s\n' "$prod_branch_status"
  if [[ ! "$prod_branch_status" =~ ^(FUNCTIONS_DEPLOYED|MIGRATIONS_PASSED)$ ]]; then
    branch_health_failed=1
    report_fail "Production branch is not in a stable state for promotion."
  else
    report_ok "Production branch is in a stable state."
  fi
fi

if [[ "$qa_found" != "1" ]]; then
  branch_health_failed=1
  report_fail "QA branch '${qa_branch_name}' was not found in Supabase Branching."
else
  printf 'QA branch id: %s\n' "$qa_branch_id"
  printf 'QA branch status: %s\n' "$qa_branch_status"
  if [[ ! "$qa_branch_status" =~ ^(FUNCTIONS_DEPLOYED|MIGRATIONS_PASSED)$ ]]; then
    branch_health_failed=1
    report_fail "QA branch is not in a stable state for promotion."
  else
    report_ok "QA branch is in a stable state."
  fi
fi

print_section "Migration history"
mapfile -t local_migration_versions < <(find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | sed -E 's/^([0-9]{14}).*/\1/' | sort -u)
if [[ ${#local_migration_versions[@]} -eq 0 ]]; then
  history_drift_failed=1
  report_fail "No local migration files were found under supabase/migrations."
else
  printf 'Local migration versions: %s\n' "${#local_migration_versions[@]}"
fi

if ! prod_migrations_json="$(npx --no-install supabase db query "select version from supabase_migrations.schema_migrations order by version;" --linked --output json)"; then
  report_fail "Unable to read production schema_migrations from the linked project."
  exit 1
fi

mapfile -t prod_migration_versions < <(REMOTE_JSON="$prod_migrations_json" node <<'NODE'
const rows = JSON.parse(process.env.REMOTE_JSON || '[]');
for (const row of rows) {
  if (row?.version) {
    console.log(row.version);
  }
}
NODE
)
printf 'Production migration versions: %s\n' "${#prod_migration_versions[@]}"

local_migrations_file="$tmp_dir/local_migrations.txt"
production_migrations_file="$tmp_dir/production_migrations.txt"
write_lines_file "$local_migrations_file" "${local_migration_versions[@]}"
write_lines_file "$production_migrations_file" "${prod_migration_versions[@]}"

mapfile -t local_only_migrations < <(comm -23 "$local_migrations_file" "$production_migrations_file")
mapfile -t prod_only_migrations < <(comm -13 "$local_migrations_file" "$production_migrations_file")

if [[ ${#local_only_migrations[@]} -gt 0 || ${#prod_only_migrations[@]} -gt 0 ]]; then
  history_drift_failed=1
  report_fail "Production migration history does not match local supabase/migrations."
  if [[ ${#local_only_migrations[@]} -gt 0 ]]; then
    printf 'Local-only migration versions:\n'
    print_list '' "${local_only_migrations[@]}"
  fi
  if [[ ${#prod_only_migrations[@]} -gt 0 ]]; then
    printf 'Production-only migration versions:\n'
    print_list '' "${prod_only_migrations[@]}"
  fi
else
  report_ok "Production migration history matches local migration files."
fi

print_section "Edge functions"
mapfile -t local_function_slugs < <(find ./supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | while read -r function_dir; do
  if [[ -f "$function_dir/index.ts" ]]; then
    basename "$function_dir"
  fi
done | sort)
printf 'Local function slugs: %s\n' "${#local_function_slugs[@]}"

if ! qa_functions_json="$(npx --no-install supabase functions list --project-ref "$qa_project_ref" --output json)"; then
  report_fail "Unable to list QA edge functions."
  exit 1
fi

if ! prod_functions_json="$(npx --no-install supabase functions list --project-ref "$production_project_ref" --output json)"; then
  report_fail "Unable to list production edge functions."
  exit 1
fi

mapfile -t qa_function_slugs < <(FUNCTIONS_JSON="$qa_functions_json" node <<'NODE' | sort -u
const rows = JSON.parse(process.env.FUNCTIONS_JSON || '[]');
for (const row of rows) {
  const slug = row?.slug || row?.name;
  if (slug) {
    console.log(slug);
  }
}
NODE
)

mapfile -t prod_function_slugs < <(FUNCTIONS_JSON="$prod_functions_json" node <<'NODE' | sort -u
const rows = JSON.parse(process.env.FUNCTIONS_JSON || '[]');
for (const row of rows) {
  const slug = row?.slug || row?.name;
  if (slug) {
    console.log(slug);
  }
}
NODE
)

local_functions_file="$tmp_dir/local_functions.txt"
qa_functions_file="$tmp_dir/qa_functions.txt"
prod_functions_file="$tmp_dir/prod_functions.txt"
write_lines_file "$local_functions_file" "${local_function_slugs[@]}"
write_lines_file "$qa_functions_file" "${qa_function_slugs[@]}"
write_lines_file "$prod_functions_file" "${prod_function_slugs[@]}"

mapfile -t local_only_vs_qa < <(comm -23 "$local_functions_file" "$qa_functions_file")
mapfile -t qa_only_vs_local < <(comm -13 "$local_functions_file" "$qa_functions_file")
mapfile -t qa_only_vs_prod < <(comm -23 "$qa_functions_file" "$prod_functions_file")
mapfile -t prod_only_vs_qa < <(comm -13 "$qa_functions_file" "$prod_functions_file")

if [[ ${#local_only_vs_qa[@]} -gt 0 || ${#qa_only_vs_local[@]} -gt 0 ]]; then
  qa_local_mismatch_failed=1
  report_fail "Local function slug set does not match the QA branch."
  if [[ ${#local_only_vs_qa[@]} -gt 0 ]]; then
    printf 'Local-only function slugs:\n'
    print_list '' "${local_only_vs_qa[@]}"
  fi
  if [[ ${#qa_only_vs_local[@]} -gt 0 ]]; then
    printf 'QA-only function slugs:\n'
    print_list '' "${qa_only_vs_local[@]}"
  fi
else
  report_ok "Local function slug set matches QA."
fi

if [[ ${#qa_only_vs_prod[@]} -gt 0 ]]; then
  report_warn "QA has functions that are not yet on production. These are the functions pending promotion."
  print_list '' "${qa_only_vs_prod[@]}"
else
  report_ok "No QA-only function slugs are pending promotion."
fi

if [[ ${#prod_only_vs_qa[@]} -gt 0 ]]; then
  report_warn "Production has function slugs that are outside the current QA set. Review them manually because branch merge will not treat them as a QA promotion target."
  print_list '' "${prod_only_vs_qa[@]}"
fi

verify_jwt_mismatches="$tmp_dir/verify_jwt_mismatches.txt"
QA_JSON="$qa_functions_json" PROD_JSON="$prod_functions_json" node <<'NODE' > "$verify_jwt_mismatches"
const qa = new Map();
for (const row of JSON.parse(process.env.QA_JSON || '[]')) {
  const slug = row?.slug || row?.name;
  if (slug) qa.set(slug, Boolean(row?.verify_jwt));
}

const prod = new Map();
for (const row of JSON.parse(process.env.PROD_JSON || '[]')) {
  const slug = row?.slug || row?.name;
  if (slug) prod.set(slug, Boolean(row?.verify_jwt));
}

const shared = [...qa.keys()].filter((slug) => prod.has(slug)).sort();
for (const slug of shared) {
  if (qa.get(slug) !== prod.get(slug)) {
    console.log(`${slug}: qa=${qa.get(slug)} prod=${prod.get(slug)}`);
  }
}
NODE

if [[ -s "$verify_jwt_mismatches" ]]; then
  report_warn "QA and production differ on verify_jwt for some shared functions."
  while IFS= read -r line; do
    printf '  - %s\n' "$line"
  done < "$verify_jwt_mismatches"
else
  report_ok "verify_jwt is aligned for shared QA and production functions."
fi

print_section "Summary"
if [[ $status -eq 0 ]]; then
  report_ok "Supabase QA -> main promotion precheck passed."
else
  report_fail "Supabase QA -> main promotion precheck failed."
fi

if [[ $branch_health_failed -eq 1 ]]; then
  printf 'Next action: wait for both branches to return to FUNCTIONS_DEPLOYED or MIGRATIONS_PASSED before promoting.\n'
fi

if [[ $history_drift_failed -eq 1 ]]; then
  printf 'Next action: run npm run supabase:promote:repair-history, then rerun this precheck.\n'
fi

if [[ $qa_local_mismatch_failed -eq 1 ]]; then
  printf 'Next action: realign local supabase/functions with QA before promoting.\n'
fi

if [[ $status -eq 0 ]]; then
  printf 'Next action: proceed with the QA -> main branch merge and then rebase QA on main.\n'
fi

if [[ $warn_count -gt 0 ]]; then
  printf 'Warnings raised: %s\n' "$warn_count"
fi

exit $status