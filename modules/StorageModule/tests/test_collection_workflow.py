#!/usr/bin/env python3
"""
Isolated test script for collection workflow.
Tests: collection_adapters -> collection_entities -> collection_routers -> collection_services
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
print("COLLECTION WORKFLOW - ISOLATED TEST")
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
    "MILVUS_HOST": "localhost",
    "MILVUS_PORT": "19530",
    "COLLECTION_NAME": "sise_v1",
    "COLLECTION_VECTOR_DIM": "512",
    "COLLECTION_METRIC_TYPE": "COSINE",
    "COLLECTION_INDEX_TYPE": "HNSW",
    "COLLECTION_INDEX_M": "16",
    "COLLECTION_INDEX_EF_CONSTRUCTION": "200",
    "COLLECTION_SEARCH_EF": "64",
}

for key, default_value in defaults.items():
    if key not in env_vars or not env_vars[key]:
        env_vars[key] = default_value

os.environ.update(env_vars)
print(f"✓ Environment variables set (using defaults for empty values)")
print(f"  - MILVUS_HOST: {env_vars['MILVUS_HOST']}")
print(f"  - MILVUS_PORT: {env_vars['MILVUS_PORT']}")
print(f"  - COLLECTION_NAME: {env_vars['COLLECTION_NAME']}")
print(f"  - COLLECTION_VECTOR_DIM: {env_vars['COLLECTION_VECTOR_DIM']}")
print()

# Step 2: Test imports
print("[STEP 2] Testing imports...")
try:
    print("  Importing collection_entities...", end=" ")
    from app.entities.collection_entities import MilvusConfig
    print("✓")

    print("  Importing collection_adapters...", end=" ")
    from app.adapters import collection_adapters
    print("✓")

    print("  Importing collection_services...", end=" ")
    from app.services import collection_services
    print("✓")

    print("  Importing collection_routers...", end=" ")
    from app.routers.collection_routers import CollectionWorkflowRouter
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
    # Build index_params and search_params as dicts
    index_params = {
        "index_type": env_vars["COLLECTION_INDEX_TYPE"],
        "metric_type": env_vars["COLLECTION_METRIC_TYPE"],
        "params": {
            "M": int(env_vars["COLLECTION_INDEX_M"]),
            "efConstruction": int(env_vars["COLLECTION_INDEX_EF_CONSTRUCTION"]),
        }
    }

    search_params = {
        "metric_type": env_vars["COLLECTION_METRIC_TYPE"],
        "params": {
            "ef": int(env_vars["COLLECTION_SEARCH_EF"]),
        }
    }

    milvus_config = MilvusConfig(
        host=env_vars["MILVUS_HOST"],
        port=int(env_vars["MILVUS_PORT"]),
        collection_name=env_vars["COLLECTION_NAME"],
        vector_dim=int(env_vars["COLLECTION_VECTOR_DIM"]),
        metric_type=env_vars["COLLECTION_METRIC_TYPE"],
        index_params=index_params,
        search_params=search_params,
    )
    print(f"✓ MilvusConfig created:")
    print(f"    - host: {milvus_config.host}")
    print(f"    - port: {milvus_config.port}")
    print(f"    - collection_name: {milvus_config.collection_name}")
    print(f"    - vector_dim: {milvus_config.vector_dim}")
    print(f"    - metric_type: {milvus_config.metric_type}")
    print(f"    - index_params: {milvus_config.index_params}")
    print(f"    - search_params: {milvus_config.search_params}")
    print()
except Exception as e:
    print(f"✗ Entity creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Test adapter functions
print("[STEP 4] Testing adapter functions...")
try:
    print("  Testing connect_to_milvus...", end=" ")
    try:
        connection = collection_adapters.connect_to_milvus(
            host=milvus_config.host,
            port=milvus_config.port,
        )
        print("✓")
        print(f"    - Connection: {connection}")
    except Exception as milvus_conn_err:
        print(f"⚠ Connection failed (expected if Milvus not running)")
        print(f"    Error: {type(milvus_conn_err).__name__}: {str(milvus_conn_err)[:80]}...")

    print("  Testing build_collection_fields...", end=" ")
    fields = collection_adapters.build_collection_fields(milvus_config.vector_dim)
    print("✓")
    print(f"    - Fields created: {len(fields)} fields")
    for field in fields:
        print(f"      - {field.name}: {field.dtype}")

    print()
except Exception as e:
    print(f"✗ Adapter test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Test router creation
print("[STEP 5] Testing router creation...")
try:
    print("  Creating CollectionWorkflowRouter...", end=" ")
    router = CollectionWorkflowRouter(milvus_config)
    print("✓")
    print(f"    - Router created: {router}")
    print()
except Exception as e:
    print(f"✗ Router creation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 6: Test collection setup (will fail if Milvus not running)
print("[STEP 6] Testing collection setup...")
print("  ⚠ NOTE: This step requires Milvus to be running and accessible")
print()
try:
    print("  Attempting to setup collection...", end=" ")
    collection_services.ensure_collection(milvus_config)
    print("✓")
    print("    - Collection setup successful!")
    print()
except Exception as e:
    print(f"⚠ Collection setup failed (expected if Milvus not running)")
    error_msg = str(e)
    if len(error_msg) > 150:
        error_msg = error_msg[:150] + "..."
    print(f"    Error type: {type(e).__name__}")
    print(f"    Error: {error_msg}")
    print()

print("="*70)
print("COLLECTION WORKFLOW TEST COMPLETE")
print("="*70)
print()
print("Summary:")
print("  ✓ All imports successful")
print("  ✓ Entity creation successful")
print("  ✓ Adapter functions available")
print("  ✓ Collection fields built successfully")
print("  ✓ Router creation successful")
print("  ⚠ Milvus connection skipped (requires Milvus)")
print()
print("Next steps:")
print("  1. Start Milvus via docker-compose")
print("  2. Re-run this test to verify collection setup")
