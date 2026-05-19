# Schema Workflow - Quick Guide

**Mục đích**: Giới thiệu nhanh Schema Workflow cho newcomer muốn nắm bắt cốt lõi trong 10-15 phút.

**Đối tượng**: Junior developer, newcomer tham gia dự án, người muốn "big picture"

**Thời gian đọc**: 10-15 phút

---

## 1. Schema Workflow này là gì? Nó được thiết kế như thế nào?

### Định nghĩa

**Schema Workflow** là quy trình tạo và quản lý cấu trúc cơ sở dữ liệu PostgreSQL cho SISE. Nó sử dụng **Alembic** (migration tool) để tự động hoá việc tạo tables, indexes, extensions, và đảm bảo tính nhất quán giữa các môi trường.

**Vai trò**: Bridge đầu tiên trong StorageModule - tất cả workflows khác (Collection, Bucket, Seed) đều phụ thuộc vào Schema đã được thiết lập.

### Quy trình cơ bản (5 bước)

1. **Configuration Setup**: Đọc database URL từ environment variables hoặc config files
2. **Alembic Initialization**: Xây dựng Alembic config (script location, database connection)
3. **Migration Upgrade**: Chạy tất cả migrations (tạo tables, indexes, extensions)
4. **Schema Validation**: Kiểm tra tất cả objects được tạo thành công
5. **Ready for Next Workflows**: Schema sẵn sàng cho Collection, Bucket, Seed workflows

### Kiến trúc đơn giản

```
Config Files (.env) / Database URL
		↓
PostgresConfig Entity (holds connection URL)
		↓
SchemaAdapter (Alembic wrapper)
		↓
SchemaService (orchestrate upgrade/downgrade)
		↓
SchemaRouter (public API)
		↓
PostgreSQL Database (tables/indexes created)
```

---

## 2. Schema Workflow làm việc với dữ liệu gì? Input/Output là gì?

### Input

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Environment Variables** | DATABASE_URL (PostgreSQL connection string) | `postgresql://user:pass@localhost/sise_db` |
| **Migration Files** | Alembic migration scripts (SQL/Python) | `/migrations/versions/001_create_users.py` |
| **Configuration** | Migration tool name, target revision | `alembic`, `head` (latest) |
| **External Service** | PostgreSQL server (đang chạy, có quyền truy cập) | localhost:5432 hoặc cloud instance |

### Output

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **Primary Output** | PostgreSQL database schema (tables, indexes, constraints) | Tables: `users`, `images`, `privacy_rules`, etc. |
| **Side Effects** | Migration history log, version tracking | Alembic alembic_version table |
| **State Changes** | PostgreSQL từ "no schema" → "ready for queries" | Database ready for Collection/Bucket/Seed workflows |

### Dữ liệu được xử lý

- **Loại**: SQL schema definitions, metadata
- **Định dạng**: Python Alembic scripts hoặc raw SQL
- **Kích thước**: Tối đa ~100 MB (schema definitions)
- **Tần suất**: Một lần (setup), sau đó chỉ khi có schema changes

---

## 3. Các thành phần trọng tâm của Schema Workflow?

### 4 thành phần chính

| Thành phần | Chức năng | Loại |
|-----------|---------|------|
| **PostgresConfig** | Lưu trữ database URL, connection string | Config Entity |
| **SchemaAdapter** | Tương tác với Alembic, chạy upgrade/downgrade | Adapter |
| **SchemaService** | Điều phối quy trình migration, kiểm tra | Service |
| **SchemaRouter** | Cung cấp public API (upgrade_schema, downgrade_schema) | Router |

### Mối quan hệ

```
.env file (DATABASE_URL)
	↓
PostgresConfig (loads & holds)
	↓
SchemaAdapter (wraps Alembic)
	↓
SchemaService (orchestrates)
	↓
SchemaRouter (exposes API)
	↓
External Callers (tests, initialization scripts)
```

---

## Quick Checklist

Để khởi động Schema Workflow:

- [ ] PostgreSQL server đang chạy (localhost:5432 hoặc cloud)
- [ ] DATABASE_URL environment variable được set
- [ ] Alembic migrations folder tồn tại (`/migrations/versions/`)
- [ ] Có quyền truy cập để tạo tables/indexes
- [ ] Migration files hợp lệ (Python/SQL syntax)
- [ ] Run upgrade: `python scripts/setup_schema.py` hoặc `SchemaRouter.upgrade_schema()`

---

## Bước tiếp theo

- **Muốn hiểu chi tiết hơn?** → Xem `SCHEMA_WORKFLOW_DEEP_GUIDE.md`
- **Cần tra cứu file/config?** → Xem `SCHEMA_WORKFLOW_REFERENCES.md`
- **Muốn xem code mẫu?** → Xem `SCHEMA_WORKFLOW_REFERENCES.md` section 5 (API Reference)

---

## Tài liệu liên quan

- **Collection Workflow** (tiếp theo): Phụ thuộc vào Schema để setup Milvus collection
- **Storage Architecture**: Xem `../INDEX.md` để hiểu tất cả workflows
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Alembic Docs**: https://alembic.sqlalchemy.org/
