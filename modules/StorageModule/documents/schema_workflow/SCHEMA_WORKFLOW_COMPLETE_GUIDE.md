# SCHEMA WORKFLOW - COMPREHENSIVE LEARNING GUIDE

---

## TÀI LIỆU 1: SCHEMA_WORKFLOW_TUTORIAL.md

**Đây là tài liệu chính - PHẢI ĐỌC TRƯỚC**

Nội dung:
```
PHẦN 1: Schema Workflow Là Gì?
├─ 1.1 Định Nghĩa & Chức Năng
├─ 1.2 Tại Sao Cần Schema Workflow?
└─ 1.3 Quy Trình Hoạt Động

PHẦN 2: Xử Lý Dữ Liệu Loại Gì?
├─ 2.1 Loại Dữ Liệu Schema Xử Lý (Tables, Constraints, Indexes, Extensions)
├─ 2.2 Dữ Liệu KHÔNG Xử Lý (Actual data, Queries, Permissions)
└─ 2.3 Real-World Example: SISE Database Structure

PHẦN 3: Thành Phần Cần Thiết (FILES CHECKLIST)
├─ 3.1 Architecture Diagram (6-layer)
├─ 3.2 Files & Components Chi Tiết:
│   ├─ A. ENTITY LAYER (schema_entities.py)
│   ├─ B. ADAPTER LAYER (schema_adapters.py)
│   ├─ C. SERVICE LAYER (schema_services.py)
│   ├─ D. ROUTER LAYER (schema_routers.py)
│   ├─ E. MIGRATION FILES (migrations/env.py, versions/)
│   ├─ F. CONFIGURATION (schema_alembic.ini)
│   └─ G. ENVIRONMENT CONFIG (storage.env.local)

PHẦN 4: Flow Thực Tế - Quy Trình Hoạt Động
├─ 4.1 Scenario 1: First Time Setup
├─ 4.2 Scenario 2: Add New Column
└─ 4.3 Scenario 3: Rollback

PHẦN 5: Files Checklist (What You Need)
PHẦN 6: Common Operations (Run, Rollback, Check, Create)
```

**START HERE: Đọc file này từ đầu đến cuối**

---

## TÀI LIỆU 2: SCHEMA_WORKFLOW_EXAMPLES.md

**Tài liệu này chứa CODE EXAMPLES - Giúp hiểu code thực tế**

Nội dung:
```
PART 1: ENTITIES - Định Nghĩa Dữ Liệu
├─ Ví dụ 1: Tạo Config Objects
└─ Ví dụ 2: Đọc từ Environment Variables

PART 2: ADAPTERS - Low-Level Operations
├─ Ví dụ 1: Build Alembic Config
├─ Ví dụ 2: Create PostgreSQL Engine
├─ Ví dụ 3: Run Migration Upgrade
└─ Ví dụ 4: Run Migration Downgrade

PART 3: SERVICES - Orchestration Logic
├─ Ví dụ 1: Run Schema Migrations
└─ Ví dụ 2: Downgrade Schema

PART 4: ROUTERS - Entry Points
├─ Ví dụ 1: Create Router & Upgrade
└─ Ví dụ 2: Downgrade

PART 5: MIGRATION FILES - SQL Execution
└─ Ví dụ: Database Changes Trước & Sau

PART 6: COMPLETE FLOW - All Layers Together
└─ Scenario: First-Time Database Setup (Chi tiết từng bước)
```

**THEN READ: Đọc để thấy code thực tế làm gì**

---

## TÀI LIỆU 3: SCHEMA_WORKFLOW_QUICK_REFERENCE.md

**Tài liệu này là QUICK LOOKUP - Khi cần tra cứu nhanh**

Nội dung:
```
├─ TÓM TẮT 3 CÂU
├─ FILES LOCATION (Nơi tất cả files)
├─ EXECUTION FLOW (Quy trình chạy)
├─ DATABASE STRUCTURE (Cấu trúc DB SISE)
├─ COMMON COMMANDS (Lệnh hay dùng)
├─ CONFIGURATION (Env vars & Alembic config)
├─ 5-LAYER ARCHITECTURE (Kiến trúc)
├─ KEY CONCEPTS (Thuật ngữ quan trọng)
├─ DEBUGGING (Lỗi thường gặp & cách fix)
├─ RELATED DOCUMENTS (Tài liệu liên quan)
├─ WORKFLOW PURPOSE (Tóm tắt mục đích)
└─ LEARNING CHECKLIST (Bạn đã hiểu gì?)
```

**USE FOR: Tra cứu nhanh khi cần**

---

## LEARNING PATH (Thứ Tự Học Khuyến Nghị)

### Step 1: Những Điều Cần Nắm Bắt (10 phút)
```
Đọc: SCHEMA_WORKFLOW_QUICK_REFERENCE.md
	 └─ Sections: TÓM TẮT, WORKFLOW PURPOSE, 5-LAYER ARCHITECTURE

Bạn sẽ biết:
✓ Schema Workflow làm gì
✓ Nó gồm 5 layers
✓ Database structure như thế nào
```

### Step 2: Chi Tiết (30 phút)
```
Đọc: SCHEMA_WORKFLOW_TUTORIAL.md từ đầu đến cuối
	 └─ Đặc biệt: PHẦN 3 (Thành phần cần thiết)

Bạn sẽ hiểu:
✓ Mỗi file làm gì
✓ Làm thế nào nó hoạt động
✓ Tại sao cần 5 layers
```

### Step 3: Code Examples (20 phút)
```
Đọc: SCHEMA_WORKFLOW_EXAMPLES.md từ đầu đến cuối
	 └─ Đặc biệt: PART 6 (Complete Flow)

Bạn sẽ hiểu:
✓ Code thực tế làm gì
✓ Mỗi function trả về gì
✓ Flow từ CLI đến Database
```

### Step 4: Tra Cứu (On-Demand)
```
Khi cần:
✓ Tên file ở đâu? → SCHEMA_WORKFLOW_QUICK_REFERENCE.md
✓ Lỗi gì xảy ra? → SCHEMA_WORKFLOW_QUICK_REFERENCE.md → DEBUGGING
✓ Cú pháp gì? → SCHEMA_WORKFLOW_EXAMPLES.md
```

---

## TRẢ LỜI 3 CÂU HỎI CỦA BẠN

### Q1: Schema Workflow Có Chức Năng Gì, Tại Sao Cần?

**A:**
```
Chức Năng:
1. Khởi tạo database structure lần đầu
2. Upgrade schema khi có thay đổi
3. Downgrade/rollback khi cần
4. Track phiên bản cấu trúc database
5. Đảm bảo consistency across team

Tại Sao Cần:
- Cách cũ: Tạo SQL thủ công → khó quản lý, không track lịch sử
- Cách mới: Migrations → dễ version, dễ rollback, dễ cộng tác
- Không có: Khó scale, khó maintain, dễ xung đột team
- Có Schema Workflow: Professional, track được, dễ deploy
```

### Q2: Nó Xử Lý Dữ Liệu Loại Gì?

**A:**
```
✓ XỬ LÝ: Cấu trúc (Structure)
  - Tables (CREATE TABLE, ALTER TABLE, DROP TABLE)
  - Columns (ADD COLUMN, DROP COLUMN, MODIFY COLUMN)
  - Constraints (PRIMARY KEY, UNIQUE, FOREIGN KEY, CHECK)
  - Indexes (CREATE INDEX)
  - Extensions (CREATE EXTENSION)
  - Data types (SERIAL, VARCHAR, INTEGER, TIMESTAMP, etc)

✗ KHÔNG XỬ LÝ: Dữ liệu thực (Data)
  - INSERT rows
  - UPDATE rows
  - DELETE rows
  - SELECT queries
  - User permissions

Tại Sao?
- Schema = Bản thiết kế (Structure)
- Data = Dữ liệu thực tế (Records)
- Schema Workflow: Quản lý bản thiết kế
- Seed Workflow: Quản lý dữ liệu mẫu
```

### Q3: Những Thứ Cần Có Để Hoạt Động Ổn Định?

**A:**
```
TIER 1: PYTHON CODE (Trong StorageModule)
├─ schema_entities.py (Định nghĩa config)
├─ schema_adapters.py (Gọi thư viện)
├─ schema_services.py (Orchestration)
├─ schema_routers.py (Entry point)
└─ storage_main.py (CLI dispatcher)

TIER 2: DATABASE LAYER (Trong migrations/)
├─ migrations/env.py (Runtime environment)
├─ migrations/versions/
│   └─ schema_0001_create_storage_schema.py (SQL templates)
└─ schema_alembic.ini (Alembic config)

TIER 3: CONFIGURATION (Trong configs/)
├─ storage.env.local (Environment vars)
│   ├─ DATABASE_URL
│   ├─ SCHEMA_MIGRATION_TOOL
│   ├─ SCHEMA_TARGET_REVISION
│   ├─ SCHEMA_DOWNGRADE_REVISION
│   └─ SCHEMA_EXTENSIONS
└─ storage_requirements.txt (Dependencies)
   ├─ alembic>=1.12
   ├─ sqlalchemy
   ├─ psycopg[binary]
   └─ postgres driver

TIER 4: EXTERNAL SYSTEMS (Phải có sẵn)
├─ PostgreSQL 16 (Database server)
│   └─ Running on localhost:5432
├─ Alembic (Migration tool)
│   └─ Manages database versions
└─ SQLAlchemy (ORM)
	└─ Handles connections

TIER 5: INFRASTRUCTURE (Phải sẵn sàng)
└─ Network connection to PostgreSQL
```

---

## CHẠY SCHEMA WORKFLOW

### Trong 30 giây (Quick Start)

```python
from app.routers.schema_routers import SchemaWorkflowRouter
from app.entities.schema_entities import PostgresConfig, SchemaConfig

# 1. Config
postgres_config = PostgresConfig(
	database_url="postgresql://postgres:postgres@localhost:5432/sise"
)
schema_config = SchemaConfig(
	migration_tool="alembic",
	target_revision="head",
	downgrade_revision="base",
	extensions=["uuid-ossp", "pgcrypto"]
)

# 2. Create router
router = SchemaWorkflowRouter(postgres_config, schema_config)

# 3. Run upgrade
router.upgrade_schema()
print("✓ Database schema created!")

# 4. Or rollback
router.downgrade_schema()
print("✓ Database schema reverted!")
```

### Via CLI

```bash
# Start PostgreSQL (if not running)
.\modules\StorageModule\start_storage_stack.ps1 -Action up

# Run schema migration
py -3.13 storage_main.py schema

# Check result
psql -U postgres -d sise -c "SELECT version FROM alembic_version;"
```

---

## SUMMARY

```
        SCHEMA WORKFLOW - TỔNG HỢP TOÀN BỘ KIẾN THỨC         
                                                             
 TÊN: Schema Workflow                                        
 MỤC ĐÍCH: Quản lý database structure (tables, columns...)   
 TOOL: Alembic (migration management)                        
 DATABASE: PostgreSQL 16                                     
 LANGUAGE: Python 3.13                                       
                                                             
 DỮ LIỆU XỬ LÝ:                                              
  ✓ Database structure (tables, columns, constraints)        
  ✗ Actual data/rows (dành cho Seed Workflow)               
                                                             
 ARCHITECTURE:                                               
  Layer 1: ENTITIES (Config objects)                         
  Layer 2: ADAPTERS (Alembic operations)                     
  Layer 3: SERVICES (Orchestration)                          
  Layer 4: ROUTERS (Entry points)                            
  Layer 5: EXTERNAL (PostgreSQL, Alembic)                    
                                                             
 FILES CẦN CÓ:                                               
  1. schema_entities.py (Entities)                           
  2. schema_adapters.py (Adapters)                           
  3. schema_services.py (Services)                           
  4. schema_routers.py (Routers)                             
  5. migrations/env.py (Runtime)                             
  6. migrations/versions/schema_0001_*.py (SQL)              
  7. schema_alembic.ini (Config)                             
  8. storage.env.local (Env vars)                            
  + PostgreSQL 16 installed & running                        
  + Python 3.13 with alembic, sqlalchemy, psycopg installed  
                                                             
 WORKFLOW:                                                   
  Config → Entity → Service → Adapter → Alembic →            
  → env.py → PostgreSQL → Schema Applied ✓                   
                                                             
 COMMON OPERATIONS:                                          
  • Upgrade: router.upgrade_schema()                         
  • Downgrade: router.downgrade_schema()                     
  • Check version: psql ... SELECT version FROM...           
  • Create new migration: alembic revision --autogenerate    
                                                             
```

---

## TÀI LIỆU ĐI KÈM

| Tài Liệu | Dùng Khi | Thời Gian Đọc |
|----------|---------|--------------|
| `SCHEMA_WORKFLOW_TUTORIAL.md` | Muốn hiểu chi tiết | 30 phút |
| `SCHEMA_WORKFLOW_EXAMPLES.md` | Muốn xem code | 20 phút |
| `SCHEMA_WORKFLOW_QUICK_REFERENCE.md` | Muốn tra cứu nhanh | 5 phút |
| `TESTING_GUIDE.md` | Muốn test schema | 20 phút |
| `Skill_02.md` | Muốn xem issues | 10 phút |

---

## NEXT STEPS

1.  **Đọc** `SCHEMA_WORKFLOW_TUTORIAL.md` (30 phút)
2.  **Đọc** `SCHEMA_WORKFLOW_EXAMPLES.md` (20 phút)
3.  **Có** PostgreSQL running (xong rồi!)
4.  **Chạy** `py -3.13 storage_main.py schema` (kiểm tra hoạt động)
5.  **Học** Collection Workflow (tiếp theo)

---

**Happy Learning!**

