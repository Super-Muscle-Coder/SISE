# Schema Workflow - References

**Mục đích**: Danh sách chi tiết các tệp, thư mục, API, config của Schema Workflow. Sử dụng để tra cứu nhanh, định vị file, tìm API reference.

**Thời gian tra cứu**: 5-10 phút (lookup)

---

## 1. Directory Structure

### 1.1 Full Tree View

```
modules/StorageModule/
├── app/
│   ├── entities/
│   │   ├── schema_entities.py              ← PostgresConfig, SchemaConfig
│   │   └── __init__.py
│   ├── adapters/
│   │   ├── schema_adapters.py              ← Alembic wrapper functions
│   │   └── __init__.py
│   ├── services/
│   │   ├── schema_services.py              ← Orchestration logic
│   │   └── __init__.py
│   ├── routers/
│   │   ├── schema_routers.py               ← SchemaWorkflowRouter (public API)
│   │   └── __init__.py
│   └── __init__.py
├── configs/
│   ├── storage.env.example                 ← Template env file
│   ├── storage.env.local                   ← Dev environment
│   └── storage.env.staging                 ← Staging environment
├── migrations/
│   ├── alembic.ini                         ← Alembic configuration
│   ├── env.py                              ← Alembic runtime environment
│   ├── script.py.mako                      ← Alembic template for auto-generation
│   └── versions/
│       ├── 001_initial_schema.py           ← First migration (tables)
│       ├── 002_add_indexes.py              ← Second migration (indexes)
│       └── ...
├── tests/
│   ├── adapters/
│   │   └── test_schema_adapters.py         ← Unit tests for adapter
│   ├── services/
│   │   └── test_schema_services.py         ← Unit tests for service
│   ├── routers/
│   │   └── test_schema_routers.py          ← Unit tests for router
│   ├── integration/
│   │   └── test_schema_integration.py      ← Integration tests
│   └── __init__.py
├── scripts/
│   ├── setup_schema.py                     ← Main setup script (entry point)
│   ├── validate_schema.py                  ← Validation script
│   └── run_schema_tests.ps1                ← PowerShell test runner
├── documents/
│   └── schema_workflow/
│       ├── SCHEMA_WORKFLOW_QUICK_GUIDE.md  ← Quick overview
│       ├── SCHEMA_WORKFLOW_DEEP_GUIDE.md   ← Detailed guide
│       └── SCHEMA_WORKFLOW_REFERENCES.md   ← This file
├── logs/
│   └── schema_setup.log                    ← Setup logs
├── README.md
└── storage_main.py                         ← Module entry point
```

### 1.2 Component-wise Tree View

```
Schema Workflow Components:

Config Layer:
├── configs/storage.env.local               - Dev environment variables
├── configs/storage.env.staging             - Staging environment variables
└── configs/storage.env.example             - Template (what env vars needed)

Entity Layer:
├── app/entities/schema_entities.py
│   ├── PostgresConfig(frozen=True)         - Immutable config for DB connection
│   └── SchemaConfig(frozen=True)           - Immutable config for migrations
└── app/entities/__init__.py                - Exports: [PostgresConfig, SchemaConfig]

Adapter Layer:
├── app/adapters/schema_adapters.py
│   ├── build_alembic_config()              - Create Alembic Config from params
│   ├── run_upgrade()                       - Execute migrations (upgrade)
│   ├── run_downgrade()                     - Execute migrations (downgrade)
│   ├── create_postgres_engine()            - Create SQLAlchemy engine
│   └── __all__ = [...]
└── app/adapters/__init__.py                - Exports adapter functions

Service Layer:
├── app/services/schema_services.py
│   ├── run_schema_migrations()             - Main orchestration (upgrade workflow)
│   ├── downgrade_schema()                  - Downgrade workflow
│   └── _resolve_migration_path()           - Helper to find migrations folder
└── app/services/__init__.py                - Exports: [run_schema_migrations]

Router Layer:
├── app/routers/schema_routers.py
│   ├── SchemaWorkflowRouter(class)         - Public API class
│   │   ├── __init__(postgres_config, schema_config)
│   │   ├── upgrade_schema()                - Trigger upgrade
│   │   └── downgrade_schema()              - Trigger downgrade
│   └── __all__ = ['SchemaWorkflowRouter']
└── app/routers/__init__.py                 - Exports: [SchemaWorkflowRouter]

Migration Definitions:
├── migrations/
│   ├── alembic.ini                         - Alembic configuration file
│   ├── env.py                              - Alembic runtime setup
│   ├── script.py.mako                      - Migration template
│   └── versions/
│       ├── 001_initial_schema.py           - Tables creation
│       ├── 002_add_indexes.py              - Indexes creation
│       ├── 003_add_extensions.py           - PostgreSQL extensions
│       └── ...
Tests:
├── tests/adapters/test_schema_adapters.py
├── tests/services/test_schema_services.py
├── tests/routers/test_schema_routers.py
├── tests/integration/test_schema_integration.py
└── tests/__init__.py

Scripts & Utilities:
├── scripts/setup_schema.py                 - Main entry point for setup
├── scripts/validate_schema.py              - Validation script
└── scripts/run_schema_tests.ps1            - Test runner (PowerShell)

Documentation:
├── documents/schema_workflow/
│   ├── SCHEMA_WORKFLOW_QUICK_GUIDE.md
│   ├── SCHEMA_WORKFLOW_DEEP_GUIDE.md
│   └── SCHEMA_WORKFLOW_REFERENCES.md
└── README.md - Module overview
```

---

## 2. File Inventory

### 2.1 Configuration Files

| File Path | File Name | Type | Owner | Purpose | Version | Last Updated |
|-----------|-----------|------|-------|---------|---------|-------------|
| `configs/storage.env.example` | storage.env.example | Env Template | StorageModule | Template showing all env vars needed | 1.0 | 2026-01-15 |
| `configs/storage.env.local` | storage.env.local | Env Vars | Developer | Local development DATABASE_URL, migration tool, target revision | N/A | On change |
| `configs/storage.env.staging` | storage.env.staging | Env Vars | DevOps | Staging DATABASE_URL, production-like settings | N/A | On change |
| `migrations/alembic.ini` | alembic.ini | Alembic Config | StorageModule | Alembic configuration (logging, encoding, etc.) | 1.12+ | 2026-01-15 |

### 2.2 Entity Layer Files

| File Path | Class/Function | Type | Purpose | Imports | Exports (__all__) |
|-----------|----------------|------|---------|---------|-----------------|
| `app/entities/schema_entities.py` | PostgresConfig | Dataclass | Immutable config for PostgreSQL connection (database_url) | dataclasses | ['PostgresConfig', 'SchemaConfig'] |
| `app/entities/schema_entities.py` | SchemaConfig | Dataclass | Immutable config for schema migrations (migration_tool, target_revision, downgrade_revision, extensions) | dataclasses, typing | (same) |

### 2.3 Adapter Layer Files

| File Path | Function Name | Type | External System | Purpose | Key Functions |
|-----------|---------------|------|-----------------|---------|------------|
| `app/adapters/schema_adapters.py` | build_alembic_config() | Function | Alembic | Create Alembic Config from script_location and database_url | Accepts (script_location: str, database_url: str) → Config |
| `app/adapters/schema_adapters.py` | run_upgrade() | Function | Alembic | Execute upgrade migrations to target revision | Accepts (config: Config, revision: str) → None |
| `app/adapters/schema_adapters.py` | run_downgrade() | Function | Alembic | Execute downgrade migrations to target revision | Accepts (config: Config, revision: str) → None |
| `app/adapters/schema_adapters.py` | create_postgres_engine() | Function | SQLAlchemy | Create engine for PostgreSQL connections | Accepts (database_url: str) → Engine |

### 2.4 Service Layer Files

| File Path | Function Name | Type | Purpose | Depends On | Key Methods |
|-----------|---------------|------|---------|-----------|------------|
| `app/services/schema_services.py` | run_schema_migrations() | Function | Main orchestration for schema upgrade workflow | schema_adapters, PostgresConfig, SchemaConfig | Accepts (postgres_config: PostgresConfig, schema_config: SchemaConfig) → None |
| `app/services/schema_services.py` | downgrade_schema() | Function | Orchestration for schema downgrade/rollback | schema_adapters, PostgresConfig, SchemaConfig | Accepts (postgres_config: PostgresConfig, schema_config: SchemaConfig) → None |
| `app/services/schema_services.py` | _resolve_migration_path() | Function | Helper to find migrations folder path | pathlib, os | Returns str (absolute path to /migrations) |

### 2.5 Router Layer Files

| File Path | Class/Function | Type | Purpose | Depends On | Exposed APIs |
|-----------|----------------|------|---------|-----------|------------|
| `app/routers/schema_routers.py` | SchemaWorkflowRouter | Class | Public API class for schema workflow | SchemaService, PostgresConfig, SchemaConfig | upgrade_schema(), downgrade_schema() |

### 2.6 Test Files

| File Path | Test Class | Scope | Tests What | Fixtures Used | Coverage Target |
|-----------|-----------|-------|-----------|-------------|-----------------|
| `tests/adapters/test_schema_adapters.py` | TestSchemaAdapters | Unit | build_alembic_config(), run_upgrade(), run_downgrade(), create_postgres_engine() | mock_alembic, mock_sqlalchemy | 95% |
| `tests/services/test_schema_services.py` | TestSchemaServices | Unit | run_schema_migrations(), downgrade_schema() orchestration | mock_adapter, mock_config | 90% |
| `tests/routers/test_schema_routers.py` | TestSchemaRouter | Unit | SchemaWorkflowRouter initialization, upgrade/downgrade methods | mock_service | 85% |
| `tests/integration/test_schema_integration.py` | TestSchemaIntegration | Integration | Full workflow upgrade/downgrade with test PostgreSQL container | docker_postgres, real_config | 80% |

### 2.7 Script & Utility Files

| File Path | File Name | Type | Purpose | Usage |
|-----------|-----------|------|---------|-------|
| `scripts/setup_schema.py` | setup_schema.py | Python Script | Main entry point for schema setup | `python scripts/setup_schema.py --env local` |
| `scripts/validate_schema.py` | validate_schema.py | Python Script | Validate schema (check tables/indexes exist) | `python scripts/validate_schema.py --db-url postgresql://...` |
| `scripts/run_schema_tests.ps1` | run_schema_tests.ps1 | PowerShell | Test runner (Windows automation) | `powershell scripts/run_schema_tests.ps1 -TestFilter "schema"` |

### 2.8 Documentation Files

| File Path | File Name | Type | Purpose | Audience | Related Docs |
|-----------|-----------|------|---------|----------|------------|
| `documents/schema_workflow/SCHEMA_WORKFLOW_QUICK_GUIDE.md` | SCHEMA_WORKFLOW_QUICK_GUIDE.md | Documentation | Quick overview for newcomer (10-15 min) | Beginners | DEEP_GUIDE |
| `documents/schema_workflow/SCHEMA_WORKFLOW_DEEP_GUIDE.md` | SCHEMA_WORKFLOW_DEEP_GUIDE.md | Documentation | Detailed technical guide (45-60 min) | Specialists | QUICK_GUIDE, REFERENCES |
| `documents/schema_workflow/SCHEMA_WORKFLOW_REFERENCES.md` | SCHEMA_WORKFLOW_REFERENCES.md | Reference | File inventory, API reference, config schema | All devs | All source files |

---

## 3. Key Dependencies

### 3.1 External Package Dependencies

| Package | Version | Purpose | Used In | License |
|---------|---------|---------|---------|---------|
| alembic | >= 1.12 | Migration tool for database schema versioning | adapters/schema_adapters.py | MIT |
| sqlalchemy | >= 2.0 | ORM and database toolkit | adapters/schema_adapters.py | MIT |
| psycopg2-binary | >= 2.9 | PostgreSQL adapter for Python | Implicit (sqlalchemy uses) | BSD |
| python-dotenv | >= 1.0 | Load environment variables from .env | config loading | BSD |
| pytest | >= 7.0 | Testing framework | tests/* | MIT |
| pytest-cov | >= 4.0 | Coverage reporting | tests/* | MIT |

### 3.2 Internal Module Dependencies

```
Config Files (.env, alembic.ini)
	↓ (loaded by)
Entities (PostgresConfig, SchemaConfig)
	↓ (used by)
Adapters (schema_adapters: Alembic wrapper)
	↓ (used by)
Services (schema_services: orchestration)
	↓ (used by)
Routers (SchemaWorkflowRouter: public API)
	↓ (called by)
Scripts (setup_schema.py) + Tests + External callers
	↓ (operates on)
PostgreSQL Database + Migrations folder
```

### 3.3 Inter-workflow Dependencies

| Workflow | Dependency Type | Status | Description |
|----------|-----------------|--------|-------------|
| Collection Workflow | used-by | active | Collection depends on Schema (needs metadata tables) |
| Bucket Workflow | used-by | active | Bucket depends on Schema (needs privacy_level table) |
| Seed Workflow | used-by | active | Seed depends on Schema (needs all tables before seeding) |

---

## 4. Configuration Reference

### 4.1 Environment Variables (.env Files)

**File**: `configs/storage.env.local` (or `.staging`, `.prod`)

| Env Variable | Type | Required | Default | Purpose | Example |
|-------------|------|----------|---------|---------|---------|
| DATABASE_URL | String | Yes | N/A | PostgreSQL connection string (user:pass@host:port/db) | postgresql://postgres:password@localhost:5432/sise_db |
| MIGRATION_TOOL | String | No | alembic | Migration tool to use (only "alembic" supported) | alembic |
| TARGET_REVISION | String | No | head | Target migration revision to apply | head (latest) or "001_initial" |
| DOWNGRADE_REVISION | String | No | base | Revision to downgrade to (for rollback) | base (empty) or specific revision |
| SCRIPT_LOCATION | String | No | ./migrations | Path to Alembic migrations folder | /path/to/StorageModule/migrations |
| LOG_LEVEL | String | No | INFO | Logging level | DEBUG, INFO, WARNING, ERROR |

**Example `.env.local`**:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sise_dev
MIGRATION_TOOL=alembic
TARGET_REVISION=head
DOWNGRADE_REVISION=base
LOG_LEVEL=DEBUG
```

### 4.2 Alembic Configuration (alembic.ini)

**File**: `migrations/alembic.ini`

Key sections:
- `[alembic]`: Script location, file template
- `[loggers]`: Logging configuration
- `[handlers]`: Log handlers (console, file)

### 4.3 Migration File Template

**File**: `migrations/versions/*.py`

Structure:
```python
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
	# CREATE TABLE, CREATE INDEX, etc.
	op.create_table(
		'users',
		sa.Column('id', sa.Integer(), nullable=False),
		sa.Column('name', sa.String(), nullable=False),
		sa.PrimaryKeyConstraint('id')
	)

def downgrade():
	# DROP TABLE, DROP INDEX, etc. (reverse of upgrade)
	op.drop_table('users')
```

---

## 5. API Reference

### 5.1 Router/Public API Reference

**File**: `app/routers/schema_routers.py`

#### Class: SchemaWorkflowRouter

```python
class SchemaWorkflowRouter:
	def __init__(self, postgres_config: PostgresConfig, schema_config: SchemaConfig) -> None
	def upgrade_schema(self) -> None
	def downgrade_schema(self) -> None
```

##### Method: upgrade_schema()

```
Signature: upgrade_schema(self) -> None
```

**Description**: Trigger schema migration upgrade (create/update database schema to target revision)

**Parameters**: None (config passed during __init__)

**Returns**: None

**Raises**:
- `ValueError`: If migration_tool != "alembic"
- `ConnectionError`: If cannot connect to PostgreSQL
- `MigrationError`: If migration fails (syntax error, etc.)

**Example**:
```python
from app.entities.schema_entities import PostgresConfig, SchemaConfig
from app.routers.schema_routers import SchemaWorkflowRouter

config = PostgresConfig(database_url="postgresql://localhost/sise_db")
schema_config = SchemaConfig(
	migration_tool="alembic",
	target_revision="head",
	downgrade_revision="base",
	extensions=[]
)
router = SchemaWorkflowRouter(config, schema_config)
router.upgrade_schema()  # Creates schema
```

##### Method: downgrade_schema()

```
Signature: downgrade_schema(self) -> None
```

**Description**: Trigger schema migration downgrade (rollback database schema to target revision)

**Parameters**: None (config passed during __init__)

**Returns**: None

**Raises**: Same as `upgrade_schema()`

**Example**:
```python
router.downgrade_schema()  # Rolls back schema to downgrade_revision
```

### 5.2 Service API Reference

**File**: `app/services/schema_services.py`

#### Function: run_schema_migrations()

```python
def run_schema_migrations(postgres_config: PostgresConfig, schema_config: SchemaConfig) -> None
```

**Description**: Execute schema migration upgrade workflow

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| postgres_config | PostgresConfig | Yes | Config with database_url |
| schema_config | SchemaConfig | Yes | Config with migration tool, target revision |

**Returns**: None

**Raises**: ValueError, ConnectionError, MigrationError

**Example**:
```python
from app.services import schema_services
from app.entities.schema_entities import PostgresConfig, SchemaConfig

postgres_config = PostgresConfig(database_url="postgresql://localhost/sise_db")
schema_config = SchemaConfig(
	migration_tool="alembic",
	target_revision="head",
	downgrade_revision="base",
	extensions=[]
)
schema_services.run_schema_migrations(postgres_config, schema_config)
```

#### Function: downgrade_schema()

```python
def downgrade_schema(postgres_config: PostgresConfig, schema_config: SchemaConfig) -> None
```

**Description**: Execute schema migration downgrade workflow

**Parameters**: Same as `run_schema_migrations()`

**Returns**: None

**Raises**: Same as `run_schema_migrations()`

---

## 6. Testing Reference

### 6.1 How to Run Tests

**Run all schema tests**:
```bash
pytest tests/ -k schema
```

**Run specific test file**:
```bash
pytest tests/adapters/test_schema_adapters.py -v
```

**Run with coverage**:
```bash
pytest tests/ -k schema --cov=app --cov-report=html
```

**Run integration tests (requires Docker)**:
```bash
pytest tests/integration/test_schema_integration.py -v
```

### 6.2 Test Data & Fixtures

**Location**: `tests/conftest.py` or `tests/fixtures/`

**Available Fixtures**:
| Fixture Name | Type | Purpose | Usage |
|-------------|------|---------|-------|
| postgres_config | PostgresConfig | Mock DB config | @pytest.fixture |
| schema_config | SchemaConfig | Mock migration config | @pytest.fixture |
| mock_alembic | Mock | Mock Alembic API | from unittest.mock |
| docker_postgres | Container | Real PostgreSQL in Docker | pytest-docker plugin |

---

## 7. Related Documentation & Links

### 7.1 Internal Documentation

- **SCHEMA_WORKFLOW_QUICK_GUIDE.md**: Quick overview (10-15 min)
- **SCHEMA_WORKFLOW_DEEP_GUIDE.md**: Detailed explanation (45-60 min)
- **../INDEX.md**: StorageModule documentation index
- **../collection_workflow/**: Collection Workflow docs (depends on Schema)

### 7.2 Related Workflows

- **Collection Workflow** (`../collection_workflow/`): Depends on Schema setup
- **Bucket Workflow** (`../bucket_workflow/`): Depends on Schema setup
- **Seed Workflow** (`../seed_workflow/`): Depends on Schema setup

### 7.3 External References

- **Alembic Official Documentation**: https://alembic.sqlalchemy.org/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/current/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **SISE Project Repository**: https://github.com/Super-Muscle-Coder/SISE

### 7.4 Troubleshooting & Runbooks

- **Database Restore Runbook**: `docs/runbooks/db-restore.md`
- **Schema Troubleshooting**: See DEEP_GUIDE section 5 (Error Handling)

---

## 8. File Ownership & Contact

### 8.1 Component Owners

| Component | Owner | Team | Contact | Escalation |
|-----------|-------|------|---------|-----------|
| PostgresConfig Entity | StorageModule Team | Backend | See project README | StorageModule Lead → PM |
| SchemaAdapter | StorageModule Team | Backend | See project README | StorageModule Lead → PM |
| SchemaService | StorageModule Team | Backend | See project README | StorageModule Lead → PM |
| Migrations | StorageModule Team | Backend | See project README | StorageModule Lead → PM |
| alembic.ini Config | DevOps | Infrastructure | See project README | Infrastructure Lead → PM |

### 8.2 How to Update This Reference

1. Update ONLY when code/structure changes
2. Keep file paths, class names, function names current
3. Update "Last Updated" timestamp in header
4. Link related documentation changes
5. Reference this REFERENCES.md from commit message

---

## 9. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-01-15 | Initial reference documentation | StorageModule Team |

---

## 10. Quick Navigation

**Looking for...**

- **Where to find config files?** → Section 2.1
- **What classes exist?** → Sections 2.2-2.5
- **How to run tests?** → Section 6
- **API reference?** → Section 5
- **Directory structure?** → Section 1
- **Environment variables?** → Section 4.1
- **External dependencies?** → Section 3
- **Related workflows?** → Section 7.2
- **File ownership?** → Section 8
