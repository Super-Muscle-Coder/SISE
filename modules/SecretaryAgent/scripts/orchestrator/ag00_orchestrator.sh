#!/usr/bin/env bash
# AG-00 orchestrator
# Responsibilities: sync canonical agent specs, validate contracts, run scope scan, append audit.
set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$ROOT_DIR"

echo "[AG-00] Starting orchestration..."

# 0) Sync canonical agent specs to module-local .agent.md/.agent.json
if [ -f modules/SecretaryAgent/scripts/orchestrator/sync_agent_specs.py ]; then
  echo "[AG-00] Syncing canonical agent specs..."
  python3 modules/SecretaryAgent/scripts/orchestrator/sync_agent_specs.py
else
  echo "[AG-00] ERROR: missing sync_agent_specs.py"
  exit 2
fi

# 1) Ensure .context/agent_boundaries.json exists
if [ ! -f .context/agent_boundaries.json ]; then
  cat > .context/agent_boundaries.json <<'JSON'
{
  "system_name": "SISE",
  "version": "1.0",
  "global_constraints": {
    "enforced_python_version": "3.13",
    "allowed_tech_stack": ["python","fastapi","pytorch","react","tailwind","milvus","postgres","minio","docker","pytest"],
    "forbidden_libraries": ["pandas","tensorflow","flask"],
    "no_secrets_in_repo": true
  },
  "agents": []
}
JSON
  echo "[AG-00] Created placeholder .context/agent_boundaries.json. Please replace with canonical file."
fi

# 2) Validate JSON syntax
python3 - <<PY
import json,sys
try:
    json.load(open('.context/agent_boundaries.json', encoding='utf-8'))
    print('[AG-00] .context/agent_boundaries.json is valid JSON')
except Exception as e:
    print('[AG-00] ERROR: invalid JSON in .context/agent_boundaries.json:', e)
    sys.exit(2)
PY

# 3) Scan working tree for edits outside any declared working_dir or AG-00 governed files
echo "[AG-00] Scanning working tree for uncommitted cross-scope edits..."
python3 - <<PY
import json, subprocess, sys
rules = json.load(open('.context/agent_boundaries.json', encoding='utf-8'))
agents = [a.get('working_dir','') for a in rules.get('agents',[])]
changed = subprocess.check_output(['git','status','--porcelain']).decode().strip().splitlines()
violations = []
ag00_controlled = {
    'document/.agents.md',
    'document/agent_schedule.md',
    '.context/agent_boundaries.json',
    '.context/openapi.yaml',
    '.context/data_schema.json',
    '.context/system_architecture.yaml',
    'document/DesOfSys.md',
    'document/README.md',
    'document/system_architecture.md',
}
for line in changed:
    if not line:
        continue
    path = line.strip().split()[-1]
    allowed = False
    for wd in agents:
        if wd and path.startswith(wd):
            allowed = True
            break
    if path.startswith('.github/agents/') or path.startswith('document/') or path in ag00_controlled:
        allowed = True
    if not allowed:
        violations.append(path)
if violations:
    print('[AG-00] SCOPE VIOLATIONS FOUND:')
    for v in violations:
        print(' -', v)
    sys.exit(2)
print('[AG-00] No immediate scope violations detected.')
PY

# 4) Validate openapi if present
if [ -f .context/openapi.yaml ]; then
  echo "[AG-00] Validating .context/openapi.yaml..."
  python3 - <<PY
from openapi_spec_validator import validate_spec
import yaml
spec = yaml.safe_load(open('.context/openapi.yaml', encoding='utf-8'))
validate_spec(spec)
print('[AG-00] .context/openapi.yaml valid')
PY
else
  echo "[AG-00] .context/openapi.yaml not found; skipping"
fi

# 5) Append audit summary to document/agent_schedule.md
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
if [ ! -f document/agent_schedule.md ]; then
  cat > document/agent_schedule.md <<'MD'
# Agent Schedule
- AG-01 AIModule: Not Started
- AG-02 StorageModule: Not Started
- AG-03 BackendModule: Not Started
- AG-04 WebFrontend: Not Started
- AG-05 MobileFrontend: Not Started
- AG-00 SecretaryAgent: Active
MD
fi

echo "- [$TS] AG-00: repository scanned; canonical agent specs synchronized." >> document/agent_schedule.md
echo "[AG-00] Audit complete. document/agent_schedule.md updated."

echo "[AG-00] Orchestration finished."
exit 0


