#!/usr/bin/env bash
# scripts/scope_check.sh
# Enforce that staged files are within AGENT_DIR scope.
# Usage: AGENT_DIR="projects/BackendModule/" ./scripts/scope_check.sh

set -euo pipefail

# Normalize AGENT_DIR if provided
if [ -n "${AGENT_DIR:-}" ]; then
  # remove leading ./ and ensure trailing slash
  AGENT_DIR="${AGENT_DIR#./}"
  case "$AGENT_DIR" in
    */) ;;
    *) AGENT_DIR="$AGENT_DIR/";;
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
  echo "❗ AGENT_DIR not set. Set AGENT_DIR to your working directory (e.g. projects/BackendModule/)."
  echo "If you are a maintainer and intentionally bypassing, set MAINTAINER_BYPASS=1."
  exit 1
fi

VIOLATION=0
# Determine allowed maintainer agent name for .context edits
AGENT_BASENAME=$(basename "${AGENT_DIR%/}")

# iterate safely over NUL-separated names
while IFS= read -r -d '' FILE; do
  # normalize file path (remove leading ./)
  FILE="${FILE#./}"

  # allow edits to .context and agents only by SecretaryAgent (or agent named SecretaryAgent)
  if [[ "$FILE" == ".context/"* ]] || [[ "$FILE" == "agents/"* ]] || [[ "$FILE" == "agents.md" ]] || [[ "$FILE" == "agent_schedule.md" ]]; then
    if [[ "$AGENT_BASENAME" != "SecretaryAgent" && "$AGENT_BASENAME" != "ag00" && "$AGENT_BASENAME" != "AG-00" ]]; then
      echo "❌ ERROR: Only SecretaryAgent may modify $FILE (current AGENT_DIR basename: $AGENT_BASENAME)"
      VIOLATION=1
    fi
    continue
  fi

  # Allow edits inside the agent working dir
  if [[ "$FILE" != "$AGENT_DIR"* ]]; then
    echo "❌ ERROR: Attempt to modify $FILE outside allowed scope ($AGENT_DIR)."
    VIOLATION=1
  fi
done < <(printf '%s' "$STAGED_FILES_RAW")

if [ $VIOLATION -eq 1 ]; then
  echo "Commit blocked by scope_check."
  exit 1
fi

echo "Scope check passed."
exit 0
