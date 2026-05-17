# SCHEMA WORKFLOW 

## Mục Tiêu Học Tập 

Sau khi học xong, ta sẽ hiểu:
1. **Schema Workflow là gì** - chức năng, tại sao cần
2. **Xử lý dữ liệu loại gì** - Database schema, structural changes
3. **Thành phần cần thiết** - files, configuration, tools

---

## PHẦN 1: SCHEMA WORKFLOW LÀ GÌ?

### 1.1 Định Nghĩa & Chức Năng

```
SCHEMA WORKFLOW - Quản lý cấu trúc database (Migrations)  

**Chức năng:**  
✓ Khởi tạo database structure 
✓ Upgrade schema khi có thay đổi mới  
✓ Downgrade schema khi cần rollback  
✓ Quản lý phiên bản database  
✓ Đảm bảo tính nhất quán cấu trúc  

**Loại dữ liệu xử lý:**  
✓ Cấu trúc bảng (tables)  
✓ Ràng buộc (constraints)  
✓ Chỉ mục (indexes)  
✓ Extensions PostgreSQL  
✓ Kiểu dữ liệu tùy chỉnh  

```

### 1.2 Tại Sao Ta Lại Cần Schema Workflow?

**Câu hỏi**: Tại sao không tạo database bằng SQL trực tiếp cho nhanh?

**Trả lời**:
```
CÁCH CŨ (Direct SQL):
  ✗ Khó quản lý phiên bản
  ✗ Không thể rollback tự động
  ✗ Khó cộng tác team
  ✗ Không track thay đổi
  ✗ Dễ xung đột khi merge

CÁCH MỚI (Schema Workflow + Migrations):
  ✓ Mỗi thay đổi là một "phiên bản" (revision)
  ✓ Dễ upgrade/downgrade
  ✓ Team có thể xem lịch sử thay đổi thông qua migration files
  ✓ Tự động kiểm tra compatibility
  ✓ Dễ deploy giữa các môi trường (dev, staging, prod)
```

### 1.3 Quy Trình Hoạt Động

```
┌──────────────────────────────────────────────────────────────┐
│              SCHEMA WORKFLOW - QUY TRÌNH                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Lần 1 (First Time):                                         │
│  ┌────────────┐       ┌─────────────────┐                    │
│  │  run_main  │────── │ Alembic upgrade │                    │
│  │  (schema)  │       │  (head = v0001) │                    │
│  └────────────┘       └─────────────────┘                    │
│                              │                               │
│                              v                               │
│                    ┌──────────────────┐                      │
│                    │  PostgreSQL      │                      │
│                    │  - Create tables │                      │
│                    │  - Add indexes   │                      │
│                    │  - Load data     │                      │
│                    └──────────────────┘                      │
│                                                              │
│  Lần 2 (Update Schema: New tables, columns, constraints):    │
│  ┌────────────┐   ┌──────────────┐  ┌──────────────┐         │
│  │ New schema │   │ Create v0002 │  │ Alembic      │         │
│  │  changes   │─> │ migration    │─>│ upgrade head │         │
│  │  needed    │   │ (auto-gen)   │  │              │         │
│  └────────────┘   └──────────────┘  └──────────────┘         │
│                                           │                  │
│                                           v                  │
│                                  ┌──────────────────┐        │
│                                  │  PostgreSQL      │        │
│                                  │  - Alter tables  │        │
│                                  │  - Add columns   │        │
│                                  │  - Drop indexes  │        │
│                                  └──────────────────┘        │
│                                                              │
│  Rollback (When Needed):                                     │
│  ┌────────────┐       ┌──────────────────┐                   │
│  │ Downgrade  │──────>│  Alembic         │                   │
│  │ to v0001   │       │  downgrade v0001 │                   │
│  └────────────┘       └──────────────────┘                   │
│                              │                               │
│                              v                               │
│                    ┌──────────────────┐                      │
│                    │  PostgreSQL      │                      │
│                    │  - Revert tables │                      │
│                    │  - Restore data  │                      │
│                    └──────────────────┘                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## PHẦN 2: XỬ LÝ DỮ LIỆU LOẠI GÌ?

### 2.1 Loại Dữ Liệu Mà Schema Workflow Xử Lý

Schema Workflow **KHÔNG** xử lý dữ liệu thực tế (rows), mà xử lý **cấu trúc** database.

#### ✓ YÊU CẦU VỀ CẤU TRÚC

**2.1.1 Tables** - Định nghĩa bảng và cột
```python
# Ví dụ: users table
CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(50) NOT NULL UNIQUE,
	email VARCHAR(100) NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2.1.2 Constraints (Ràng Buộc)** - Định nghĩa ràng buộc dữ liệu
```python
# Primary Key: Khóa chính
# UNIQUE: Không trùng lặp
# NOT NULL: Không được NULL
# CHECK: Giá trị phải thỏa điều kiện
# FOREIGN KEY: Liên kết với bảng khác

# Ví dụ:
CREATE TABLE friends (
	user_id INT NOT NULL,
	friend_id INT NOT NULL,
	PRIMARY KEY (user_id, friend_id),
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	CHECK (user_id != friend_id)  -- A user can't be friend with themselves
);
```

**2.1.3 Indexes (Chỉ Mục)** - Tăng tốc độ truy vấn
```python
# Tăng tốc độ query
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_friends_user_id ON friends(user_id);
```

**2.1.4 Extensions** - Mở rộng tính năng PostgreSQL
```python
# PostgreSQL extensions cần dùng
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- Tạo UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- Mã hóa
```

**2.1.5 Data Types (Kiểu Dữ Liệu)** - Định nghĩa kiểu dữ liệu cho cột
```python
SERIAL          # Auto-increment integer
VARCHAR(n)      # String với độ dài max n
TEXT            # String không giới hạn độ dài
INTEGER         # Số nguyên
TIMESTAMP       # Thời gian
UUID            # UUID identifier
BOOLEAN         # True/False
```

### 2.2 Dữ Liệu Mà Schema Workflow KHÔNG Xử Lý

```
❌ Dữ liệu thực tế (rows):
   - INSERT VALUES ('john', 'john@example.com')
   - UPDATE users SET username = 'jane'
   - DELETE FROM users WHERE id = 1

   → Đây là công việc của SEED workflow (hoặc một workflow khác)

❌ Queries lấy dữ liệu:
   - SELECT * FROM users
   - SELECT COUNT(*) FROM albums

   → Đây là công việc của application code

❌ Permissions/Roles:
   - GRANT SELECT ON users TO user_role

   → Không thuộc Schema Workflow
```

### 2.3 Real-World Example: SISE Database Structure

Từ file `schema_0001_create_storage_schema.py`:

```
SISE Database có 4 bảng chính:

┌─────────────────────────────────────────────────────────┐
│                   SISE Database Schema                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. users (người dùng)                                  │
│     - id: int (primary key)                             │
│     - username: string (unique)                         │
│     - email: string (unique)                            │
│     - password_hash: text                               │
│     - created_at: timestamp                             │
│                                                         │
│  2. friends (quan hệ kết bạn)                           │
│     - user_id: int (FK → users)                         │
│     - friend_id: int (FK → users)                       │
│     - created_at: timestamp                             │
│     - Constraint: user_id ≠ friend_id                   │
│                                                         │
│  3. albums (album ảnh)                                  │
│     - id: int (primary key)                             │
│     - user_id: int (FK → users)                         │
│     - title: string                                     │
│     - description: text (nullable)                      │
│     - created_at: timestamp                             │
│                                                         │
│  4. images (ảnh)                                        │
│     - id: int (primary key)                             │
│     - album_id: int (FK → albums)                       │
│     - original_url: string (MinIO)                      │
│     - thumbnail_url: string (MinIO)                     │
│     - created_at: timestamp                             │
│                                                         │
│ (...Có thể mở rộng thêm...)                             │
│                                                         │
└─────────────────────────────────────────────────────────┘

Quan hệ:
users (1) ─── (N) friends ─── (1) users
users (1) ─── (N) albums
albums (1) ─── (N) images
```

---

## PHẦN 3: THÀNH PHẦN CẦN THIẾT

### 3.1 Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                  SCHEMA WORKFLOW ARCHITECTURE                  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Layer 1: ENTITIES (Định nghĩa dữ liệu đầu vào)                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ schema_entities.py                                      │   │
│  │ ┌──────────────┐    ┌───────────────────────────┐       │   │
│  │ │PostgresConfig│    │ SchemaConfig              │       │   │
│  │ │              │    │                           │       │   │
│  │ │ database_url │    │ migration_tool="alembic"  │       │   │
│  │ │              │    │ target_revision="head"    │       │   │ 
│  │ │              │    │ downgrade_revision="base" │       │   │
│  │ │              │    │ extensions=[...]          │       │   │
│  │ └──────────────┘    └───────────────────────────┘       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              O                                 │
│                              │ dùng                            │
│                              │                                 │
│  Layer 2: SERVICES (Orchestration logic)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ schema_services.py                                      │   │
│  │                                                         │   │
│  │ • run_schema_migrations(postgres_config, schema_config) │   │
│  │   - Gọi adapters để build Alembic config                │   │
│  │   - Gọi adapters để chạy migration                      │   │
│  │                                                         │   │
│  │ • downgrade_schema(postgres_config, schema_config)      │   │
│  │   - Rollback đến revision cũ                            │   │
│  │                                                         │   │
│  │ • _resolve_migration_path()                             │   │
│  │   - Tìm folder migrations                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              O                                 │
│                              │ gọi                             │
│                              │                                 │
│  Layer 3: ADAPTERS (Low-level operations)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ schema_adapters.py                                      │   │
│  │                                                         │   │
│  │ • build_alembic_config(script_location, database_url)   │   │
│  │   - Tạo Config object cho Alembic                       │   │
│  │                                                         │   │
│  │ • run_upgrade(config, revision)                         │   │
│  │   - Gọi: command.upgrade(config, revision)              │   │
│  │   - Chạy migration lên revision                         │   │
│  │                                                         │   │
│  │ • run_downgrade(config, revision)                       │   │
│  │   - Gọi: command.downgrade(config, revision)            │   │
│  │   - Rollback xuống revision                             │   │
│  │                                                         │   │
│  │ • create_postgres_engine(database_url)                  │   │
│  │   - Tạo SQLAlchemy engine                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              O                                 │
│                              │ dùng                            │
│                              │                                 │
│  Layer 4: EXTERNAL TOOLS & CONFIG                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Alembic                                                 │   │
│  │ ├── schema_alembic.ini                                  │   │
│  │ │   - Cấu hình Alembic                                  │   │
│  │ │   - Script location = migrations/                     │   │
│  │ │   - Database URL                                      │   │
│  │ │                                                       │   │
│  │ └── migrations/                                         │   │
│  │     ├── env.py                                          │   │
│  │     │   - Runtime environment cho Alembic               │   │
│  │     │   - Đọc DATABASE_URL từ environment               │   │
│  │     │   - Chạy migrations online hoặc offline           │   │
│  │     │                                                   │   │
│  │     └── versions/                                       │   │
│  │         └── schema_0001_create_storage_schema.py        │   │
│  │             - Migration file                            │   │
│  │             - upgrade() function                        │   │
│  │             - downgrade() function                      │   │
│  │                                                         │   │
│  │ SQLAlchemy                                              │   │
│  │ └── Kết nối và thực thi SQL                             │   │
│  │                                                         │   │
│  │ PostgreSQL                                              │   │
│  │ └── Database thực tế                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              O                                 │
│                              │                                 │
│  Layer 5: ROUTERS (Entrypoint)                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ schema_routers.py                                        │  │
│  │                                                          │  │
│  │ SchemaWorkflowRouter:                                    │  │
│  │   • upgrade_schema() - Gọi services.run_schema_migrations│  │
│  │   • downgrade_schema() - Gọi services.downgrade_schema   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              O                                 │
│                              │ gọi                             │
│                              │                                 │
│  Layer 6: ENTRY POINT (storage_main.py)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ storage_main.py                                         │   │
│  │                                                         │   │
│  │ if command == 'schema':                                 │   │
│  │   router = SchemaWorkflowRouter(...)                    │   │
│  │   router.upgrade_schema()                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 Files & Components Chi Tiết

#### **A. ENTITY LAYER** 
```
schema_entities.py
├── PostgresConfig
│   ├── database_url: str  # postgresql://user:pass@localhost:5432/sise
│   └── Định nghĩa config kết nối DB
│
└── SchemaConfig
	├── migration_tool: str  # "alembic"
	├── target_revision: str  # "head" (latest version)
	├── downgrade_revision: str  # "base" (initial state)
	└── extensions: List[str]  # ["uuid-ossp", "pgcrypto"]
```

**Ví dụ sử dụng**:
```python
postgres_config = PostgresConfig(
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)

schema_config = SchemaConfig(
	migration_tool="alembic",
	target_revision="head",  # Lên phiên bản mới nhất
	downgrade_revision="base",  # Rollback về lúc đầu
	extensions=["uuid-ossp", "pgcrypto"]  # Extensions cần
)
```

#### **B. ADAPTER LAYER**
```
schema_adapters.py
├── build_alembic_config(script_location, database_url)
│   ├── Input: Nơi migrations, URL DB
│   └── Output: Config object cho Alembic
│
├── run_upgrade(config, revision)
│   ├── Input: Config, revision target
│   └── Action: Chạy migration lên
│
├── run_downgrade(config, revision)
│   ├── Input: Config, revision target
│   └── Action: Rollback migration xuống
│
└── create_postgres_engine(database_url)
	├── Input: Database URL
	└── Output: SQLAlchemy Engine để kết nối
```

**Ví dụ sử dụng**:
```python
# Bước 1: Build config
alembic_config = schema_adapters.build_alembic_config(
	script_location="modules/StorageModule/migrations",
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)

# Bước 2: Chạy migration
schema_adapters.run_upgrade(alembic_config, "head")

# Hoặc rollback
schema_adapters.run_downgrade(alembic_config, "base")
```

#### **C. SERVICE LAYER**
```
schema_services.py
├── run_schema_migrations(postgres_config, schema_config)
│   ├── 1. Kiểm tra migration_tool = "alembic"
│   ├── 2. Tìm migrations folder
│   ├── 3. Build Alembic config
│   ├── 4. Run upgrade
│   └── Mục đích: Orchestrate toàn bộ migration
│
└── downgrade_schema(postgres_config, schema_config)
	├── 1. Kiểm tra migration_tool
	├── 2. Tìm migrations folder
	├── 3. Build Alembic config
	├── 4. Run downgrade
	└── Mục đích: Orchestrate rollback
```

**Ví dụ sử dụng**:
```python
# Upgrade schema
schema_services.run_schema_migrations(postgres_config, schema_config)

# Downgrade schema
schema_services.downgrade_schema(postgres_config, schema_config)
```

#### **D. ROUTER LAYER**
```
schema_routers.py
├── SchemaWorkflowRouter(postgres_config, schema_config)
│   ├── __init__(postgres_config, schema_config)
│   │   └── Lưu configs
│   │
│   ├── upgrade_schema()
│   │   └── Gọi services.run_schema_migrations()
│   │
│   └── downgrade_schema()
│       └── Gọi services.downgrade_schema()
```

**Ví dụ sử dụng**:
```python
router = SchemaWorkflowRouter(postgres_config, schema_config)
router.upgrade_schema()  # Chạy migration
# hoặc
router.downgrade_schema()  # Rollback
```

#### **E. MIGRATION FILES**
```
📁 migrations/
├── env.py
│   ├── get_database_url(): str
│   │   └── Đọc DATABASE_URL từ environment
│   │
│   ├── run_migrations_offline()
│   │   └── Generate migration script (không kết nối DB)
│   │
│   └── run_migrations_online()
│       ├── Kết nối Database
│       └── Chạy migration scripts
│
└── 📁 versions/
	└── schema_0001_create_storage_schema.py
		├── upgrade()
		│   ├── CREATE EXTENSION "uuid-ossp"
		│   ├── CREATE EXTENSION "pgcrypto"
		│   ├── CREATE TABLE users
		│   ├── CREATE TABLE friends
		│   ├── CREATE TABLE albums
		│   ├── CREATE TABLE images
		│   ├── CREATE INDEX indexes
		│   └── INSERT INTO alembic_version
		│
		└── downgrade()
			└── DROP all tables and revert
```

**Ví dụ: Phần upgrade() - Tạo bảng users**
```python
def upgrade() -> None:
	# 1. Tạo extensions
	op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
	op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

	# 2. Tạo bảng users
	op.create_table(
		"users",
		sa.Column("id", sa.Integer(), primary_key=True),
		sa.Column("username", sa.String(50), unique=True),
		sa.Column("email", sa.String(100), unique=True),
		sa.Column("password_hash", sa.Text()),
		sa.Column("created_at", sa.DateTime(), default=sa.func.now()),
	)

	# 3. Tạo bảng friends
	op.create_table("friends", ...)

	# 4. Tạo bảng albums
	op.create_table("albums", ...)

	# 5. Tạo bảng images
	op.create_table("images", ...)

	# 6. Tạo indexes
	op.create_index("idx_users_email", "users", ["email"])
	op.create_index("idx_albums_user_id", "albums", ["user_id"])
	# ... etc
```

#### **F. CONFIGURATION**
```
schema_alembic.ini
├── [alembic]
│   ├── script_location = migrations
│   │   └── Folder chứa migrations
│   │
│   └── sqlalchemy.url = driver://user:pass@host/db
│       └── Database URL (được override bởi env.py)
│
└── [loggers]
	└── Cấu hình logging cho Alembic
```

#### **G. ENVIRONMENT CONFIGURATION**
```
configs/storage.env.local
├── DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sise
│
├── SCHEMA_MIGRATION_TOOL=alembic
├── SCHEMA_TARGET_REVISION=head
├── SCHEMA_DOWNGRADE_REVISION=base
└── SCHEMA_EXTENSIONS=uuid-ossp,pgcrypto
```

---

## PHẦN 4: FLOW THỰC TẾ - QUY TRÌNH HOẠT ĐỘNG

### 4.1 Scenario 1: First Time Setup (Lần Đầu)

```
┌─────────────────────────────────────────────────────────────┐
│         FIRST TIME SETUP - Flow chi tiết                    │
└─────────────────────────────────────────────────────────────┘

1️⃣ USER RUN COMMAND:
   py -3.13 storage_main.py schema

2️⃣ storage_main.py:
   - Đọc args: command = "schema"
   - Load env vars từ storage.env.local
   - Tạo PostgresConfig:
	 database_url = "postgresql://postgres:postgres@localhost:5432/sise"
   - Tạo SchemaConfig:
	 migration_tool = "alembic"
	 target_revision = "head"
	 downgrade_revision = "base"
	 extensions = ["uuid-ossp", "pgcrypto"]
   - Tạo SchemaWorkflowRouter(postgres_config, schema_config)

3️⃣ schema_routers.py - SchemaWorkflowRouter.upgrade_schema():
   - Gọi: schema_services.run_schema_migrations(postgres_config, schema_config)

4️⃣ schema_services.py - run_schema_migrations():
   - Kiểm tra: migration_tool == "alembic" ✓
   - Gọi: _resolve_migration_path()
	 → Trả về: "modules/StorageModule/migrations"
   - Gọi: schema_adapters.build_alembic_config(
	   script_location = "modules/StorageModule/migrations",
	   database_url = "postgresql://postgres:postgres@localhost:5432/sise"
	 )
   - Gọi: schema_adapters.run_upgrade(alembic_config, "head")

5️⃣ schema_adapters.py - run_upgrade():
   - Gọi: command.upgrade(config, "head")
   - Alembic bắt đầu hoạt động

6️⃣ Alembic (migrations/env.py) - run_migrations_online():
   - Đọc DATABASE_URL từ environment
   - Tạo connection đến PostgreSQL
   - Tìm file migrations/versions/schema_0001_create_storage_schema.py
   - Gọi upgrade() function

7️⃣ migration file - upgrade():
   ✓ CREATE EXTENSION "uuid-ossp"
   ✓ CREATE EXTENSION "pgcrypto"
   ✓ CREATE TABLE users
   ✓ CREATE TABLE friends
   ✓ CREATE TABLE albums
   ✓ CREATE TABLE images
   ✓ CREATE INDEXES
   ✓ Ghi vào bảng alembic_version: 0001_create_storage_schema

8️⃣ DATABASE STATE:
   Before:
   - Database "sise" trống
   - Không có tables

   After:
   - users (columns: id, username, email, password_hash, created_at)
   - friends (columns: user_id, friend_id, created_at)
   - albums (columns: id, user_id, title, description, created_at)
   - images (columns: id, album_id, original_url, thumbnail_url, created_at)
   - alembic_version (tracks version: 0001_create_storage_schema)
   - Indexes trên email, user_id, album_id
   - Extensions: uuid-ossp, pgcrypto

COMPLETE: Schema setup thành công
```

### 4.2 Scenario 2: Add New Column (Thêm cột mới)

```
SITUATION: Cần thêm column "is_verified" vào users table

STEPS:

1️⃣ Create new migration:
   alembic revision --autogenerate -m "add is_verified to users"

   → Tạo file mới:
	 migrations/versions/schema_0002_add_is_verified_to_users.py

2️⃣ migration file sẽ có (auto-generated):
   def upgrade() -> None:
	   op.add_column('users', 
		   sa.Column('is_verified', sa.Boolean(), default=False)
	   )

   def downgrade() -> None:
	   op.drop_column('users', 'is_verified')

3️⃣ Run migration:
   py -3.13 storage_main.py schema

   → Gọi: schema_services.run_schema_migrations()
   → upgrade đến "head" (v0002)
   → users table sẽ có column is_verified

4️⃣ DATABASE STATE:
   alembic_version: 0002_add_is_verified_to_users
   users table: id, username, email, password_hash, created_at, is_verified
```

### 4.3 Scenario 3: Rollback (Quay lại phiên bản cũ)

```
SITUATION: Version 0002 có bug, cần rollback về 0001

STEPS:

1️⃣ USER RUN COMMAND:
   py -3.13 storage_main.py schema --downgrade

   Hoặc manual qua code:
   router.downgrade_schema()

2️⃣ schema_services.py - downgrade_schema():
   - Kiểm tra: migration_tool == "alembic" ✓
   - Gọi: schema_adapters.run_downgrade(config, "base")

   "base" = initial state (trước 0001)

3️⃣ Alembic runs migration/versions/schema_0002_add_is_verified_to_users.py:
   def downgrade() -> None:
	   op.drop_column('users', 'is_verified')

4️⃣ DATABASE STATE:
   alembic_version: 0001_create_storage_schema
   users table: id, username, email, password_hash, created_at
   (is_verified column bị xóa)

Rollback successful!
```

---

## PHẦN 5: FILES CHECKLIST

Để Schema Workflow hoạt động ổn định, cần có:

### BẮT NHÂN:

```
✓ 1. schema_entities.py
	 ├── PostgresConfig (dataclass)
	 └── SchemaConfig (dataclass)
	 Vị trí: modules/StorageModule/app/entities/

✓ 2. schema_adapters.py
	 ├── build_alembic_config()
	 ├── run_upgrade()
	 ├── run_downgrade()
	 └── create_postgres_engine()
	 Vị trí: modules/StorageModule/app/adapters/

✓ 3. schema_services.py
	 ├── run_schema_migrations()
	 ├── downgrade_schema()
	 └── _resolve_migration_path()
	 Vị trí: modules/StorageModule/app/services/

✓ 4. schema_routers.py
	 └── SchemaWorkflowRouter
		 ├── upgrade_schema()
		 └── downgrade_schema()
	 Vị trí: modules/StorageModule/app/routers/

✓ 5. migrations/env.py
	 ├── get_database_url()
	 ├── run_migrations_offline()
	 └── run_migrations_online()
	 Vị trí: modules/StorageModule/migrations/

✓ 6. migrations/versions/schema_0001_create_storage_schema.py
	 ├── upgrade()
	 └── downgrade()
	 Vị trí: modules/StorageModule/migrations/versions/

✓ 7. schema_alembic.ini
	 ├── [alembic] section
	 ├── script_location = migrations
	 └── sqlalchemy.url
	 Vị trí: modules/StorageModule/

✓ 8. configs/storage.env.local
	 ├── DATABASE_URL
	 ├── SCHEMA_MIGRATION_TOOL
	 ├── SCHEMA_TARGET_REVISION
	 ├── SCHEMA_DOWNGRADE_REVISION
	 └── SCHEMA_EXTENSIONS
	 Vị trí: modules/StorageModule/configs/
```

### EXTERNAL DEPENDENCIES:

```
✓ PostgreSQL 16 (installed locally)
  ├── Running trên port 5432
  └── Database "sise" created

✓ Python 3.13.12
  ├── alembic>=1.12
  ├── sqlalchemy
  ├── psycopg[binary]
  └── (xem storage_requirements.txt)

✓ Docker Container (hoặc local install)
  ├── PostgreSQL service running
  └── Database accessible at postgresql://localhost:5432
```
 
---

## PHẦN 6: COMMON OPERATIONS

### 6.1 Run Migration

```python
# Code way:
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
router.upgrade_schema()  # ✓ Schema created!

# Command way:
py -3.13 storage_main.py schema
```

### 6.2 Rollback Migration

```python
# Code way:
router.downgrade_schema()  # ✓ Schema reverted!

# Command way:
py -3.13 storage_main.py schema --downgrade
```

### 6.3 Check Migration Status

```bash
# See current version
psql -U postgres -d sise -c "SELECT version FROM alembic_version;"

# See what migrations exist
ls modules/StorageModule/migrations/versions/
```

### 6.4 Create New Migration

```bash
cd modules/StorageModule
alembic revision --autogenerate -m "description of change"

# Manually edit if needed
# Then run: py -3.13 storage_main.py schema
```

---

## SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                   SCHEMA WORKFLOW SUMMARY                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Chức năng:                                                │
│   - Khởi tạo & quản lý database structure                   │
│   - Upgrade/downgrade schemas safely                        │
│   - Track thay đổi qua migration versions                   │
│                                                             │
│   Xử lý dữ liệu:                                            │
│   - Tables, columns, constraints, indexes, extensions       │
│   - KHÔNG xử lý: Actual data rows (dành cho Seed)           │
│                                                             │
│   Thành phần chính:                                         │
│   1. Entities: PostgresConfig, SchemaConfig                 │
│   2. Adapters: Alembic operations (upgrade/downgrade)       │
│   3. Services: Orchestration logic                          │
│   4. Routers: Entry points (upgrade_schema, downgrade)      │
│   5. Migrations: SQL templates (upgrade, downgrade)         │
│   6. Config: schema_alembic.ini, storage.env.local          │
│                                                             │
│   Quy trình:                                                │
│   User command → Router → Service → Adapter → Alembic       │
│   → env.py → PostgreSQL → Database structure changed        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## NEXT: Collection Workflow

Sau khi hiểu Schema Workflow, ta sẵn sàng học:
- **Collection Workflow**: Tạo Milvus vector collections
- **Bucket Workflow**: Tạo MinIO storage buckets
- **Seed Workflow**: Insert sample data

Mỗi workflow follow cùng pattern: Entity → Adapter → Service → Router

