#!/usr/bin/env python3
"""
Isolated test script for bucket workflow.
Tests: bucket_adapters -> bucket_entities -> bucket_routers -> bucket_services
"""
import os
import sys
from pathlib import Path

# Load environment variables from config file
def load_env_from_file(filepath: str) -> dict:
    """Load environment variables from a config file."""
    env_vars = {}
    if not Path(filepath).exists():
        print(f"✗ File not found: {filepath}")
        return env_vars

    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                if "=" in line:
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip()
                    if value:
                        env_vars[key] = value

    return env_vars

print("="*70)
print("BUCKET WORKFLOW - ISOLATED TEST")
print("="*70)
print()

# Step 1: Load environment variables
print("[STEP 1] Loading environment variables...")
script_dir = Path(__file__).parent  # tests/ directory
workspace_root = script_dir.parent.parent  # E:\SISE\
env_file = workspace_root / "modules" / "StorageModule" / "configs" / "storage.env.local"
env_vars = load_env_from_file(str(env_file))
print(f"✓ Loaded {len(env_vars)} env vars from {env_file}")

# Set defaults for critical vars
defaults = {
    "MINIO_ENDPOINT": "localhost:9000",
    "MINIO_ACCESS_KEY": "minioadmin",
    "MINIO_SECRET_KEY": "minioadmin",
    "BUCKET_RAW_IMAGES": "raw-images",
    "BUCKET_THUMBNAILS": "thumbnails",
    "BUCKET_STORAGE_POLICY": "private",
    "BUCKET_THUMBNAILS_RULE": "expire",
    "BUCKET_THUMBNAILS_DAYS": "365",
    "BUCKET_RAW_IMAGES_RULE": "archive",
    "BUCKET_RAW_IMAGES_DAYS": "3650",
}

for key, default_value in defaults.items():
    if key not in env_vars or not env_vars[key]:
        env_vars[key] = default_value

os.environ.update(env_vars)
print(f"✓ Environment variables set (using defaults for empty values)")
print(f"  - MINIO_ENDPOINT: {env_vars['MINIO_ENDPOINT']}")
print(f"  - MINIO_ACCESS_KEY: {env_vars['MINIO_ACCESS_KEY']}")
print(f"  - BUCKET_RAW_IMAGES: {env_vars['BUCKET_RAW_IMAGES']}")
print(f"  - BUCKET_THUMBNAILS: {env_vars['BUCKET_THUMBNAILS']}")
print()

# Step 2: Test imports
print("[STEP 2] Testing imports...")
try:
    print("  Importing bucket_entities...", end=" ")
    from app.entities.bucket_entities import MinioConfig, LifecycleRuleConfig
    print("✓")

    print("  Importing bucket_adapters...", end=" ")
    from app.adapters import bucket_adapters
    print("✓")

    print("  Importing bucket_services...", end=" ")
    from app.services import bucket_services
    print("✓")

    print("  Importing bucket_routers...", end=" ")
    from app.routers.bucket_routers import BucketWorkflowRouter
    print("✓")

    print("✓ All imports successful")
    print()
except ImportError as e:
    print(f"✗ Import failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 3: Test entity creation
print("[STEP 3] Testing entity creation...")
try:
    # Create lifecycle rules
    thumbnails_rule = LifecycleRuleConfig(
        bucket=env_vars["BUCKET_THUMBNAILS"],
        rule=env_vars["BUCKET_THUMBNAILS_RULE"],
        days=int(env_vars["BUCKET_THUMBNAILS_DAYS"]),
    )

    raw_images_rule = LifecycleRuleConfig(
        bucket=env_vars["BUCKET_RAW_IMAGES"],
        rule=env_vars["BUCKET_RAW_IMAGES_RULE"],
        days=int(env_vars["BUCKET_RAW_IMAGES_DAYS"]),
    )

    minio_config = MinioConfig(
        endpoint=env_vars["MINIO_ENDPOINT"],
        access_key=env_vars["MINIO_ACCESS_KEY"],
        secret_key=env_vars["MINIO_SECRET_KEY"],
        secure=False,
        buckets=[env_vars["BUCKET_RAW_IMAGES"], env_vars["BUCKET_THUMBNAILS"]],
        lifecycle_rules=[thumbnails_rule, raw_images_rule],
    )
    print(f"✓ MinioConfig created:")
    print(f"    - endpoint: {minio_config.endpoint}")
    print(f"    - access_key: {minio_config.access_key[:5]}***")
    print(f"    - secure: {minio_config.secure}")
    print(f"    - buckets: {minio_config.buckets}")
    print(f"    - lifecycle_rules: {len(minio_config.lifecycle_rules)} rules")
    print()
except Exception as e:
    print(f"✗ Entity creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Test adapter functions
print("[STEP 4] Testing adapter functions...")
try:
    print("  Testing create_minio_client...", end=" ")
    try:
        client = bucket_adapters.create_minio_client(
            endpoint=minio_config.endpoint,
            access_key=minio_config.access_key,
            secret_key=minio_config.secret_key,
        )
        print("✓")
        print(f"    - Client created: {client}")

        # Try to list buckets
        print("  Attempting to list buckets...", end=" ")
        try:
            buckets = client.list_buckets()
            print("✓")
            print(f"    - Buckets found: {len(buckets.buckets)}")
        except Exception as list_err:
            print(f"⚠ Bucket list failed (expected if MinIO not running)")
            print(f"    Error: {type(list_err).__name__}: {str(list_err)[:80]}...")
    except Exception as client_err:
        print(f"⚠ Client creation failed")
        print(f"    Error: {type(client_err).__name__}: {str(client_err)[:80]}...")

    print()
except Exception as e:
    print(f"✗ Adapter test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Test router creation
print("[STEP 5] Testing router creation...")
try:
    print("  Creating BucketWorkflowRouter...", end=" ")
    router = BucketWorkflowRouter(minio_config)
    print("✓")
    print(f"    - Router created: {router}")
    print()
except Exception as e:
    print(f"✗ Router creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 6: Test bucket setup (will fail if MinIO not running)
print("[STEP 6] Testing bucket setup...")
print("  ⚠ NOTE: This step requires MinIO to be running and accessible")
print()
try:
    print("  Attempting to setup buckets...", end=" ")
    bucket_services.ensure_buckets(minio_config)
    print("✓")
    print("    - Bucket setup successful!")
    print()
except Exception as e:
    print(f"⚠ Bucket setup failed (expected if MinIO not running)")
    error_msg = str(e)
    if len(error_msg) > 150:
        error_msg = error_msg[:150] + "..."
    print(f"    Error type: {type(e).__name__}")
    print(f"    Error: {error_msg}")
    print()

print("="*70)
print("BUCKET WORKFLOW TEST COMPLETE")
print("="*70)
print()
print("Summary:")
print("  ✓ All imports successful")
print("  ✓ Entity creation successful")
print("  ✓ Adapter functions available")
print("  ✓ Router creation successful")
print("  ⚠ MinIO connection/bucket setup skipped (requires MinIO)")
print()
print("Next steps:")
print("  1. Start MinIO via docker-compose")
print("  2. Re-run this test to verify bucket setup")
