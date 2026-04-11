#!/usr/bin/env python3
"""
AG-00 agent spec synchronizer.

Sync rules:
- Canonical source: .github/agents/AGxx_*.agent.md
- Internal targets per module: modules/<ModuleName>/agent/.agent.md and .agent.json
- Mapping source of truth for module paths: .context/agent_boundaries.json
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class SyncResult:
    agent_id: str
    canonical: Path
    target_md: Optional[Path]
    target_json: Optional[Path]
    status: str
    message: str = ""


def repo_root() -> Path:
    # .../modules/SecretaryAgent/scripts/orchestrator/sync_agent_specs.py -> repo root
    return Path(__file__).resolve().parents[4]


def load_agent_boundaries(root: Path) -> Dict[str, dict]:
    path = root / ".context" / "agent_boundaries.json"
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    return {a.get("id", ""): a for a in data.get("agents", [])}


def parse_module_dir_from_working_dir(working_dir: str) -> Optional[str]:
    m = re.search(r"modules/([^/]+)/", working_dir)
    if m:
        return f"modules/{m.group(1)}"
    return None


def parse_front_matter(text: str) -> Dict[str, str]:
    lines = text.splitlines()
    if len(lines) < 3 or lines[0].strip() != "---":
        return {}

    end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        return {}

    out: Dict[str, str] = {}
    for line in lines[1:end]:
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        out[k.strip()] = v.strip()
    return out


def parse_properties(markdown: str) -> Dict[str, str]:
    props: Dict[str, str] = {}
    for line in markdown.splitlines():
        m = re.match(r"^\*\*(.+?):\*\*\s*(.+?)\s*$", line)
        if not m:
            continue
        key = m.group(1).strip().lower().replace(" ", "_")
        props[key] = m.group(2).strip()
    return props


def parse_sections(markdown: str) -> Dict[str, List[str]]:
    sections: Dict[str, List[str]] = {}
    current: Optional[str] = None

    for line in markdown.splitlines():
        h = re.match(r"^##\s+(.+?)\s*$", line)
        if h:
            current = h.group(1).strip().lower().replace(" ", "_")
            sections[current] = []
            continue

        if current and line.strip().startswith("- "):
            sections[current].append(line.strip()[2:].strip())

    return sections


def parse_title(markdown: str) -> str:
    for line in markdown.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return ""


def build_agent_json(agent_id: str, canonical_rel: str, markdown: str, module_dir: str) -> dict:
    return {
        "schema_version": "1.0",
        "agent_id": agent_id,
        "canonical_source": canonical_rel,
        "target_module": module_dir,
        "metadata": parse_front_matter(markdown),
        "title": parse_title(markdown),
        "properties": parse_properties(markdown),
        "sections": parse_sections(markdown),
    }


def main() -> int:
    root = repo_root()
    canonical_dir = root / ".github" / "agents"
    boundaries = load_agent_boundaries(root)

    results: List[SyncResult] = []

    for md_file in sorted(canonical_dir.glob("AG*.agent.md")):
        m = re.match(r"^(AG\d{2})_", md_file.name)
        if not m:
            results.append(SyncResult("UNKNOWN", md_file, None, None, "skipped", "Unsupported filename format"))
            continue

        agent_id = m.group(1).replace("AG", "AG-")
        rule = boundaries.get(agent_id)
        if not rule:
            results.append(SyncResult(agent_id, md_file, None, None, "skipped", "Agent not found in boundaries"))
            continue

        module_dir = parse_module_dir_from_working_dir(rule.get("working_dir", ""))
        if not module_dir:
            results.append(SyncResult(agent_id, md_file, None, None, "skipped", "No module working_dir found"))
            continue

        target_agent_dir = root / module_dir / "agent"
        target_agent_dir.mkdir(parents=True, exist_ok=True)

        target_md = target_agent_dir / ".agent.md"
        target_json = target_agent_dir / ".agent.json"

        markdown = md_file.read_text(encoding="utf-8")
        target_md.write_text(markdown if markdown.endswith("\n") else markdown + "\n", encoding="utf-8")

        payload = build_agent_json(agent_id, str(md_file.relative_to(root)).replace("\\", "/"), markdown, module_dir)
        target_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        results.append(SyncResult(agent_id, md_file, target_md, target_json, "synced"))

    synced = [r for r in results if r.status == "synced"]
    skipped = [r for r in results if r.status != "synced"]

    print(f"[AG-00] Canonical agent sync completed. Synced={len(synced)} Skipped={len(skipped)}")
    for r in synced:
        print(f"[SYNC] {r.agent_id}: {r.target_md.relative_to(root)} | {r.target_json.relative_to(root)}")
    for r in skipped:
        print(f"[SKIP] {r.agent_id}: {r.message} ({r.canonical.relative_to(root)})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

