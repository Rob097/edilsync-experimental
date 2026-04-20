#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
project_root=$(cd "$script_dir/../.." && pwd)

source "$script_dir/ensure-node.sh"
source "$script_dir/load-qa-env.sh"
bash "$script_dir/assert-qa-target.sh"

export RUN_REMOTE_QA_INTEGRATION=1

cd "$project_root"
node ./tests/scripts/run-command-with-report.mjs \
	--suite=integration-qa \
	--label="Remote QA integration" \
	--category=integration \
	--command="npm exec vitest run tests/integration/qa-branch.functions.test.js"
