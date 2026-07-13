# Copilot Instructions — SISE Project

## 0. Bắt buộc đọc đầu mỗi phiên (mọi module, không ngoại lệ)

Trước khi thực hiện BẤT KỲ tác vụ nào, đọc trực tiếp 4 tệp hợp đồng sau
từ đường dẫn thật (không dùng cache/trí nhớ nếu file đã có chỉnh sửa
mới hơn lần đọc gần nhất):

| Tệp | Đường dẫn |
|---|---|
| `openapi.yaml` | `E:\SISE\.context\openapi.yaml` |
| `data_schema.yaml` | `E:\SISE\.context\data_schema.yaml` |
| `Tasks.yaml` | `E:\SISE\.context\Tasks.yaml` |
| `Workflow_Centric_Architecture.md` | `E:\SISE\.knowledge\shared\Workflow_Centric_Architecture.md` |

4 tệp này là **nguồn sự thật duy nhất (single source of truth)** của
toàn bộ dự án. Mọi lập luận, so sánh, đối chiếu khi viết hoặc sửa code
bắt buộc dựa trên nội dung thật của 4 tệp này — không tự suy diễn từ
kiến thức chung hoặc phiên bản đã nhớ trước đó, vì các tệp này được
cập nhật (append) liên tục qua từng vòng audit.

Nếu đang làm việc trong `modules/FrontendWeb/`, đọc thêm mục **§2.4
FrontendModule Architecture** trong `Workflow_Centric_Architecture.md`
— đây là đặc tả kiến trúc chi tiết riêng cho module này (3 nhóm lớp
A/B/C, danh sách Anti-Pattern AP-7 đến AP-10). Không tóm tắt lại nội
dung này ở đây; luôn đọc bản gốc để tránh dùng bản tóm tắt lỗi thời.

## 1. Vai trò & ngôn ngữ giao tiếp

- Trưởng dự án (Project Owner) đóng vai trò PM, ra quyết định cuối
  cùng về kiến trúc và hướng khắc phục. Agent (Copilot hoặc agent
  khác) đóng vai trò worker thực thi theo chỉ định, không tự ý đổi
  hướng kiến trúc đã chốt.
- Giao tiếp với người dùng: tiếng Việt.
- Tài liệu trong `.github/` (bao gồm chính tệp này): tiếng Anh chuyên
  nghiệp, không xen tiếng Việt.

## 2. Quy tắc thực thi bắt buộc (mọi module)

- **Không tự ý dùng file-edit tool để sửa file trực tiếp.** Khi có
  thay đổi code, luôn trả về **toàn bộ nội dung tệp** (full file, không
  phải diff/snippet) ngay trong chat để Project Owner tự soát và áp
  dụng thủ công. Đây là quy tắc cứng, áp dụng cho mọi agent, mọi
  module — không có ngoại lệ trừ khi Project Owner yêu cầu tường minh
  ngược lại trong chính phiên đó.
- Khi vá các thành phần đã ở trạng thái CLOSED/ổn định, chỉ áp dụng
  thay đổi dạng bổ sung (additive); không sửa đổi logic hiện có trừ
  khi được yêu cầu rõ ràng.
- Trước khi báo "hoàn thành" hoặc "PASS", bắt buộc verbalize lý do
  (Vấn đề / Căn cứ hợp đồng / Quyết định / Code) — không tự nhận đã
  xong nếu chưa đối chiếu lại với 4 tệp hợp đồng ở mục 0.
- Version pinning dependencies dùng `==` (không dùng `>=`) ở mọi
  `requirements.txt`/`package.json`, để đảm bảo build reproducible.

## 3. Kiến trúc chung toàn dự án

- Áp dụng kiến trúc 5 lớp: `entities`, `adapters`, `services`,
  `routers`, `configs` — tổ chức xoay quanh **workflow**, không xoay
  quanh loại kỹ thuật (Workflow-Centric Architecture). Chi tiết đầy đủ
  nằm ở `Workflow_Centric_Architecture.md` (mục 0), không lặp lại ở
  đây.
- Mỗi workflow phải có đầy đủ file tương ứng ở từng lớp liên quan
  (theo đúng schema/entity/bucket/collection mà workflow đó sở hữu).
- **Giới hạn tái sử dụng cross-domain:** mỗi file/module có đúng 1 chủ
  sở hữu (workflow) rõ ràng; cấm file "tự do" phục vụ nhiều domain
  nghiệp vụ cùng lúc — vi phạm nguyên tắc trách nhiệm minh bạch.
- `__init__.py` (Python) phải export qua `__all__`, giữ tên file nội
  bộ rõ ràng nhưng công khai API ổn định qua export của package.
- File tên dài / nhiều tầng: dùng export ngắn gọn qua điểm export của
  package (`__init__.py` bên Python, `index.ts` bên TypeScript) thay
  vì đổi tên file gốc.

## 4. Ghi chú riêng theo module

### StorageModule (Python) — CLOSED
Kiến trúc: chuỗi workflow riêng biệt (`schema`, `collection`, `bucket`,
`infra_compose`, `seed`), tổ chức entity/adapter/service/router theo
tiền tố workflow. Dùng Python 3.13.12 qua lệnh `py -3.13`. Script kiểm
thử dùng `Path(__file__).parent` để resolve đường dẫn tuyệt đối. Stack
hạ tầng định nghĩa tại `infra_compose_storage.yml`, gồm 5 service:
PostgreSQL 16, etcd v3.5.14, MinIO RELEASE.2024-12-18, Milvus v2.4.12,
Redis 7 — luôn dùng phiên bản mới nhất hoặc lùi tối đa 1 bậc, không
dùng phiên bản quá cũ. Env file đặt tại
`modules/StorageModule/configs/` (`storage.env.example` làm template,
`storage.env.local` không commit).

### AIModule (Python) — CLOSED

### BackendModule (Python) — CLOSED (ỔN ĐỊNH)
Workflow `friends`: khi thực hiện task, trả full-file code qua chat
(không tự sửa file — xem mục 2), giữ format lỗi thống nhất
`{code, message}`, và bám theo pattern DI/AsyncSession + IntegrityError
mapping đã thiết lập sẵn ở workflow `auth`.
Workflow `auth`: tham khảo chi tiết trường xác thực, quy tắc validate,
định dạng response và xử lý lỗi trực tiếp từ `openapi.yaml`,
`data_schema.yaml`, và mã nguồn thật (`auth_entities.py`,
`auth_services.py`, `auth_routers.py`) — không suy diễn.

### FrontendModule / FrontendWeb (TypeScript, React) — Module tiếp theo cần audit
**Chỉ có FrontendWeb (React + Vite). Không triển khai FrontendMobile
(React Native)** — phạm vi đồ án đã giới hạn chỉ 1 giao diện web, xem
`Workflow_Centric_Architecture.md` §2.4.0. Workflow `friends` hiện
backlog, chưa triển khai ở phía Frontend — không code cho đến khi
Project Owner yêu cầu tường minh.
Kiến trúc chi tiết (3 nhóm lớp A/B/C, quy tắc "1 workflow = 1 file mỗi
lớp", danh sách Anti-Pattern AP-7–AP-10): đọc `Workflow_Centric_Architecture.md`
§2.4, không tóm tắt lại ở đây để tránh lệch bản khi §2.4 được cập nhật.

## 5. Tài liệu Agent (áp dụng khi tạo/sửa file định nghĩa agent)

- Với các agent quan trọng (`audit_required: true`), ghi rõ lý do
  agent đó quan trọng ngay trong tài liệu định nghĩa.
- Ghi rõ chủ sở hữu, mức độ nhạy cảm dữ liệu xử lý, phụ thuộc
  (dependency), và kỳ vọng thời gian hoạt động cho mỗi agent.
- Giữ tài liệu agent ngắn gọn, có đánh số phiên bản.

## 6. Bảo mật (mức phù hợp quy mô đồ án tốt nghiệp)

- Không hard-code bí mật (mật khẩu, API key, connection string) trong
  code. Mọi giá trị nhạy cảm nằm trong file `.env.local` tương ứng của
  từng module, không commit vào Git (đối chiếu `.gitignore`/
  `.dockerignore`).
- Khi audit hoặc build, luôn đối chiếu credential giữa các module
  (không chỉ hostname) — bài học thực tế từ BackendModule: sai lệch
  `POSTGRES_USER`/`MINIO_ACCESS_KEY` giữa các `.env.local` từng gây
  lỗi runtime dù hostname đã đúng.

## 7. Ghi chú

Mục "Độ Bền & Kiểm Tra", "Quản Lý Bí Mật nâng cao" (chaos testing,
secret rotation định kỳ, IAM phân quyền, load test k6/Locust...) đã
được **loại bỏ khỏi tài liệu này** theo quyết định của Project Owner
(2026-07-13) — không phù hợp quy mô đồ án tốt nghiệp, đúng tinh thần
Quy tắc Alpha mục (4) trong `Workflow_Centric_Architecture.md`. Nếu dự
án mở rộng quy mô trong tương lai, các mục này có thể được khôi phục
theo yêu cầu tường minh của Project Owner.