#!/usr/bin/env bash
# Pull Phi-4 (and any other required models) into the local Ollama instance.
# Run once after `make dev` or `docker compose up ollama`.

set -euo pipefail

OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"

echo "⏳ Pulling Phi-4 via Ollama at $OLLAMA_BASE_URL ..."
curl -fsSL "$OLLAMA_BASE_URL/api/pull" \
  -H "Content-Type: application/json" \
  -d '{"name":"phi4"}' | tail -n1

echo "✅ Phi-4 ready."
