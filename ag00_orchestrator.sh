#!/usr/bin/env bash
# scripts/ag00_orchestrator.sh
# Run as SecretaryAgent (AG-00). Responsibilities: initialize baseline, audit, and append schedule.
set -euo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$ROOT_DIR"

echo "[AG-00] Starting orchestration..."

# 1. Ensure .context exists and agent_boundaries.json is present
mkdir -p .context
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

# 2. Validate JSON syntax
python3 - <<PY
import json,sys
try:
    json.load(open('.context/agent_boundaries.json'))
    print("[AG-00] .context/agent_boundaries.json is valid JSON")
except Exception as e:
    print("[AG-00] ERROR: invalid JSON in .context/agent_boundaries.json:", e)
    sys.exit(2)
PY

# 3. Run scope scan (git status)
echo "[AG-00] Scanning working tree for uncommitted cross-scope edits..."
python3 - <<PY
import json, subprocess, sys
rules = json.load(open('.context/agent_boundaries.json'))
agents = [a.get('working_dir','') for a in rules.get('agents',[])]
changed = subprocess.check_output(['git','status','--porcelain']).decode().strip().splitlines()
violations = []
for line in changed:
    if not line:
        continue
    path = line.strip().split()[-1]
    allowed = False
    for wd in agents:
        if wd and path.startswith(wd):
            allowed = True
            break
    if path.startswith('.context') or path.startswith('agents') or path == 'agents.md' or path == 'agent_schedule.md':
        allowed = True
    if not allowed:
        violations.append(path)
if violations:
    print("[AG-00] SCOPE VIOLATIONS FOUND:")
    for v in violations:
        print(" -", v)
    sys.exit(2)
print("[AG-00] No immediate scope violations detected.")
PY

# 4. Validate openapi if present
if [ -f .context/openapi.yaml ]; then
  echo "[AG-00] Validating .context/openapi.yaml..."
  python3 - <<PY
from openapi_spec_validator import validate_spec
import yaml,sys
spec = yaml.safe_load(open('.context/openapi.yaml'))
validate_spec(spec)
print("[AG-00] openapi.yaml valid")
PY
else
  echo "[AG-00] .context/openapi.yaml not found; skipping"
fi

# 5. Append audit summary to agent_schedule.md
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
mkdir -p agents
if [ ! -f agent_schedule.md ]; then
  cat > agent_schedule.md <<'MD'
# Agent Schedule
- AG-01 AIModule: Not Started
- AG-02 StorageModule: Not Started
- AG-03 BackendModule: Not Started
- AG-04 WebFrontend: Not Started
- AG-05 MobileFrontend: Not Started
- AG-00 SecretaryAgent: Active
MD
fi

echo "- [$TS] AG-00: repository scanned; no critical violations." >> agent_schedule.md
echo "[AG-00] Audit complete. agent_schedule.md updated."

echo "[AG-00] Orchestration finished."
exit 0
