# [WORKFLOW_NAME] - Deep Guide

**Mục đích**: Tài liệu này cung cấp chi tiết toàn diện về [WORKFLOW_NAME] cho các developer chuyên sâu, các nhà kiến trúc hệ thống, và những người cần hiểu sâu sắc từng khía cạnh của workflow.

**Mức độ**: Advanced / Specialist-level
**Thời gian đọc**: 45-60 phút

---

## 1. Chi tiết: Workflow này là gì? Nó được thiết kế như thế nào?

### 1.1 Định nghĩa đầy đủ

**[WORKFLOW_NAME]** là [mô tả chi tiết về workflow]:
- **Mục tiêu chính**: [Mục tiêu 1, Mục tiêu 2, ...]
- **Phạm vi**: [Phạm vi hoạt động]
- **Vai trò trong hệ thống**: [Vị trí trong kiến trúc tổng thể]
- **Lịch sử thiết kế**: [Tại sao được thiết kế như vậy, quyết định thiết kế chính]

**Ví dụ cho Collection Workflow**:
- **Mục tiêu**: Tạo collection vector trong Milvus, cấu hình HNSW index, đảm bảo tính đơn điệu và hiệu suất tìm kiếm
- **Phạm vi**: Quản lý vòng đời collection từ creation → validation → ready-to-serve
- **Vai trò**: Bridge giữa PostgreSQL schema (Schema Workflow) và vector search layer (AG-03)
- **Lịch sử**: HNSW được chọn vì balance giữa độ chính xác (~99%) và tốc độ truy vấn (< 100ms)

### 1.2 Kiến trúc chi tiết (Detailed Architecture)

#### 1.2.1 Tầng lớp kiến trúc (Layered Architecture)

[WORKFLOW_NAME] tuân theo kiến trúc 5 tầng:

1. **Config Layer** (Configuration & Contracts)
   - **Chức năng**: Định nghĩa cấu hình, schema, tham số
   - **Trách nhiệm**: Quản lý version, validation, contract enforcement
   - **Ví dụ**: `collection_config.yaml`, environment variables

2. **Entity Layer** (Data Models & Config Objects)
   - **Chức năng**: Biểu diễn cấu trúc dữ liệu, config entities
   - **Trách nhiệm**: Type safety, data validation, immutability (nếu cần)
   - **Ví dụ**: `MilvusConfig`, `CollectionSchema`

3. **Adapter Layer** (External Integration)
   - **Chức năng**: Tương tác với external systems (Milvus, databases)
   - **Trách nhiệm**: API abstraction, error handling, retry logic
   - **Ví dụ**: `MilvusCollectionAdapter`, `MilvusConnectionPool`

4. **Service Layer** (Business Logic & Orchestration)
   - **Chức năng**: Điều phối quy trình, xử lý logic nghiệp vụ
   - **Trách nhiệm**: Workflow coordination, transaction management, idempotency
   - **Ví dụ**: `CollectionService`, `CollectionOrchestrator`

5. **Router Layer** (Public API Interface)
   - **Chức năng**: Expose entry points cho external callers
   - **Trách nhiệm**: Request routing, validation, response marshalling
   - **Ví dụ**: `CollectionRouter`, `collection_cli.py`

#### 1.2.2 Flow chi tiết (Detailed Process Flow)

```
┌─────────────────────────────────────────────────────────┐
│  External Caller (AG-03, CLI, Tests)                    │
└────────────────────┬────────────────────────────────────┘
					 |
					 v
┌─────────────────────────────────────────────────────────┐
│  Router Layer                                           │
│  - Request validation                                   │
│  - Input marshalling                                    │
└────────────────────┬────────────────────────────────────┘
					 |
					 v
┌─────────────────────────────────────────────────────────┐
│  Service Layer                                          │
│  - Step 1: [Process 1 chi tiết]                         │
│  - Step 2: [Process 2 chi tiết]                         │
│  - Step 3: [Process 3 chi tiết]                         │
│  - Transaction management                              │
└────────────────────┬────────────────────────────────────┘
					 |
					 v
┌─────────────────────────────────────────────────────────┐
│  Adapter Layer                                          │
│  - Adapter 1: [External system 1]                       │
│  - Adapter 2: [External system 2]                       │
│  - Connection pooling, retry logic                      │
└────────────────────┬────────────────────────────────────┘
					 |
					 v
┌─────────────────────────────────────────────────────────┐
│  External Systems (PostgreSQL, Milvus, etc.)            │
└─────────────────────────────────────────────────────────┘
```

#### 1.2.3 Quy trình chi tiết từng bước (Step-by-Step Process)

**Bước 1: [Process 1 Name]**
- **Input**: [Đầu vào cụ thể]
- **Xử lý**: [Logic chi tiết]
- **Validation**: [Kiểm tra gì]
- **Output**: [Kết quả]
- **Error Handling**: [Nếu thất bại?]
- **Idempotency**: [Có thể chạy lại an toàn?]

**Bước 2: [Process 2 Name]**
- **Input**: [Đầu vào cụ thể]
- **Xử lý**: [Logic chi tiết]
- **Validation**: [Kiểm tra gì]
- **Output**: [Kết quả]
- **Error Handling**: [Nếu thất bại?]
- **Idempotency**: [Có thể chạy lại an toàn?]

**Ví dụ cho Collection Workflow - Bước 1: Configuration Setup**
- **Input**: `collection_config.yaml`, environment variables
- **Xử lý**: Parse YAML, validate schema structure, check vector_dim alignment
- **Validation**: Schema version matches contract, vector_dim == global_configs.vector_dim
- **Output**: `MilvusConfig` object
- **Error Handling**: Raise ConfigValidationError với chi tiết lỗi
- **Idempotency**: Yes - repeated parsing với cùng config sẽ tạo cùng object

---

## 2. Chi tiết: Workflow này xử lý dữ liệu gì? Input, Output là gì?

### 2.1 Input Specification (Chi tiết Input)

#### 2.1.1 Configuration & Parameters
| Tên | Loại | Required | Default | Mô tả | Ví dụ |
|-----|------|----------|---------|-------|-------|
| [Param 1] | [Type] | Yes/No | [Value] | [Mô tả] | [Ví dụ] |
| [Param 2] | [Type] | Yes/No | [Value] | [Mô tả] | [Ví dụ] |
| [Param N] | [Type] | Yes/No | [Value] | [Mô tả] | [Ví dụ] |

**Ví dụ cho Collection Workflow**:
| Tên | Loại | Required | Default | Mô tả | Ví dụ |
|-----|------|----------|---------|-------|-------|
| MILVUS_HOST | String | Yes | N/A | Milvus server hostname | localhost |
| MILVUS_PORT | Integer | Yes | N/A | Milvus server port | 19530 |
| vector_dim | Integer | Yes | N/A | Dimension of vectors | 768 |
| index_type | String | Yes | HNSW | Type of index | HNSW |
| index_metric | String | No | L2 | Distance metric | L2 or IP |
| nlist | Integer | No | 128 | Number of clusters (IVF) | 128 |
| nprobe | Integer | No | 10 | Number of probes (search) | 10 |

#### 2.1.2 External Dependencies
| Tên | Loại | SLA | Health Check | Notes |
|-----|------|-----|--------------|-------|
| [Dependency 1] | Service/System | [Uptime] | [How to check] | [Notes] |
| [Dependency 2] | Service/System | [Uptime] | [How to check] | [Notes] |

**Ví dụ cho Collection Workflow**:
| Tên | Loại | SLA | Health Check | Notes |
|-----|------|-----|--------------|-------|
| Milvus Server | Service | 99.9% | `milvus_client.health()` | Must be running |
| etcd | Service | 99.9% | Milvus health includes etcd | Backend for Milvus |
| PostgreSQL | Service | 99% | `psycopg2.connect()` | Schema Workflow must complete first |

#### 2.1.3 Prerequisites
- [Prerequisite 1]: [Mô tả, reference đến workflow khác nếu có]
- [Prerequisite 2]: [Mô tả]
- [Prerequisite N]: [Mô tả]

**Ví dụ**:
- Schema Workflow must complete successfully (tables created, migrations applied)
- Milvus instance must be provisioned and healthy
- Connection credentials must be valid and stored in environment/vault

### 2.2 Output Specification (Chi tiết Output)

#### 2.2.1 Primary Output (Artifact chính)
| Tên | Loại | Nơi lưu | Định dạng | Mô tả | Life cycle |
|-----|------|---------|-----------|-------|-----------|
| [Output 1] | [Type] | [Location] | [Format] | [Mô tả] | [How long kept] |

**Ví dụ cho Collection Workflow**:
| Tên | Loại | Nơi lưu | Định dạng | Mô tả | Life cycle |
|-----|------|---------|-----------|-------|-----------|
| Collection `sise_v1` | Vector Index | Milvus | Internal Milvus format | Collection ready for vector queries | Until explicitly dropped |
| HNSW Index | Index Structure | Milvus | Graph-based (quantized) | Index ready for approximate search | Until collection dropped |

#### 2.2.2 Side Effects & Logs
| Tên | Loại | Nơi | Mô tả | Retention |
|-----|------|-----|-------|-----------|
| [Side Effect 1] | Log/State | [Where] | [Mô tả] | [How long] |

**Ví dụ**:
| Tên | Loại | Nơi | Mô tả | Retention |
|-----|------|-----|-------|-----------|
| Migration log | Log | `logs/collection_setup.log` | Timestamp, status, errors | 30 days |
| Health check record | Metric | Prometheus/Logs | Collection readiness status | 7 days |
| Index stats | Metric | Milvus logs | Index building progress, memory usage | 1 day |

#### 2.2.3 State Changes
- **Before**: [Trạng thái ban đầu hệ thống]
- **After**: [Trạng thái sau khi workflow hoàn thành]

**Ví dụ**:
- **Before**: Milvus running, no collections exist
- **After**: Collection `sise_v1` exists, HNSW index created, ready to accept vectors

### 2.3 Data Processing Characteristics

#### 2.3.1 Data Types
| Loại dữ liệu | Định dạng | Kích thước | Chi tiết |
|-------------|-----------|-----------|---------|
| [Data Type 1] | [Format] | [Size range] | [Details] |
| [Data Type 2] | [Format] | [Size range] | [Details] |

**Ví dụ cho Collection Workflow**:
| Loại dữ liệu | Định dạng | Kích thước | Chi tiết |
|-------------|-----------|-----------|---------|
| Vector embedding | float32 array | 768 dimensions | ~3 KB per vector |
| Collection schema | JSON/Protobuf | < 10 KB | Schema definition |
| Index metadata | Binary graph | Variable | Depends on vector count |

#### 2.3.2 Data Volume & Throughput
- **Expected volume**: [Dự kiến kích thước dữ liệu]
- **Throughput**: [Tốc độ xử lý]
- **Peak load**: [Tải cao nhất]

**Ví dụ**:
- **Expected volume**: Millions of 768-dimensional vectors
- **Throughput**: ~10k vectors/second during indexing
- **Peak load**: 100k concurrent query requests

#### 2.3.3 Data Lifecycle
```
[Input] --> [Processing] --> [Output] --> [Retention] --> [Cleanup]
  |
  v
[Event: T0] --> [Event: T1] --> [Event: T2] --> [Event: T3] --> [Event: T4]
```

---

## 3. Chi tiết: Các thành phần trọng tâm của Workflow?

### 3.1 Component Inventory (Danh sách chi tiết)

| Component | Category | Chức năng | Trách nhiệm | Dependencies | Owner/Module |
|-----------|----------|----------|-----------|--------------|-------------|
| [Component 1] | Config/Entity/Adapter/Service/Router | [Function] | [Responsibility] | [Dependencies] | [Module] |
| [Component 2] | Config/Entity/Adapter/Service/Router | [Function] | [Responsibility] | [Dependencies] | [Module] |

**Ví dụ cho Collection Workflow**:

| Component | Category | Chức năng | Trách nhiệm | Dependencies | Owner/Module |
|-----------|----------|----------|-----------|--------------|-------------|
| `collection_config.yaml` | Config | Define collection schema, index params | Schema version control, validation | None | `configs/` |
| `MilvusConfig` | Entity | Hold parsed config, manage version | Immutable config object, type safety | `collection_config.yaml` | `entities/milvus_config.py` |
| `MilvusCollectionAdapter` | Adapter | Wrap Milvus Python SDK | Connection pooling, API abstraction, error handling | `pymilvus`, `MilvusConfig` | `adapters/milvus_collection_adapter.py` |
| `CollectionService` | Service | Orchestrate collection creation | Workflow coordination, idempotency, transaction semantics | `MilvusCollectionAdapter`, `CollectionSchema` | `services/collection_service.py` |
| `CollectionRouter` | Router | Expose public API | Request validation, response formatting | `CollectionService` | `routers/collection_router.py` |

### 3.2 Component Interaction (Chi tiết tương tác)

#### 3.2.1 Sequence Diagram
```
[Thể hiện lưu lượng gọi giữa các thành phần]

Caller
  |
  | request
  v
Router
  | validate
  v
Service
  | orchestrate
  v
Adapter
  | API call
  v
External System
  | response
  v
Adapter
  | transform result
  v
Service
  | finalize
  v
Router
  | format response
  v
Caller
```

#### 3.2.2 Dependency Graph
```
[Tập tin/module nào phụ thuộc vào cái nào]

collection_config.yaml
  ↓
MilvusConfig (reads)
  ↓ (uses)
MilvusCollectionAdapter
  ↓ (uses)
CollectionService
  ↓ (uses)
CollectionRouter
  ↓ (exposes)
External API
```

### 3.3 Component Responsibilities Detail

#### Component: [Component Name]
- **Định nghĩa**: [Chi tiết về component]
- **Loại**: [Config/Entity/Adapter/Service/Router]
- **Trách nhiệm chính**: [Main responsibility 1, 2, ...]
- **Không nên làm gì**: [Anti-patterns, what NOT to do]
- **Phụ thuộc**: [Dependencies]
- **Người phụ thuộc**: [Reverse dependencies]
- **Test coverage**: [How to test, test file]
- **Ví dụ sử dụng**: [Code snippet]

**Ví dụ cho MilvusCollectionAdapter**:
- **Định nghĩa**: Adapter tương tác với Milvus SDK, cung cấp abstraction layer
- **Loại**: Adapter
- **Trách nhiệm chính**: 
  - Manage connection pooling
  - Provide methods: `create_collection()`, `create_index()`, `validate_collection()`
  - Handle API errors with retry logic
  - Log operations
- **Không nên làm gì**: 
  - Không contain business logic
  - Không perform validation (that's Service's job)
  - Không modify config
- **Phụ thuộc**: `pymilvus`, `MilvusConfig`
- **Người phụ thuộc**: `CollectionService`
- **Test coverage**: `tests/adapters/test_milvus_collection_adapter.py`
- **Ví dụ sử dụng**: (xem EXAMPLES.md)

---

## 4. Design Decisions & Rationale (Quyết định thiết kế)

### 4.1 Architectural Choices
- **Lựa chọn 1**: [Giải thích tại sao lại chọn cách này, so sánh với alternatives]
- **Lựa chọn 2**: [Giải thích]

**Ví dụ cho Collection Workflow**:
- **HNSW Index**: Chọn HNSW vì:
  - ~99% recall at high speed (< 100ms for 1M vectors)
  - Memory efficient compared to exhaustive search
  - Proven in production by Meta, Qdrant
  - Alternative considered: IVF-Flat (rejected: slower at scale, requires more tuning)

### 4.2 Trade-offs
| Trade-off | Pro | Con | Decision |
|-----------|-----|-----|----------|
| [Trade-off 1] | [Pro 1] | [Con 1] | [Decision] |

**Ví dụ**:
| Trade-off | Pro | Con | Decision |
|-----------|-----|-----|----------|
| Connection pooling | Reuse connections, better throughput | More memory, connection leak risk | Accept: pool size limited, monitored |
| Sync vs Async adapter | Simpler code, easier debugging | Can block on slow API calls | Accept: add timeout, metrics for latency |

---

## 5. Error Handling & Failure Modes

### 5.1 Expected Failures & Recovery
| Failure Scenario | Root Cause | Detection | Recovery | SLA Impact |
|-----------------|-----------|-----------|----------|-----------|
| [Failure 1] | [Cause] | [How detected] | [How recovered] | [Impact] |

**Ví dụ**:
| Failure Scenario | Root Cause | Detection | Recovery | SLA Impact |
|-----------------|-----------|-----------|----------|-----------|
| Milvus server unreachable | Network issue / server down | Connection timeout (5s) | Retry with backoff, fail fast | 2-3 minute delay |
| Collection already exists | Idempotent re-run | HEAD collection returns exists | Validate schema, skip creation | None |
| Invalid schema | Config error | Schema validation fails | Raise ConfigError with details | Block until fixed |

### 5.2 Unexpected Failures (Unknown Unknowns)
- **What to do**: [Procedure]
- **Who to contact**: [Owner, escalation]
- **Where to log**: [Knowledge base reference]

---

## 6. Testing Strategy

### 6.1 Unit Tests
- **Coverage**: [Mục tiêu coverage %]
- **Tools**: [Testing framework, mocking libraries]
- **Test files**: [Location]

### 6.2 Integration Tests
- **Scope**: [What's tested]
- **Setup**: [How to set up environment]
- **Test files**: [Location]

### 6.3 End-to-End Tests
- **Scope**: [Full workflow validation]
- **Environment**: [Dev/Staging/Prod]
- **Test files**: [Location]

---

## 7. Performance & Monitoring

### 7.1 Key Metrics
| Metric Name | Type | Unit | Target | Alert Threshold |
|------------|------|------|--------|-----------------|
| [Metric 1] | [Type] | [Unit] | [Target] | [Alert] |

**Ví dụ**:
| Metric Name | Type | Unit | Target | Alert Threshold |
|------------|------|------|--------|-----------------|
| setup_duration | Gauge | ms | < 5000 | > 10000 |
| collection_ready | Gauge | boolean | true | false |
| index_build_progress | Gauge | % | 100 | < 80 for 5 min |

### 7.2 Observability
- **Logging**: [What logged, where, level]
- **Metrics**: [Prometheus metrics, Grafana dashboards]
- **Tracing**: [Distributed tracing, correlation IDs]

---

## 8. Known Limitations & Future Work

### 8.1 Current Limitations
- [Limitation 1]: [Mô tả, impact]
- [Limitation 2]: [Mô tả, impact]

### 8.2 Future Improvements
- [Improvement 1]: [Scope, timeline]
- [Improvement 2]: [Scope, timeline]

---

## 9. Related Workflows & Integration Points

- [Related Workflow 1]: [Integration points]
- [Related Workflow 2]: [Integration points]

**Ví dụ**:
- Schema Workflow: Collection depends on Schema completion
- Seed Workflow: Uses Collection for vector insertion
- Bucket Workflow: Independent, parallel execution

---

## 10. References & Further Reading

- [Technical reference 1]: [Link]
- [RFC/Design doc]: [Link]
- [External documentation]: [Link, e.g., Milvus docs]
