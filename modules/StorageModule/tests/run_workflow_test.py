#!/usr/bin/env python3
"""Load env vars from config file and test all StorageModule workflows."""
import os
import sys
import subprocess
from pathlib import Path

def load_env_from_file(filepath: str) -> dict:
    """Load environment variables from a config file."""
    env_vars = {}
    if not Path(filepath).exists():
        print(f"✗ File not found: {filepath}")
        return env_vars

    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip empty lines and comments
            if line and not line.startswith("#"):
                if "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()
                    if value:  # Only set if value is not empty
                        env_vars[key] = value

    return env_vars

def main():
    # Load from config file
    env_file = "modules/StorageModule/configs/storage.env.local"
    env_vars = load_env_from_file(env_file)
    print(f"✓ Loaded {len(env_vars)} environment variables from {env_file}\n")

    # Set defaults for empty/missing env vars
    defaults = {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/sise",
        "MINIO_ENDPOINT": "localhost:9000",
        "MINIO_ACCESS_KEY": "minioadmin",
        "MINIO_SECRET_KEY": "minioadmin",
        "MILVUS_HOST": "localhost",
        "MILVUS_PORT": "19530",
        "REDIS_URL": "redis://localhost:6379",
    }

    for key, default_value in defaults.items():
        if key not in env_vars or not env_vars[key]:
            env_vars[key] = default_value
            print(f"  {key} set to default: {default_value}")

    # Update os.environ with all loaded vars
    os.environ.update(env_vars)

    print("\n" + "="*50)
    print("Testing StorageModule Workflows with Python 3.13")
    print("="*50 + "\n")

    workflows = ["schema", "collection", "bucket", "seed"]
    results = {}

    for i, workflow in enumerate(workflows, 1):
        print(f"{i}. Testing {workflow.upper()} workflow...")
        try:
            result = subprocess.run(
                [sys.executable, "modules/StorageModule/storage_main.py", workflow],
                cwd=".",
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                print(f"   ✓ SUCCESS")
                results[workflow] = "SUCCESS"
                if result.stdout:
                    for line in result.stdout.split('\n')[:5]:
                        if line.strip():
                            print(f"     {line}")
            else:
                print(f"   ✗ FAILED (exit code: {result.returncode})")
                results[workflow] = "FAILED"
                if result.stderr:
                    for line in result.stderr.split('\n')[:10]:
                        if line.strip():
                            print(f"     {line}")
        except subprocess.TimeoutExpired:
            print(f"   ✗ TIMEOUT")
            results[workflow] = "TIMEOUT"
        except Exception as e:
            print(f"   ✗ ERROR: {e}")
            results[workflow] = "ERROR"

        print()

    print("="*50)
    print("Workflow Test Results Summary:")
    print("="*50)
    for workflow, status in results.items():
        status_symbol = "✓" if status == "SUCCESS" else "✗"
        print(f"  {status_symbol} {workflow.upper()}: {status}")
    print()

if __name__ == "__main__":
    main()
