# SCHEMA WORKFLOW - QUICK REFERENCE

## TÓM TẮT 3 CÂU

```
1. SCHEMA WORKFLOW LÀ GÌ?
   → Quản lý cấu trúc database (tables, columns, indexes)
   → Sử dụng Alembic để track thay đổi

2. XỬ LÝ DỮ LIỆU LOẠI GÌ?
   → Database structure (não xử lý actual data/rows)
   → Tables, constraints, indexes, extensions

3. THÀNH PHẦN CẦN CÓ?
   → Entities (config) + Adapters (operations) + Services (orchestration)
   → + Routers (entry) + Migration files (SQL)
```

---

## FILES LOCATION

```
modules/StorageModule/
├── app/
│   ├── entities/
│   │   └── schema_entities.py          ← PostgresConfig, SchemaConfig
│   ├── adapters/
│   │   └── schema_adapters.py          ← build_alembic_config, run_upgrade, run_downgrade
│   ├── services/
│   │   └── schema_services.py          ← run_schema_migrations, downgrade_schema
│   └── routers/
│       └── schema_routers.py           ← SchemaWorkflowRouter
├── migrations/
│   ├── env.py                          ← Alembic runtime environment
│   └── versions/
│       └── schema_0001_create_storage_schema.py  ← upgrade(), downgrade()
├── configs/
│   └── storage.env.local               ← DATABASE_URL, SCHEMA_*
├── schema_alembic.ini                  ← Alembic config file
└── storage_main.py                     ← CLI entry point
```

---

## EXECUTION FLOW

```
User Command
	↓
storage_main.py (parse args)
	↓
schema_routers.py (SchemaWorkflowRouter)
	↓
schema_services.py (run_schema_migrations)
	↓
schema_adapters.py (run_upgrade)
	↓
Alembic (command.upgrade)
	↓
migrations/env.py (run_migrations_online)
	↓
schema_0001_create_storage_schema.py (upgrade function)
	↓
PostgreSQL (execute SQL)
	↓
Database Schema Created ✓
```

---

## DATABASE STRUCTURE

```
SISE Database:

tables:
  • users
	- id (PK)
	- username (UNIQUE)
	- email (UNIQUE)
	- password_hash
	- created_at

  • friends
	- user_id (FK→users, PK)
	- friend_id (FK→users, PK)
	- created_at
	- CHECK: user_id ≠ friend_id

  • albums
	- id (PK)
	- user_id (FK→users)
	- title
	- description
	- created_at

  • images
	- id (PK)
	- album_id (FK→albums)
	- original_url
	- thumbnail_url
	- created_at

indexes:
  • idx_users_email
  • idx_albums_user_id
  • idx_images_album_id

extensions:
  • uuid-ossp
  • pgcrypto
```

---

## COMMON COMMANDS

### Run Migration (Upgrade)
```python
from app.routers.schema_routers import SchemaWorkflowRouter
from app.entities.schema_entities import PostgresConfig, SchemaConfig

postgres_config = PostgresConfig(
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)
schema_config = SchemaConfig(
	migration_tool="alembic",
	target_revision="head",
	downgrade_revision="base",
	extensions=["uuid-ossp", "pgcrypto"]
)

router = SchemaWorkflowRouter(postgres_config, schema_config)
router.upgrade_schema()  # ✓ Schema created
```

### Rollback Migration (Downgrade)
```python
router.downgrade_schema()  # ✓ Schema reverted
```

### Check Migration Status
```bash
psql -U postgres -d sise -c "SELECT version FROM alembic_version;"
```

---

## CONFIGURATION

### Environment Variables (`storage.env.local`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sise
SCHEMA_MIGRATION_TOOL=alembic
SCHEMA_TARGET_REVISION=head
SCHEMA_DOWNGRADE_REVISION=base
SCHEMA_EXTENSIONS=uuid-ossp,pgcrypto
```

### Alembic Config (`schema_alembic.ini`)
```ini
[alembic]
script_location = migrations
sqlalchemy.url = driver://user:pass@localhost/dbname

[loggers]
keys = root,sqlalchemy,alembic
```

---

## 5-LAYER ARCHITECTURE

```
LAYER 1: ENTITIES (Input Data)
├── PostgresConfig
└── SchemaConfig

LAYER 2: ADAPTERS (Low-level Ops)
├── build_alembic_config()
├── run_upgrade()
├── run_downgrade()
└── create_postgres_engine()

LAYER 3: SERVICES (Orchestration)
├── run_schema_migrations()
└── downgrade_schema()

LAYER 4: ROUTERS (Entry Points)
└── SchemaWorkflowRouter
	├── upgrade_schema()
	└── downgrade_schema()

LAYER 5: EXTERNAL TOOLS
├── Alembic (migration tool)
├── SQLAlchemy (DB connection)
├── PostgreSQL (database)
└── alembic_version table (tracking)
```

---

## KEY CONCEPTS

| Concept | Meaning | Example |
|---------|---------|---------|
| **Migration** | Version-controlled schema change | schema_0001_create_storage_schema.py |
| **Revision** | Migration version identifier | 0001_create_storage_schema |
| **upgrade()** | Apply schema changes forward | CREATE TABLE users |
| **downgrade()** | Revert schema changes backward | DROP TABLE users |
| **head** | Latest migration version | "head" = v0002 |
| **base** | Initial state (no migrations) | "base" = empty DB |
| **alembic_version** | Table tracking current version | Stores: 0001_create_storage_schema |

---

## DEBUGGING

### Error: "Connection refused"
```
→ PostgreSQL not running
→ Run: docker-compose -f infra_compose_storage.yml up -d
→ Or check: psql -U postgres -d sise
```

### Error: "ModuleNotFoundError: No module named 'alembic'"
```
→ Dependencies not installed
→ Run: py -3.13 -m pip install -r storage_requirements.txt
```

### Error: "sqlalchemy.exc.OperationalError"
```
→ Database doesn't exist or wrong connection string
→ Check: DATABASE_URL in storage.env.local
→ Create DB: psql -U postgres -c "CREATE DATABASE sise;"
```

### Check Current Schema Version
```bash
psql -U postgres -d sise -c "SELECT version FROM alembic_version;"
```

### View All Tables
```bash
psql -U postgres -d sise -c "\dt"
```

---

## RELATED DOCUMENTS

```
Learn More:
├── SCHEMA_WORKFLOW_TUTORIAL.md
│   └── Detailed explanation of all components
├── SCHEMA_WORKFLOW_EXAMPLES.md
│   └── Code examples and practical scenarios
└── TESTING_GUIDE.md
	└── How to test schema workflow
```

---

## WORKFLOW PURPOSE

```
PURPOSE: Initialize & manage PostgreSQL database structure

INPUT:  PostgresConfig + SchemaConfig
OUTPUT: Database with proper schema

STEPS:
  1. Load configuration (env vars)
  2. Create config objects
  3. Build Alembic config
  4. Run upgrade command
  5. Alembic executes migration file
  6. SQL statements applied to PostgreSQL
  7. alembic_version table updated
  8. Schema ready for use

TIME: ~2-5 seconds for first-time setup
```

---

## LEARNING CHECKLIST

- [ ] Understand what Schema Workflow does
- [ ] Understand what data it processes
- [ ] Know location of each file
- [ ] Understand 5-layer architecture
- [ ] Can create config objects
- [ ] Can run upgrade/downgrade
- [ ] Can check migration status
- [ ] Can debug common errors
- [ ] Ready to learn Collection Workflow

