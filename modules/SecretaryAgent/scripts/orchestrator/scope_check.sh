#!/usr/bin/env bash
# modules/SecretaryAgent/scripts/orchestrator/scope_check.sh
# Enforce that staged files are within AGENT_DIR scope.
# Usage: AGENT_DIR="modules/BackendModule/" ./modules/SecretaryAgent/scripts/orchestrator/scope_check.sh

set -euo pipefail

# Normalize AGENT_DIR if provided
if [ -n "${AGENT_DIR:-}" ]; then
  AGENT_DIR="${AGENT_DIR#./}"
  case "$AGENT_DIR" in
    */) ;;
    *) AGENT_DIR="$AGENT_DIR/" ;;
  esac
fi

STAGED_FILES_RAW=$(git diff --cached --name-only -z || true)
if [ -z "$STAGED_FILES_RAW" ]; then
  echo "No staged files to check."
  exit 0
fi

if [ -z "${AGENT_DIR:-}" ]; then
  if [ "${MAINTAINER_BYPASS:-0}" = "1" ]; then
    echo "MAINTAINER_BYPASS enabled; skipping scope check."
    exit 0
  fi
  echo "â— AGENT_DIR not set. Set AGENT_DIR to your working directory (e.g. modules/BackendModule/)."
  echo "If you are a maintainer and intentionally bypassing, set MAINTAINER_BYPASS=1."
  exit 1
fi

VIOLATION=0
AGENT_BASENAME=$(basename "${AGENT_DIR%/}")

while IFS= read -r -d '' FILE; do
  FILE="${FILE#./}"

  # Governance files: only SecretaryAgent may modify
  if [[ "$FILE" == ".github/agents/"* ]] || [[ "$FILE" == "document/"* ]] || [[ "$FILE" == ".context/agent_boundaries.json" ]] || [[ "$FILE" == ".context/openapi.yaml" ]] || [[ "$FILE" == ".context/data_schema.json" ]] || [[ "$FILE" == ".context/system_architecture.yaml" ]]; then
    if [[ "$AGENT_BASENAME" != "SecretaryAgent" && "$AGENT_BASENAME" != "ag00" && "$AGENT_BASENAME" != "AG-00" ]]; then
      echo "âŒ ERROR: Only SecretaryAgent may modify $FILE (current AGENT_DIR basename: $AGENT_BASENAME)"
      VIOLATION=1
    fi
    continue
  fi

  # AG-00 has authority over module-local agent folders
  if [[ "$AGENT_BASENAME" == "SecretaryAgent" || "$AGENT_BASENAME" == "ag00" || "$AGENT_BASENAME" == "AG-00" ]]; then
    if [[ "$FILE" == modules/*/agent/* ]]; then
      continue
    fi
  fi

  if [[ "$FILE" != "$AGENT_DIR"* ]]; then
    echo "âŒ ERROR: Attempt to modify $FILE outside allowed scope ($AGENT_DIR)."
    VIOLATION=1
  fi
done < <(printf '%s' "$STAGED_FILES_RAW")

if [ $VIOLATION -eq 1 ]; then
  echo "Commit blocked by scope_check."
  exit 1
fi

echo "Scope check passed."
exit 0


