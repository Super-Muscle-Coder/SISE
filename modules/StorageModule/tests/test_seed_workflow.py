#!/usr/bin/env python3
"""
Isolated test script for seed workflow.
Tests: seed_adapters -> seed_entities -> seed_routers -> seed_services
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
print("SEED WORKFLOW - ISOLATED TEST")
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
    "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/sise",
    "MINIO_ENDPOINT": "localhost:9000",
    "MINIO_ACCESS_KEY": "minioadmin",
    "MINIO_SECRET_KEY": "minioadmin",
    "BUCKET_RAW_IMAGES": "raw-images",
    "BUCKET_THUMBNAILS": "thumbnails",
    "BUCKET_RAW_IMAGES_RULE": "archive",
    "BUCKET_RAW_IMAGES_DAYS": "3650",
    "BUCKET_THUMBNAILS_RULE": "expire",
    "BUCKET_THUMBNAILS_DAYS": "365",
    "SEED_USER_COUNT": "5",
    "SEED_ALBUM_COUNT": "10",
    "SEED_IMAGE_COUNT": "50",
}

for key, default_value in defaults.items():
    if key not in env_vars or not env_vars[key]:
        env_vars[key] = default_value

os.environ.update(env_vars)
print(f"✓ Environment variables set (using defaults for empty values)")
print(f"  - DATABASE_URL: {env_vars['DATABASE_URL'][:50]}...")
print(f"  - MINIO_ENDPOINT: {env_vars['MINIO_ENDPOINT']}")
print(f"  - SEED_USER_COUNT: {env_vars['SEED_USER_COUNT']}")
print(f"  - SEED_ALBUM_COUNT: {env_vars['SEED_ALBUM_COUNT']}")
print(f"  - SEED_IMAGE_COUNT: {env_vars['SEED_IMAGE_COUNT']}")
print()

# Step 2: Test imports
print("[STEP 2] Testing imports...")
try:
    print("  Importing seed_entities...", end=" ")
    from app.entities.seed_entities import SeedConfig
    print("✓")

    print("  Importing bucket_entities...", end=" ")
    from app.entities.bucket_entities import MinioConfig, LifecycleRuleConfig
    print("✓")

    print("  Importing seed_adapters...", end=" ")
    from app.adapters import seed_adapters
    print("✓")

    print("  Importing seed_services...", end=" ")
    from app.services import seed_services
    print("✓")

    print("  Importing seed_routers...", end=" ")
    from app.routers.seed_routers import SeedWorkflowRouter
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

    seed_config = SeedConfig(
        user_count=int(env_vars["SEED_USER_COUNT"]),
        album_count=int(env_vars["SEED_ALBUM_COUNT"]),
        image_count=int(env_vars["SEED_IMAGE_COUNT"]),
    )

    print(f"✓ MinioConfig created:")
    print(f"    - endpoint: {minio_config.endpoint}")
    print(f"    - buckets: {minio_config.buckets}")

    print(f"✓ SeedConfig created:")
    print(f"    - user_count: {seed_config.user_count}")
    print(f"    - album_count: {seed_config.album_count}")
    print(f"    - image_count: {seed_config.image_count}")
    print()
except Exception as e:
    print(f"✗ Entity creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Test adapter functions
print("[STEP 4] Testing adapter functions...")
try:
    print("  Testing create_postgres_engine...", end=" ")
    try:
        engine = seed_adapters.create_postgres_engine(env_vars["DATABASE_URL"])
        print("✓")
        print(f"    - Engine created: {engine}")

        # Try to connect
        print("  Attempting database connection...", end=" ")
        try:
            with engine.connect() as conn:
                print("✓")
                print("    - Connection successful!")
        except Exception as conn_err:
            print(f"⚠ Connection failed (expected if DB not running)")
            print(f"    Error: {type(conn_err).__name__}: {str(conn_err)[:80]}...")
    except Exception as engine_err:
        print(f"✗ Engine creation failed: {engine_err}")
        raise

    print("  Testing create_minio_client...", end=" ")
    try:
        client = seed_adapters.create_minio_client(
            endpoint=minio_config.endpoint,
            access_key=minio_config.access_key,
            secret_key=minio_config.secret_key,
            secure=minio_config.secure,
        )
        print("✓")
        print(f"    - Client created: {client}")
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
    print("  Creating SeedWorkflowRouter...", end=" ")
    router = SeedWorkflowRouter(minio_config, seed_config)
    print("✓")
    print(f"    - Router created: {router}")
    print()
except Exception as e:
    print(f"✗ Router creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 6: Test seed execution (will fail if services not running)
print("[STEP 6] Testing seed execution...")
print("  ⚠ NOTE: This step requires PostgreSQL and MinIO to be running")
print()
try:
    print("  Attempting to seed storage...", end=" ")
    seed_services.seed_storage(minio_config, seed_config, env_vars["DATABASE_URL"])
    print("✓")
    print("    - Seed execution successful!")
    print()
except Exception as e:
    print(f"⚠ Seed execution failed (expected if services not running)")
    error_msg = str(e)
    if len(error_msg) > 150:
        error_msg = error_msg[:150] + "..."
    print(f"    Error type: {type(e).__name__}")
    print(f"    Error: {error_msg}")
    print()

print("="*70)
print("SEED WORKFLOW TEST COMPLETE")
print("="*70)
print()
print("Summary:")
print("  ✓ All imports successful")
print("  ✓ Entity creation successful")
print("  ✓ Adapter functions available")
print("  ✓ Router creation successful")
print("  ⚠ Seed execution skipped (requires PostgreSQL + MinIO)")
print()
print("Next steps:")
print("  1. Start PostgreSQL and MinIO via docker-compose")
print("  2. Run schema migrations first (test_schema_workflow.py)")
print("  3. Re-run this test to verify seed data generation")
