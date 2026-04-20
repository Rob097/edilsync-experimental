#!/usr/bin/env bash

set -euo pipefail

EDILSYNC_MAIN_PROJECT_REF=${EDILSYNC_MAIN_PROJECT_REF:-eeautkvckrbuorngkvyi}
EDILSYNC_QA_PROJECT_REF=${EDILSYNC_QA_PROJECT_REF:-csjphzmyacnfmhllgqnq}

supabase_url=${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}

if [[ -z "$supabase_url" ]]; then
  echo "Missing SUPABASE_URL or VITE_SUPABASE_URL. Expected QA target configuration." >&2
  exit 1
fi

if [[ "$supabase_url" =~ ^https?://([^/.]+)\.supabase\.co ]]; then
  project_ref="${BASH_REMATCH[1]}"
else
  echo "Unable to extract a Supabase project ref from '$supabase_url'." >&2
  exit 1
fi

if [[ "$project_ref" == "$EDILSYNC_MAIN_PROJECT_REF" ]]; then
  echo "Refusing to run remote QA tests against production/main ($EDILSYNC_MAIN_PROJECT_REF)." >&2
  exit 1
fi

if [[ "$project_ref" != "$EDILSYNC_QA_PROJECT_REF" ]]; then
  echo "Refusing to run remote QA tests against '$project_ref'. Expected QA '$EDILSYNC_QA_PROJECT_REF'." >&2
  exit 1
fi
