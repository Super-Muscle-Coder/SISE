# SCHEMA WORKFLOW - VÍ DỤ THỰC HÀNH

## Mục Đích

Document này cho thấy **thực tế** code làm gì, qua ví dụ step-by-step.

---

## PART 1: ENTITIES - Định Nghĩa Dữ Liệu

### File: `schema_entities.py`

```python
from dataclasses import dataclass
from typing import List

@dataclass(frozen=True)
class PostgresConfig:
	database_url: str

@dataclass(frozen=True)
class SchemaConfig:
	migration_tool: str
	target_revision: str
	downgrade_revision: str
	extensions: List[str]
```

### Ví Dụ 1: Tạo Config Objects

```python
# ĐÂY LÀ ĐẦU VÀO DỮ LIỆU

postgres_config = PostgresConfig(
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)
# postgres_config chứa thông tin kết nối Database

schema_config = SchemaConfig(
	migration_tool="alembic",           # Tool để chạy migrations
	target_revision="head",              # Nâng cấp lên phiên bản mới nhất
	downgrade_revision="base",           # Quay lại trạng thái ban đầu
	extensions=["uuid-ossp", "pgcrypto"] # PostgreSQL extensions cần
)
# schema_config chứa cấu hình schema workflow

print(postgres_config.database_url)
# Output: postgresql://postgres:postgres@localhost:5432/sise

print(schema_config.migration_tool)
# Output: alembic
```

### Ví Dụ 2: Đọc từ Environment Variables

```python
import os
from app.entities.schema_entities import PostgresConfig, SchemaConfig

# Từ storage.env.local:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sise
# SCHEMA_MIGRATION_TOOL=alembic
# SCHEMA_TARGET_REVISION=head
# SCHEMA_DOWNGRADE_REVISION=base
# SCHEMA_EXTENSIONS=uuid-ossp,pgcrypto

postgres_config = PostgresConfig(
	database_url=os.getenv("DATABASE_URL")
)

extensions_list = [ext.strip() for ext in os.getenv("SCHEMA_EXTENSIONS").split(",")]
schema_config = SchemaConfig(
	migration_tool=os.getenv("SCHEMA_MIGRATION_TOOL"),
	target_revision=os.getenv("SCHEMA_TARGET_REVISION"),
	downgrade_revision=os.getenv("SCHEMA_DOWNGRADE_REVISION"),
	extensions=extensions_list
)
```

---

## PART 2: ADAPTERS - Low-Level Operations

### File: `schema_adapters.py`

```python
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

def build_alembic_config(script_location: str, database_url: str) -> Config:
	"""Xây dựng Alembic configuration object"""
	config = Config()
	config.set_main_option("script_location", script_location)
	config.set_main_option("sqlalchemy.url", database_url)
	return config

def run_upgrade(config: Config, revision: str) -> None:
	"""Chạy migration lên một phiên bản"""
	command.upgrade(config, revision)

def run_downgrade(config: Config, revision: str) -> None:
	"""Chạy migration xuống một phiên bản"""
	command.downgrade(config, revision)

def create_postgres_engine(database_url: str) -> Engine:
	"""Tạo SQLAlchemy engine để kết nối PostgreSQL"""
	return create_engine(database_url, future=True)
```

### Ví Dụ 1: Build Alembic Config

```python
from app.adapters import schema_adapters

# Bước 1: Build config
alembic_config = schema_adapters.build_alembic_config(
	script_location="modules/StorageModule/migrations",
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)

print(alembic_config.get_main_option("script_location"))
# Output: modules/StorageModule/migrations

print(alembic_config.get_main_option("sqlalchemy.url"))
# Output: postgresql://postgres:postgres@localhost:5432/sise

# ✓ Alembic biết nơi migrations và database URL
```

### Ví Dụ 2: Create PostgreSQL Engine

```python
from app.adapters import schema_adapters

# Tạo engine
engine = schema_adapters.create_postgres_engine(
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)

# Kiểm tra kết nối
try:
	with engine.connect() as conn:
		result = conn.execute("SELECT 1")
		print("✓ PostgreSQL connected!")
except Exception as e:
	print(f"✗ Connection failed: {e}")

# Output: ✓ PostgreSQL connected!
```

### Ví Dụ 3: Run Migration Upgrade

```python
from app.adapters import schema_adapters

alembic_config = schema_adapters.build_alembic_config(
	script_location="modules/StorageModule/migrations",
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)

# Chạy upgrade lên "head" (phiên bản mới nhất)
schema_adapters.run_upgrade(alembic_config, "head")

print("✓ Migration ran successfully!")
# Database schema được tạo

# What happened:
# 1. Alembic tìm migrations folder
# 2. Tìm file: schema_0001_create_storage_schema.py
# 3. Chạy upgrade() function
# 4. SQL statements được execute
# 5. Database tables được tạo
# 6. alembic_version record được thêm
```

### Ví Dụ 4: Run Migration Downgrade

```python
from app.adapters import schema_adapters

alembic_config = schema_adapters.build_alembic_config(
	script_location="modules/StorageModule/migrations",
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)

# Chạy downgrade xuống "base" (trạng thái ban đầu)
schema_adapters.run_downgrade(alembic_config, "base")

print("✓ Migration rolled back!")
# Database schema bị xóa

# What happened:
# 1. Alembic tìm xem version hiện tại (0001)
# 2. Tìm downgrade() function trong schema_0001_create_storage_schema.py
# 3. Chạy downgrade() function
# 4. DROP TABLE statements được execute
# 5. Tất cả tables bị xóa
# 6. alembic_version record bị xóa
```

---

## PART 3: SERVICES - Orchestration Logic

### File: `schema_services.py`

```python
import os
from pathlib import Path
from app.adapters import schema_adapters
from app.entities.schema_entities import PostgresConfig, SchemaConfig

def run_schema_migrations(postgres_config: PostgresConfig, 
						 schema_config: SchemaConfig) -> None:
	"""Chạy schema migrations"""
	if schema_config.migration_tool != "alembic":
		raise ValueError("Unsupported migration tool")

	script_location = _resolve_migration_path()
	alembic_config = schema_adapters.build_alembic_config(
		script_location=script_location,
		database_url=postgres_config.database_url,
	)
	schema_adapters.run_upgrade(alembic_config, schema_config.target_revision)

def downgrade_schema(postgres_config: PostgresConfig, 
					schema_config: SchemaConfig) -> None:
	"""Rollback schema migrations"""
	if schema_config.migration_tool != "alembic":
		raise ValueError("Unsupported migration tool")

	script_location = _resolve_migration_path()
	alembic_config = schema_adapters.build_alembic_config(
		script_location=script_location,
		database_url=postgres_config.database_url,
	)
	schema_adapters.run_downgrade(alembic_config, schema_config.downgrade_revision)

def _resolve_migration_path() -> str:
	"""Tìm folder migrations"""
	module_root = Path(__file__).resolve().parents[2]
	return os.fspath(module_root / "migrations")
```

### Ví Dụ 1: Run Schema Migrations

```python
from app.services import schema_services
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

# ✓ Chạy migrations
schema_services.run_schema_migrations(postgres_config, schema_config)

print("✓ Schema migrations completed!")

# What happened:
# 1. Kiểm tra migration_tool == "alembic"
# 2. Gọi _resolve_migration_path()
#    → Tìm: modules/StorageModule/migrations
# 3. Build Alembic config
# 4. Run upgrade(config, "head")
# 5. Alembic chạy upgrade() từ migration file
# 6. Database tables được tạo
```

### Ví Dụ 2: Downgrade Schema

```python
from app.services import schema_services
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

# ✓ Rollback migrations
schema_services.downgrade_schema(postgres_config, schema_config)

print("✓ Schema downgraded!")

# What happened:
# 1. Kiểm tra migration_tool == "alembic"
# 2. Gọi _resolve_migration_path()
#    → Tìm: modules/StorageModule/migrations
# 3. Build Alembic config
# 4. Run downgrade(config, "base")
# 5. Alembic chạy downgrade() từ migration file
# 6. Database tables bị xóa
```

---

## PART 4: ROUTERS - Entry Points

### File: `schema_routers.py`

```python
from app.services import schema_services
from app.entities.schema_entities import PostgresConfig, SchemaConfig

class SchemaWorkflowRouter:
	def __init__(self, postgres_config: PostgresConfig, 
				 schema_config: SchemaConfig):
		self.postgres_config = postgres_config
		self.schema_config = schema_config

	def upgrade_schema(self) -> None:
		"""Upgrade schema"""
		schema_services.run_schema_migrations(
			self.postgres_config, 
			self.schema_config
		)

	def downgrade_schema(self) -> None:
		"""Downgrade schema"""
		schema_services.downgrade_schema(
			self.postgres_config, 
			self.schema_config
		)
```

### Ví Dụ 1: Create Router & Upgrade

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

# ✓ Create router
router = SchemaWorkflowRouter(postgres_config, schema_config)

# ✓ Upgrade schema
router.upgrade_schema()

print("✓ Schema upgraded successfully!")

# What happened:
# 1. SchemaWorkflowRouter lưu configs
# 2. upgrade_schema() gọi schema_services.run_schema_migrations()
# 3. Migrations chạy
# 4. Database được tạo
```

### Ví Dụ 2: Downgrade

```python
from app.routers.schema_routers import SchemaWorkflowRouter
from app.entities.schema_entities import PostgresConfig, SchemaConfig

# ... (same config setup)

router = SchemaWorkflowRouter(postgres_config, schema_config)

# ✓ Downgrade schema
router.downgrade_schema()

print("✓ Schema downgraded successfully!")
```

---

## PART 5: MIGRATION FILES - SQL Execution

### File: `migrations/versions/schema_0001_create_storage_schema.py`

**Phần quan trọng nhất - Nơi SQL được định nghĩa**

```python
"""create storage schema"""

from alembic import op
import sqlalchemy as sa

# revision identifiers used by Alembic
revision = "0001_create_storage_schema"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
	"""Upgrade database schema"""

	# 1. Create PostgreSQL extensions
	op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
	op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

	# 2. Create users table
	op.create_table(
		'users',
		sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
		sa.Column('username', sa.String(length=50), nullable=False, unique=True),
		sa.Column('email', sa.String(length=100), nullable=False, unique=True),
		sa.Column('password_hash', sa.Text(), nullable=False),
		sa.Column('created_at', sa.DateTime(timezone=True), 
				  server_default=sa.text('CURRENT_TIMESTAMP'))
	)

	# 3. Create friends table
	op.create_table(
		'friends',
		sa.Column('user_id', sa.Integer(), nullable=False),
		sa.Column('friend_id', sa.Integer(), nullable=False),
		sa.Column('created_at', sa.DateTime(timezone=True), 
				  server_default=sa.text('CURRENT_TIMESTAMP')),
		sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
		sa.ForeignKeyConstraint(['friend_id'], ['users.id'], ondelete='CASCADE'),
		sa.CheckConstraint('user_id <> friend_id', name='ck_friends_not_self'),
		sa.PrimaryKeyConstraint('user_id', 'friend_id', name='pk_friends')
	)

	# 4. Create albums table
	op.create_table(
		'albums',
		sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
		sa.Column('user_id', sa.Integer(), nullable=False),
		sa.Column('title', sa.String(length=200), nullable=False),
		sa.Column('description', sa.Text(), nullable=True),
		sa.Column('created_at', sa.DateTime(timezone=True), 
				  server_default=sa.text('CURRENT_TIMESTAMP')),
		sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
	)

	# 5. Create images table
	op.create_table(
		'images',
		sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
		sa.Column('album_id', sa.Integer(), nullable=False),
		sa.Column('original_url', sa.String(length=500), nullable=False),
		sa.Column('thumbnail_url', sa.String(length=500), nullable=False),
		sa.Column('created_at', sa.DateTime(timezone=True), 
				  server_default=sa.text('CURRENT_TIMESTAMP')),
		sa.ForeignKeyConstraint(['album_id'], ['albums.id'], ondelete='CASCADE')
	)

	# 6. Create indexes for performance
	op.create_index('idx_users_email', 'users', ['email'])
	op.create_index('idx_albums_user_id', 'albums', ['user_id'])
	op.create_index('idx_images_album_id', 'images', ['album_id'])

def downgrade() -> None:
	"""Downgrade database schema (revert changes)"""

	# Drop tables in reverse order (handle foreign keys)
	op.drop_table('images')
	op.drop_table('albums')
	op.drop_table('friends')
	op.drop_table('users')

	# Drop extensions
	op.execute('DROP EXTENSION IF EXISTS "pgcrypto"')
	op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
```

### Ví Dụ: Database Changes Trước & Sau

```
TRƯỚC (upgrade() chạy):
┌─────────────────────┐
│  PostgreSQL         │
├─────────────────────┤
│ Database: sise      │
│ Tables: (empty)     │
│ Extensions: (empty) │
└─────────────────────┘

SAU (upgrade() chạy):
┌─────────────────────────────────────────┐
│  PostgreSQL                             │
├─────────────────────────────────────────┤
│ Database: sise                          │
│ Extensions:                             │
│   ✓ uuid-ossp                           │
│   ✓ pgcrypto                            │
│ Tables:                                 │
│   ✓ users (id, username, email, ...)    │
│   ✓ friends (user_id, friend_id, ...)   │
│   ✓ albums (id, user_id, title, ...)    │
│   ✓ images (id, album_id, original_url) │
│   ✓ alembic_version (0001_create...)    │
│ Indexes:                                │
│   ✓ idx_users_email                     │
│   ✓ idx_albums_user_id                  │
│   ✓ idx_images_album_id                 │
└─────────────────────────────────────────┘

SQL Executed:
CREATE EXTENSION "uuid-ossp"
CREATE EXTENSION "pgcrypto"
CREATE TABLE users (...)
CREATE TABLE friends (...)
CREATE TABLE albums (...)
CREATE TABLE images (...)
CREATE INDEX idx_users_email ON users(email)
CREATE INDEX idx_albums_user_id ON albums(user_id)
CREATE INDEX idx_images_album_id ON images(album_id)
INSERT INTO alembic_version (version_num) VALUES ('0001_create_storage_schema')
```

---

## PART 6: COMPLETE FLOW - All Layers Together

### Scenario: First-Time Database Setup

```
COMMAND:
  py -3.13 storage_main.py schema

FLOW:

1️⃣ storage_main.py
   ├─ Parse command = "schema"
   ├─ Load env vars
   ├─ Create PostgresConfig(database_url="...")
   ├─ Create SchemaConfig(migration_tool="alembic", ...)
   └─ Create SchemaWorkflowRouter(postgres_config, schema_config)

2️⃣ schema_routers.py - SchemaWorkflowRouter.upgrade_schema()
   └─ Call: schema_services.run_schema_migrations(...)

3️⃣ schema_services.py - run_schema_migrations()
   ├─ Check: migration_tool == "alembic" ✓
   ├─ Call: _resolve_migration_path()
   │  └─ Return: "modules/StorageModule/migrations"
   ├─ Call: schema_adapters.build_alembic_config(...)
   │  └─ Return: Alembic Config object
   └─ Call: schema_adapters.run_upgrade(config, "head")

4️⃣ schema_adapters.py - run_upgrade()
   └─ Call: command.upgrade(config, "head")

5️⃣ Alembic Engine (alembic/command.py)
   ├─ Find script_location = "migrations"
   ├─ Find current version from DB (None, first time)
   ├─ Find all migration files in order
   ├─ Find: schema_0001_create_storage_schema.py
   └─ Call upgrade() function

6️⃣ migrations/env.py - run_migrations_online()
   ├─ Read DATABASE_URL from environment
   ├─ Create SQLAlchemy engine
   ├─ Connect to PostgreSQL
   ├─ Call: context.run_migrations()
   └─ Executes SQL from migration file

7️⃣ schema_0001_create_storage_schema.py - upgrade()
   ├─ CREATE EXTENSION "uuid-ossp"
   ├─ CREATE EXTENSION "pgcrypto"
   ├─ CREATE TABLE users
   ├─ CREATE TABLE friends
   ├─ CREATE TABLE albums
   ├─ CREATE TABLE images
   ├─ CREATE INDEX idx_users_email
   ├─ CREATE INDEX idx_albums_user_id
   ├─ CREATE INDEX idx_images_album_id
   └─ INSERT INTO alembic_version

8️⃣ PostgreSQL
   ✓ Database schema created
   ✓ All tables exist
   ✓ All indexes exist
   ✓ All constraints in place

RESULT:
  ✓ Database fully initialized
  ✓ Ready to use
  ✓ Can check: psql -U postgres -d sise -c "\dt"
	→ Shows: users, friends, albums, images tables
```

---

## KEY TAKEAWAYS

1. **Entities** định nghĩa đầu vào (PostgresConfig, SchemaConfig)
2. **Adapters** gọi thư viện bên ngoài (Alembic, SQLAlchemy)
3. **Services** orchestrate adapters
4. **Routers** gọi services (entry points)
5. **Migration files** chứa SQL thực tế
6. **env.py** là bridge giữa Alembic và Database

Mỗi layer có nhiệm vụ riêng biệt, dễ test & maintain!

