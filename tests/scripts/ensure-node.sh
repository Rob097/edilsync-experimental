#!/usr/bin/env bash

set -euo pipefail

required_node_version="${EDILSYNC_REQUIRED_NODE_VERSION:-22.16.0}"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  echo "nvm is required to run the test toolchain with Node ${required_node_version}." >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"
nvm use "$required_node_version" > /dev/null

active_node_version=$(node -v | sed 's/^v//')

if [[ "$active_node_version" != "$required_node_version" ]]; then
  echo "Expected Node ${required_node_version}, found ${active_node_version}." >&2
  exit 1
fi

export EDILSYNC_REQUIRED_NODE_VERSION="$required_node_version"