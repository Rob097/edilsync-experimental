#!/usr/bin/env bash

set -euo pipefail

production_project_ref=${SUPABASE_PRODUCTION_PROJECT_REF:-eeautkvckrbuorngkvyi}

if [[ $# -lt 2 || $# -gt 3 ]]; then
  echo "Usage: $0 <branch-project-ref> <postgres-url> [secrets-env-file]" >&2
  exit 1
fi

branch_project_ref=$1
postgres_url=$2
secrets_env_file=${3:-}

if [[ "$branch_project_ref" == "$production_project_ref" ]]; then
  echo "Refusing to sync against production project ref '$production_project_ref'." >&2
  exit 1
fi

if [[ "$postgres_url" == *"://postgres.${production_project_ref}:"* ]] || [[ "$postgres_url" == *"db.${production_project_ref}.supabase.co"* ]]; then
  echo "Refusing to use a production database URL for QA sync." >&2
  exit 1
fi

bash ./tests/scripts/remote/reconcile-qa-branch-migrations.sh "$postgres_url"

if [[ -n "$secrets_env_file" ]]; then
  if [[ ! -f "$secrets_env_file" ]]; then
    echo "Secrets env file not found: $secrets_env_file" >&2
    exit 1
  fi

  if [[ -s "$secrets_env_file" ]]; then
    npx supabase secrets set --project-ref "$branch_project_ref" --env-file "$secrets_env_file"
  fi
fi

db_push_log=$(mktemp)
trap 'rm -f "$db_push_log"' EXIT

if ! npx supabase db push --db-url "$postgres_url" --include-all --include-seed --yes > >(tee "$db_push_log") 2> >(tee -a "$db_push_log" >&2); then
  if grep -q 'Remote migration versions not found in local migrations directory' "$db_push_log"; then
    cat >&2 <<'EOF'
Remote migration history is ahead of the local repository.
Reconcile schema drift before syncing a QA branch:
1. Run `npm run supabase:db:pull`
2. Review the generated migration against production
3. Commit the reconciliation migration, then rerun the QA branch sync
EOF
  fi

  exit 1
fi

mapfile -t local_functions < <(find ./supabase/functions -mindepth 1 -maxdepth 1 -type d ! -name '_shared' | while read -r function_dir; do
  if [[ -f "$function_dir/index.ts" ]]; then
    basename "$function_dir"
  fi
done | sort)

remote_functions_json=$(npx supabase functions list --project-ref "$branch_project_ref" -o json)
mapfile -t remote_functions < <(REMOTE_FUNCTIONS_JSON="$remote_functions_json" node <<'NODE'
const rows = JSON.parse(process.env.REMOTE_FUNCTIONS_JSON || '[]');
for (const row of rows) {
  const slug = row?.slug || row?.name;
  if (slug) {
    process.stdout.write(`${slug}\n`);
  }
}
NODE
)

declare -A local_function_lookup=()
declare -A no_verify_jwt_lookup=()

for function_name in \
  createCompanyWithInitialization \
  createProjectWithContext \
  createStripeBillingPortalSession \
  createStripeCheckoutSession \
  inviteCompanyMemberWithValidation \
  inviteProjectParticipantWithValidation \
  notifyDisputeParticipants \
  notifyProjectSponsorshipParticipants \
  notifyTaskBlockedResponsible \
  syncStripeCompanySubscription; do
  no_verify_jwt_lookup["$function_name"]=1
done

for function_name in "${local_functions[@]}"; do
  local_function_lookup["$function_name"]=1
done

for function_name in "${remote_functions[@]}"; do
  if [[ -n "$function_name" && -z ${local_function_lookup[$function_name]+x} ]]; then
    npx supabase functions delete "$function_name" --project-ref "$branch_project_ref" --yes
  fi
done

for function_name in "${local_functions[@]}"; do
  deploy_args=(functions deploy "$function_name" --project-ref "$branch_project_ref" --use-api --yes)
  if [[ -n ${no_verify_jwt_lookup[$function_name]+x} ]]; then
    deploy_args+=(--no-verify-jwt)
  fi
  npx supabase "${deploy_args[@]}"
done