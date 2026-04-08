#!/usr/bin/env bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

patterns=(
  'sk_(live|test)_[A-Za-z0-9]+'
  'pk_(live|test)_[A-Za-z0-9]+'
  'ghp_[A-Za-z0-9]{36}'
  'github_pat_[A-Za-z0-9_]+'
  'AKIA[0-9A-Z]{16}'
  'AIza[0-9A-Za-z_-]{35}'
  '(^|[^A-Za-z0-9_])prod_[A-Za-z0-9]{10,}([^A-Za-z0-9_]|$)'
  '(^|[^A-Za-z0-9_])price_[A-Za-z0-9]+([^A-Za-z0-9_]|$)'
  'VITE_[A-Z0-9_]*(SECRET|PASSWORD|PRIVATE|SERVICE_ROLE|ACCESS_TOKEN|REFRESH_TOKEN)[A-Z0-9_]*'
)

has_failures=0

for pattern in "${patterns[@]}"; do
  if git grep -nIE "$pattern" -- \
    ':!node_modules' \
    ':!dist' \
    ':!package-lock.json' \
    ':!pnpm-lock.yaml' \
    ':!yarn.lock' \
    >/tmp/edilsync-secret-scan.$$ 2>/dev/null; then
    cat /tmp/edilsync-secret-scan.$$
    has_failures=1
  fi
done

rm -f /tmp/edilsync-secret-scan.$$

if [[ "$has_failures" -ne 0 ]]; then
  echo "Secret scan failed: move sensitive values to server-side environment variables before committing." >&2
  exit 1
fi

echo "Secret scan passed."