"""
StorageModule — App Package

Organized by workflow-centric 5-layer architecture:
  configs → entities → adapters → services → routers

Build-time verification: When app package is imported, all critical modules
are validated to ensure no circular dependencies or import errors exist.
This happens automatically during Docker build when we run: python -c "import app"
"""

# Build-time import verification (runs when this package is imported)
# Ensures all routers can load, which triggers full dependency chain validation
try:
    from .routers.schema_routers import SchemaWorkflowRouter  # noqa: F401
    from .routers.collection_routers import PgvectorIndexWorkflowRouter  # noqa: F401
    from .routers.bucket_routers import BucketWorkflowRouter  # noqa: F401
    from .routers.seed_routers import SeedWorkflowRouter  # noqa: F401
except ImportError as e:
    raise RuntimeError(f"Critical import failure in StorageModule: {e}") from e