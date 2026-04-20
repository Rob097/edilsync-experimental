#!/usr/bin/env bash

set -uo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)

source "$script_dir/ensure-node.sh"

export EDILSYNC_TEST_SESSION_ID="${EDILSYNC_TEST_SESSION_ID:-$(node -e 'console.log(`${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(16).slice(2, 8)}`)')}"

steps=(
  "Secrets scan|npm run check:secrets"
  "Lint|npm run lint"
  "Typecheck|npm run typecheck"
)

results=()
failures=0
qa_ready=true

run_step() {
  local label=$1
  local command=$2
  local suite_slug
  suite_slug=$(printf '%s' "$label" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]\+/-/g; s/^-//; s/-$//')

  echo
  echo ">>> $label"

  if node "$project_root/tests/scripts/run-command-with-report.mjs" \
    --sessionId="$EDILSYNC_TEST_SESSION_ID" \
    --suite="$suite_slug" \
    --label="$label" \
    --category=quality \
    --command="$command"; then
    results+=("PASS|$label")
  else
    results+=("FAIL|$label")
    failures=$((failures + 1))
  fi
}

record_skip() {
  local label=$1
  local reason=$2
  results+=("SKIP|$label|$reason")
}

run_reported_script() {
  local label=$1
  local command=$2

  echo
  echo ">>> $label"

  if bash -lc "$command"; then
    results+=("PASS|$label")
  else
    results+=("FAIL|$label")
    failures=$((failures + 1))
  fi
}

for step in "${steps[@]}"; do
  IFS='|' read -r label command <<< "$step"
  run_step "$label" "$command"
done

run_reported_script "Unit tests" "npm run test:unit"
run_reported_script "Database pgTAP" "npm run test:db"

echo
echo ">>> QA env preflight"
if node "$project_root/tests/scripts/run-command-with-report.mjs" \
  --sessionId="$EDILSYNC_TEST_SESSION_ID" \
  --suite=qa-env-preflight \
  --label="QA env preflight" \
  --category=quality \
  --command="bash ./tests/scripts/check-target-env.sh"; then
  results+=("PASS|QA env preflight")
else
  results+=("FAIL|QA env preflight")
  qa_ready=false
  failures=$((failures + 1))
fi

if [[ "$qa_ready" == "true" ]]; then
  run_reported_script "Remote integration QA" "npm run test:integration:qa"
  run_reported_script "E2E smoke QA" "npm run test:e2e:smoke"
  run_reported_script "E2E critical QA" "npm run test:e2e:critical"
  run_reported_script "E2E regression QA" "npm run test:e2e:regression"
else
  record_skip "Remote integration QA" "missing or invalid QA env"
  record_skip "E2E smoke QA" "missing or invalid QA env"
  record_skip "E2E critical QA" "missing or invalid QA env"
  record_skip "E2E regression QA" "missing or invalid QA env"
fi

echo
echo "=== Test Summary ==="
for result in "${results[@]}"; do
  IFS='|' read -r status label reason <<< "$result"
  if [[ -n "${reason:-}" ]]; then
    printf '%-4s %s (%s)\n' "$status" "$label" "$reason"
  else
    printf '%-4s %s\n' "$status" "$label"
  fi
done

if (( failures > 0 )); then
  echo
  echo "Completed with $failures failing step(s)." >&2
  exit 1
fi

echo
echo "All test categories passed."
