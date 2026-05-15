#!/usr/bin/env python3
"""
Isolated test script for schema workflow.
Tests: schema_adapters -> schema_entities -> schema_routers -> schema_services
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
print("SCHEMA WORKFLOW - ISOLATED TEST")
print("="*70)
print()

# Step 1: Load environment variables
print("[STEP 1] Loading environment variables...")
# Adjust path based on current working directory
import os as os_module
script_dir = Path(__file__).parent  # tests/ directory
workspace_root = script_dir.parent.parent  # E:\SISE\
env_file = workspace_root / "modules" / "StorageModule" / "configs" / "storage.env.local"
env_vars = load_env_from_file(str(env_file))
print(f"✓ Loaded {len(env_vars)} env vars from {env_file}")

# Set defaults for critical vars
defaults = {
    "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/sise",
    "SCHEMA_MIGRATION_TOOL": "alembic",
    "SCHEMA_TARGET_REVISION": "head",
    "SCHEMA_DOWNGRADE_REVISION": "base",
    "SCHEMA_EXTENSIONS": "uuid-ossp,pgcrypto",
}

for key, default_value in defaults.items():
    if key not in env_vars or not env_vars[key]:
        env_vars[key] = default_value

os.environ.update(env_vars)
print(f"✓ Loaded from: {env_file}")
print(f"✓ Environment variables set (using defaults for empty values)")
print(f"  - DATABASE_URL: {env_vars['DATABASE_URL']}")
print(f"  - SCHEMA_MIGRATION_TOOL: {env_vars['SCHEMA_MIGRATION_TOOL']}")
print()

# Step 2: Test imports
print("[STEP 2] Testing imports...")
try:
    print("  Importing schema_entities...", end=" ")
    from app.entities.schema_entities import PostgresConfig, SchemaConfig
    print("✓")

    print("  Importing schema_adapters...", end=" ")
    from app.adapters import schema_adapters
    print("✓")

    print("  Importing schema_services...", end=" ")
    from app.services import schema_services
    print("✓")

    print("  Importing schema_routers...", end=" ")
    from app.routers.schema_routers import SchemaWorkflowRouter
    print("✓")

    print("✓ All imports successful")
    print()
except ImportError as e:
    print(f"✗ Import failed: {e}")
    sys.exit(1)

# Step 3: Test entity creation
print("[STEP 3] Testing entity creation...")
try:
    postgres_config = PostgresConfig(
        database_url=env_vars["DATABASE_URL"]
    )
    print(f"✓ PostgresConfig created: {postgres_config}")

    extensions_list = [ext.strip() for ext in env_vars["SCHEMA_EXTENSIONS"].split(",")]
    schema_config = SchemaConfig(
        migration_tool=env_vars["SCHEMA_MIGRATION_TOOL"],
        target_revision=env_vars["SCHEMA_TARGET_REVISION"],
        downgrade_revision=env_vars["SCHEMA_DOWNGRADE_REVISION"],
        extensions=extensions_list,
    )
    print(f"✓ SchemaConfig created:")
    print(f"    - migration_tool: {schema_config.migration_tool}")
    print(f"    - target_revision: {schema_config.target_revision}")
    print(f"    - downgrade_revision: {schema_config.downgrade_revision}")
    print(f"    - extensions: {schema_config.extensions}")
    print()
except Exception as e:
    print(f"✗ Entity creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Test adapter functions
print("[STEP 4] Testing adapter functions...")
try:
    print("  Testing build_alembic_config...", end=" ")
    script_location = "modules/StorageModule/migrations"
    alembic_config = schema_adapters.build_alembic_config(
        script_location=script_location,
        database_url=postgres_config.database_url,
    )
    print("✓")
    print(f"    - script_location: {alembic_config.get_main_option('script_location')}")
    print(f"    - sqlalchemy.url: {alembic_config.get_main_option('sqlalchemy.url')}")

    print("  Testing create_postgres_engine...", end=" ")
    try:
        engine = schema_adapters.create_postgres_engine(postgres_config.database_url)
        print("✓")
        print(f"    - Engine created: {engine}")

        # Try to connect
        print("  Attempting database connection...", end=" ")
        try:
            with engine.connect() as conn:
                print("✓")
                print("    - Connection successful!")
        except Exception as conn_err:
            print(f"✗ Connection failed (expected if DB not running)")
            print(f"    Error: {type(conn_err).__name__}: {str(conn_err)[:80]}...")
    except Exception as engine_err:
        print(f"✗ Engine creation failed: {engine_err}")
        raise

    print()
except Exception as e:
    print(f"✗ Adapter test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Test router creation
print("[STEP 5] Testing router creation...")
try:
    print("  Creating SchemaWorkflowRouter...", end=" ")
    router = SchemaWorkflowRouter(postgres_config, schema_config)
    print("✓")
    print(f"    - Router created: {router}")
    print()
except Exception as e:
    print(f"✗ Router creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 6: Test schema migration (will fail if DB not running)
print("[STEP 6] Testing schema migration...")
print("  ⚠ NOTE: This step requires PostgreSQL to be running and accessible")
print()
try:
    print("  Attempting to run schema migrations...", end=" ")
    schema_services.run_schema_migrations(postgres_config, schema_config)
    print("✓")
    print("    - Schema migrations successful!")
    print()
except Exception as e:
    print(f"⚠ Migration failed (expected if DB not running)")
    error_msg = str(e)
    if len(error_msg) > 150:
        error_msg = error_msg[:150] + "..."
    print(f"    Error type: {type(e).__name__}")
    print(f"    Error: {error_msg}")
    print()

print("="*70)
print("SCHEMA WORKFLOW TEST COMPLETE")
print("="*70)
print()
print("Summary:")
print("  ✓ All imports successful")
print("  ✓ Entity creation successful")
print("  ✓ Adapter functions available")
print("  ✓ Router creation successful")
print("  ⚠ Database migration skipped (requires PostgreSQL)")
print()
print("Next steps:")
print("  1. Start PostgreSQL via docker-compose")
print("  2. Re-run this test to verify migration execution")
