# Schema Workflow - Deep Guide

**Mục đích**: Giải thích chi tiết Schema Workflow cho specialist, architect, người cần hiểu sâu design decisions.

**Mức độ**: Advanced / Specialist-level  
**Thời gian đọc**: 45-60 phút

---

## 1. Chi tiết: Schema Workflow này là gì? Nó được thiết kế như thế nào?

### 1.1 Định nghĩa đầy đủ

**Schema Workflow** là quy trình quản lý vòng đời PostgreSQL database schema:

- **Mục tiêu chính**: 
  - Tự động hoá việc tạo/cập nhật database schema
  - Đảm bảo tính nhất quán giữa dev, staging, prod
  - Hỗ trợ versioning schema (upgrade/downgrade migrations)
  - Tạo tiền đề cho tất cả workflows khác

- **Phạm vi**: 
  - Quản lý table definitions, indexes, constraints, extensions
  - Từ initialization (tạo mới) đến updates (schema changes)
  - Support idempotent operations (chạy lại an toàn)

- **Vai trò trong hệ thống**: 
  - **Tầng đầu tiên**: Là dependency của Collection, Bucket, Seed workflows
  - **Cơ sở hạ tầng**: Tất cả data quản lý bởi các workflows khác đều nằm trên schema này

- **Lịch sử thiết kế**:
  - Chọn **Alembic** vì: 
	- Built for SQLAlchemy ecosystem
	- Version control cho schema (like Git for DB)
	- Support both Python ORM syntax và raw SQL
	- Widely used in production (Flask, Django, etc.)
  - Alternative considered: Raw SQL scripts (rejected: no versioning, hard to rollback)
  - Alternative considered: SQLAlchemy table definitions (rejected: less explicit, harder to version)

### 1.2 Kiến trúc chi tiết (5-layer Architecture)

#### 1.2.1 Tầng lớp kiến trúc

```
┌────────────────────────────────────────────┐
│  Config Layer: .env / storage.env files    │
│  - DATABASE_URL                            │
│  - Migration tool (alembic)                │
│  - Target revision (head/specific)         │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  Entity Layer: Data Models & Config        │
│  - PostgresConfig (connection string)      │
│  - SchemaConfig (migration params)         │
│  - Immutable, validated dataclasses        │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  Adapter Layer: External Integration       │
│  - SchemaAdapter wraps Alembic API         │
│  - build_alembic_config()                  │
│  - run_upgrade() / run_downgrade()         │
│  - create_postgres_engine()                │
│  - Error handling, retry logic             │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  Service Layer: Business Logic             │
│  - SchemaService orchestrates workflow     │
│  - run_schema_migrations() (main entry)    │
│  - downgrade_schema()                      │
│  - Idempotency, transaction management     │
│  - Validation checks                       │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  Router Layer: Public API                  │
│  - SchemaWorkflowRouter (class-based)      │
│  - upgrade_schema()                        │
│  - downgrade_schema()                      │
│  - CLI entry points (schema_cli.py)        │
└─────────────────────┬──────────────────────┘
					  │
┌─────────────────────▼──────────────────────┐
│  External System: PostgreSQL Database      │
│  - Tables created/updated                  │
│  - Indexes created                         │
│  - Extensions enabled                      │
│  - alembic_version table tracks version    │
└────────────────────────────────────────────┘
```

#### 1.2.2 Detailed Process Flow

**Upgrade Flow (tạo/cập nhật schema)**:

```
1. Load Config
   ├─ Read DATABASE_URL from .env
   └─ Load SchemaConfig (target_revision, tool, extensions)

2. Build Alembic Config
   ├─ Create Alembic Config object
   ├─ Set script_location (/migrations)
   ├─ Set sqlalchemy.url (DATABASE_URL)
   └─ Return Config object

3. Connect to PostgreSQL
   ├─ Use SQLAlchemy create_engine()
   ├─ Validate connection (test query)
   └─ Check if database exists

4. Run Upgrade
   ├─ alembic upgrade [target_revision]
   ├─ Execute each migration in order
   ├─ Create tables, indexes, constraints
   ├─ Insert data (if migration has data fixture)
   └─ Update alembic_version table

5. Validate Schema
   ├─ Check all tables exist
   ├─ Check indexes created
   ├─ Verify constraints
   └─ Health check (run SELECT * from metadata)

6. Complete
   └─ Schema ready for Collection/Bucket/Seed workflows
```

**Downgrade Flow (rollback schema)**:

```
1. Load Config (same as upgrade)

2. Get Downgrade Revision
   ├─ From SchemaConfig.downgrade_revision
   ├─ Usually "base" (empty database) or specific revision
   └─ Validate revision exists

3. Run Downgrade
   ├─ alembic downgrade [downgrade_revision]
   ├─ Execute migrations in reverse
   ├─ Drop tables, indexes
   └─ Update alembic_version table

4. Cleanup
   └─ Database back to target state (usually empty)
```

#### 1.2.3 Step-by-Step Process Detail

**Step 1: Configuration Setup**
- **Input**: Environment variables (DATABASE_URL, migration_tool, target_revision)
- **Xử lý**: 
  - Load .env file using python-dotenv
  - Create PostgresConfig dataclass
  - Create SchemaConfig dataclass
  - Validate configs (URL format, revision syntax)
- **Output**: PostgresConfig + SchemaConfig objects
- **Validation**: URL must start with `postgresql://`, revision must be valid hex or "head"/"base"
- **Idempotency**: Yes - same config creates same objects
- **Error Handling**: Raise ConfigError if invalid format

**Step 2: Alembic Configuration Building**
- **Input**: PostgresConfig.database_url, script_location
- **Xử lý**:
  - Create Alembic Config()
  - Set main_option "script_location" (path to migrations folder)
  - Set main_option "sqlalchemy.url" (database connection)
  - Set file_template for auto-generation (if needed)
- **Output**: Alembic Config object
- **Validation**: File path must exist, URL must be valid SQLAlchemy URL
- **Idempotency**: Yes - same inputs create equivalent Config objects
- **Error Handling**: Raise ConfigError if migration path doesn't exist

**Step 3: PostgreSQL Connection Verification**
- **Input**: database_url
- **Xử lý**:
  - Create SQLAlchemy Engine
  - Execute test query: `SELECT 1`
  - Check connection health
- **Output**: Verified connection
- **Validation**: Connection must succeed within 5 seconds
- **Idempotency**: Yes - repeated connection tests are safe
- **Error Handling**: Raise ConnectionError if database unreachable

**Step 4: Migration Execution (Upgrade)**
- **Input**: Alembic Config, target_revision
- **Xử lý**:
  - Parse migration files from /migrations/versions/
  - Determine sequence of upgrades needed
  - Execute each migration in order (Python/SQL)
  - Update alembic_version table after each
- **Output**: Schema tables/indexes/constraints created
- **Validation**: Each migration must be syntactically valid, must not fail
- **Idempotency**: Yes (Alembic handles idempotency via alembic_version tracking)
- **Error Handling**: Rollback on migration failure, raise MigrationError

**Step 5: Schema Validation**
- **Input**: Schema objects in PostgreSQL
- **Xử lý**:
  - Query information_schema.tables
  - Query information_schema.indexes
  - Query information_schema.key_column_usage (constraints)
  - Compare with expected schema
- **Output**: Validation report (success or list of missing objects)
- **Validation**: All expected tables/indexes must exist
- **Idempotency**: Yes - validation is read-only
- **Error Handling**: Raise SchemaValidationError if mismatch

---

## 2. Chi tiết: Workflow này xử lý dữ liệu gì? Input/Output?

### 2.1 Input Specification

#### 2.1.1 Configuration & Parameters

| Tên | Loại | Required | Default | Mô tả | Ví dụ |
|-----|------|----------|---------|-------|-------|
| DATABASE_URL | String | Yes | N/A | PostgreSQL connection string (user:pass@host:port/db) | postgresql://postgres:pass@localhost:5432/sise_db |
| migration_tool | String | Yes | alembic | Migration tool (only "alembic" supported) | alembic |
| target_revision | String | Yes | head | Target migration version to apply | head (latest) or "001_initial" |
| downgrade_revision | String | No | base | Revision to downgrade to (for rollback) | base (empty) or specific revision |
| script_location | String | No | ./migrations | Path to Alembic migrations folder | /path/to/migrations |

#### 2.1.2 External Dependencies

| Tên | Loại | SLA | Health Check | Notes |
|-----|------|-----|--------------|-------|
| PostgreSQL Server | Service | 99% | Can connect + run SELECT 1 | Must be running, accessible |
| Network Connectivity | Network | N/A | Ping host:port | Database host must be reachable |
| Migration Files | Filesystem | N/A | Files exist + valid syntax | Must be in /migrations/versions/ |

#### 2.1.3 Prerequisites

- PostgreSQL instance provisioned and accessible
- Database created (or permissions to CREATE DATABASE if needed)
- Alembic migrations folder exists and contains .py migration files
- python-dotenv, sqlalchemy, alembic packages installed
- .env file with DATABASE_URL set correctly

### 2.2 Output Specification

#### 2.2.1 Primary Output

| Tên | Loại | Nơi | Định dạng | Mô tả | Life cycle |
|-----|------|-----|-----------|-------|-----------|
| PostgreSQL Schema | Database Objects | PostgreSQL | SQL tables/indexes/constraints | Tables (users, images, etc.), indexes (unique, btree), constraints (FK, NOT NULL) | Persists until downgrade |
| alembic_version Table | Tracking Table | PostgreSQL | Single row: version (latest applied revision) | Tracks which migrations have been applied | Persists, updated per migration |

#### 2.2.2 Side Effects & Logs

| Tên | Loại | Nơi | Mô tả | Retention |
|-----|------|-----|-------|-----------|
| Migration Log | Log | stdout/log file | Alembic output: "Running upgrade [...] -> [...], Running upgrade [...]" | 30 days |
| Database Activity Log | Audit | PostgreSQL logs | PostgreSQL log_statement output (if enabled) | Depends on DB config |
| alembic_history | Table | PostgreSQL (if enabled) | History of migrations run (if alembic history enabled) | Persists |

#### 2.2.3 State Changes

- **Before**: PostgreSQL database exists but has no schema (empty)
- **After**: All tables, indexes, constraints created per migration definitions

### 2.3 Data Processing Characteristics

#### 2.3.1 Data Types Handled

| Loại dữ liệu | Định dạng | Kích thước | Chi tiết |
|-------------|-----------|-----------|---------|
| Migration Scripts | Python (.py) or SQL (.sql) | 5-50 KB each | Contains CREATE TABLE, CREATE INDEX, ALTER TABLE statements |
| Schema Metadata | SQL metadata | Varies | Information about tables, columns, indexes, constraints |
| Connection String | Plain text | ~50-100 bytes | PostgreSQL connection URL |

#### 2.3.2 Data Volume & Throughput

- **Expected volume**: Schema definitions for ~20-50 tables
- **Throughput**: ~100-500 ms per migration (depends on DB size, query complexity)
- **Peak load**: Sequential (migrations run one-by-one), not parallel

#### 2.3.3 Data Lifecycle

```
Migration Files (.py/.sql)
		↓
Alembic Parser (reads & parses)
		↓
SQLAlchemy Compiler (converts to DB-specific SQL)
		↓
PostgreSQL Executor (executes DDL)
		↓
alembic_version Updated (tracks state)
		↓
Schema Ready (persists until downgrade)
```

---

## 3. Chi tiết: Các thành phần trọng tâm của Workflow?

### 3.1 Component Inventory

| Component | Category | Chức năng | Trách nhiệm | Dependencies | Owner/Module |
|-----------|----------|----------|-----------|--------------|-------------|
| `.env` / `storage.env.local` | Config | Store DATABASE_URL, migration params | Environment variable management | None | `/configs/` |
| `PostgresConfig` | Entity | Immutable config object for DB connection | Type safety, validation | None | `entities/schema_entities.py` |
| `SchemaConfig` | Entity | Immutable config object for migrations | Version control, target/downgrade revisions | None | `entities/schema_entities.py` |
| `schema_adapters.py` | Adapter | Wrap Alembic API, SQLAlchemy engine | Connection pooling, API abstraction, error handling | alembic, sqlalchemy | `adapters/schema_adapters.py` |
| `schema_services.py` | Service | Orchestrate migration workflow | Coordinate config→adapter→DB, idempotency, validation | Adapters, Entities | `services/schema_services.py` |
| `SchemaWorkflowRouter` | Router | Public API class for schema operations | Entry point for external callers (CLI, tests) | Services | `routers/schema_routers.py` |
| `/migrations/` folder | Config | Alembic migration scripts | Version control for schema changes | Python/SQL files | `migrations/versions/` |
| `alembic_version` table | Tracking | PostgreSQL table tracking applied migrations | State management (which migrations applied) | None (auto-created) | PostgreSQL |

### 3.2 Component Interaction

#### Sequence Diagram

```
Caller (CLI / Test)
		|
		| upgrade_schema()
		↓
SchemaWorkflowRouter
		| run_schema_migrations()
		↓
SchemaService
		├─ Load PostgresConfig from .env
		├─ Load SchemaConfig from config
		├─ build_alembic_config()
		|   ↓
		|   SchemaAdapter
		|       ├─ Create Alembic Config
		|       └─ Return Config object
		├─ run_upgrade(config, target_revision)
		|   ↓
		|   SchemaAdapter
		|       ├─ command.upgrade()
		|       ├─ Execute migrations
		|       └─ Return status
		├─ Validate schema
		└─ Return success/error
		↓
Caller (Result: Success or Error)
```

#### Dependency Graph

```
.env / storage.env
	↓ (read by)
PostgresConfig, SchemaConfig (entities)
	↓ (used by)
SchemaAdapter (wraps Alembic)
	↓ (used by)
SchemaService (orchestrates)
	↓ (used by)
SchemaWorkflowRouter (public API)
	↓ (called by)
External: CLI scripts, Tests, Init handlers
	↓ (connects to)
PostgreSQL Database ← migrations/ files
```

### 3.3 Component Responsibilities Detail

#### Component: PostgresConfig

- **Định nghĩa**: Immutable dataclass holding PostgreSQL connection parameters
- **Loại**: Entity
- **Trách nhiệm chính**: 
  - Store database_url
  - Validate URL format (starts with postgresql://)
  - Provide type-safe access to connection params
- **Không nên làm gì**: 
  - Không execute queries (that's Adapter's job)
  - Không modify URL after creation
- **Phụ thuộc**: None (uses only Python stdlib)
- **Người phụ thuộc**: SchemaService, SchemaAdapter
- **Test coverage**: `tests/entities/test_postgres_config.py`

```python
@dataclass(frozen=True)
class PostgresConfig:
	database_url: str
	# Usage: config = PostgresConfig(database_url="postgresql://...")
```

#### Component: SchemaAdapter

- **Định nghĩa**: Wrapper around Alembic and SQLAlchemy for DB operations
- **Loại**: Adapter
- **Trách nhiệm chính**: 
  - `build_alembic_config()`: Create Alembic Config from params
  - `run_upgrade()`: Execute migrations to target revision
  - `run_downgrade()`: Rollback to previous revision
  - `create_postgres_engine()`: Create SQLAlchemy engine
- **Không nên làm gì**: 
  - Không contain business logic
  - Không perform validation (Service's job)
  - Không modify config
- **Phụ thuộc**: alembic, sqlalchemy
- **Người phụ thuộc**: SchemaService
- **Test coverage**: `tests/adapters/test_schema_adapters.py` (mocking Alembic)

#### Component: SchemaService

- **Định nghĩa**: Orchestrates schema setup workflow
- **Loại**: Service
- **Trách nhiệm chính**: 
  - `run_schema_migrations()`: Main entry point (upgrade workflow)
  - `downgrade_schema()`: Rollback workflow
  - Load config from .env
  - Call adapter, validate results
- **Không nên làm gì**: 
  - Không make raw Alembic calls (use Adapter)
  - Không parse migration files
- **Phụ thuộc**: SchemaAdapter, PostgresConfig, SchemaConfig
- **Người phụ thuộc**: SchemaWorkflowRouter, Tests
- **Test coverage**: `tests/services/test_schema_services.py`

#### Component: SchemaWorkflowRouter

- **Định nghĩa**: Public API entry point for schema workflow
- **Loại**: Router
- **Trách nhiệm chính**: 
  - `upgrade_schema()`: Trigger schema creation
  - `downgrade_schema()`: Trigger rollback
  - Initialize internal configs
- **Không nên làm gì**: 
  - Không contain orchestration logic (Service's job)
  - Không call external APIs (Adapter's job)
- **Phụ thuộc**: SchemaService, SchemaConfig, PostgresConfig
- **Người phụ thuộc**: CLI scripts, AG-03, Tests
- **Test coverage**: `tests/routers/test_schema_routers.py`

---

## 4. Design Decisions & Rationale

### 4.1 Architectural Choices

**Choice 1: Use Alembic instead of Raw SQL Scripts**
- **Pro**: Version control (like Git for DB), supports rollback, auto-generated migration detection
- **Con**: Learning curve for Alembic syntax, extra layer of abstraction
- **Rationale**: In production, schema changes are inevitable. Alembic's version control prevents "script chaos" and enables reliable rollbacks
- **Alternative rejected**: Raw SQL scripts → too manual, hard to rollback, no version tracking

**Choice 2: Separate Adapter layer for Alembic API**
- **Pro**: Easy to mock in tests, clear separation of concerns, Alembic API isolated
- **Con**: Small overhead per call
- **Rationale**: Allows testing without real database/Alembic, makes code more maintainable
- **Alternative rejected**: Direct Alembic calls in Service → harder to test, Alembic leaks into business logic

**Choice 3: Idempotent Migrations**
- **Pro**: Safe to rerun, no errors if migration already applied
- **Con**: Migrations must use `if not exists` pattern
- **Rationale**: In a complex CI/CD pipeline, migrations may rerun; idempotency prevents failures
- **Alternative rejected**: Non-idempotent migrations → fragile, breaks with retries

### 4.2 Trade-offs

| Trade-off | Pro | Con | Decision |
|-----------|-----|-----|----------|
| Alembic auto-generation vs manual migrations | Auto: faster, less boilerplate | Manual: more control, explicit | Accept manual: clarity over speed |
| Single revision vs multiple migrations | Single: simpler | Multiple: incremental, safer | Accept multiple: allows partial rollbacks |
| Validation after each migration vs once at end | Per-migration: early error detection | Once at end: simpler | Accept per-migration: fail-fast |

---

## 5. Error Handling & Failure Modes

### 5.1 Expected Failures & Recovery

| Failure | Root Cause | Detection | Recovery | Impact |
|---------|-----------|-----------|----------|--------|
| Connection timeout | Network issue / DB down | Connection attempt fails | Retry with backoff, fail after 3 attempts | 5-10 min delay, then explicit error |
| Invalid migration | Syntax error in .py file | Alembic parser error | Fix migration file, rerun | Must fix before proceeding |
| Migration already applied | Idempotent retry | alembic_version check | Skip migration, continue | None (Alembic handles) |
| Permission denied | User lacks CREATE TABLE privilege | DDL fails | Grant permissions, rerun | Requires DBA intervention |
| Database doesn't exist | DB not created yet | Connection error | Create DB or use CREATE IF NOT EXISTS | Depends on privileges |

### 5.2 Unexpected Failures

If encounter unknown error:
1. Check PostgreSQL logs: `SELECT * FROM pg_stat_statements`
2. Run `alembic current` to see current version
3. Check migration files for syntax errors
4. Contact: StorageModule owner (see REFERENCES.md section 8)

---

## 6. Testing Strategy

### 6.1 Unit Tests

- **Coverage**: ~90%
- **Tools**: pytest, unittest.mock
- **Test files**: `tests/adapters/test_schema_adapters.py`, `tests/services/test_schema_services.py`
- **What**: Mock Alembic, test config loading, error handling

### 6.2 Integration Tests

- **Scope**: Full workflow with test database
- **Setup**: Docker container running PostgreSQL
- **Test files**: `tests/integration/test_schema_workflow_integration.py`
- **What**: Run actual migrations, validate schema, check rollback

### 6.3 End-to-End Tests

- **Scope**: Real database, real migrations, like production
- **Environment**: Staging (or isolated Postgres container)
- **Test files**: `tests/e2e/test_schema_workflow_e2e.py`
- **What**: Full upgrade/downgrade cycle, verify all tables created

---

## 7. Performance & Monitoring

### 7.1 Key Metrics

| Metric Name | Type | Unit | Target | Alert Threshold |
|------------|------|------|--------|-----------------|
| schema_setup_duration | Gauge | ms | < 5000 | > 10000 |
| migration_count | Counter | count | ~15 | N/A (info only) |
| schema_validation_pass_rate | Gauge | % | 100 | < 95 |
| database_connection_pool_active | Gauge | connections | < 10 | > 50 |

### 7.2 Observability

- **Logging**: All migrations logged to stdout + file at `logs/schema_setup.log`
- **Metrics**: Prometheus metrics exported (if monitoring enabled)
- **Tracing**: Structured logs with timestamps, migration names, durations

---

## 8. Known Limitations & Future Work

### 8.1 Current Limitations

- **Single-threading**: Migrations run sequentially (no parallel execution)
  - Impact: Setup takes ~30-60 seconds per workflow
  - Workaround: Run all workflows in parallel at system level

- **No automatic schema backup**:
  - Impact: Downgrade might lose data if not careful
  - Workaround: Manual backup before running migrations

### 8.2 Future Improvements

- **Automatic schema backup** before migrations
- **Parallel migration execution** (if safe)
- **Schema diff detection** (auto-generate migrations)
- **Cloud DB support** (RDS, Cloud SQL, Azure DB)

---

## 9. Related Workflows & Integration Points

- **Collection Workflow**: Depends on Schema (needs tables for metadata)
- **Bucket Workflow**: Depends on Schema (needs privacy_level table)
- **Seed Workflow**: Depends on Schema (needs all tables before seeding)

---

## 10. References & Further Reading

- **Alembic Official Docs**: https://alembic.sqlalchemy.org/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **Design RFC**: `.knowledge/shared/schema_design_rfc.md` (if exists)
