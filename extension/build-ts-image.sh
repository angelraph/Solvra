#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

export SOURCE_DATE_EPOCH="$(git log -1 --format=%ct)"
export EXTENSION_DOCKERFILE=typescript/Dockerfile

source scripts/lib/versions.sh
load_versions "$PWD"
export TEE_NODE_REF

echo "SOURCE_DATE_EPOCH=$SOURCE_DATE_EPOCH"
echo "TEE_NODE_REF=$TEE_NODE_REF"
echo "EXTENSION_DOCKERFILE=$EXTENSION_DOCKERFILE"

docker compose -f docker-compose.yaml build --no-cache extension-tee
