
---

# Agent Template

## Metadata
- **name**: Tên duy nhất của agent.
- **description**: Mô tả ngắn gọn vai trò và phạm vi.
- **version**: Phiên bản semantic (major.minor.patch).
- **api_version**: Version của API contract (phải khớp với `openapi.yaml`).
- **schema_version**: Version của schema (phải khớp với `data_schema.yaml`).
- **change_log**: Nhật ký thay đổi để audit/rollback.
- **last_updated**: Ngày cập nhật gần nhất. 
- **updated_by**: Ai cập nhật. *Ví dụ: `AG-00 (SecretaryAgent)` hoặc ProjectOwner*  
- **context_refs**: Liệt kê file trong `.context` mà agent phụ thuộc. *Ví dụ: `.context/DOS.md`, `.context/openapi.yaml`, `.context/agent_boundaries.yaml`, `.context/data_schema.yaml`*  
- **knowledge_refs**: Liệt kê file trong `.knowledge` để agent ghi chép tri thức/log/skill.
- **status**: Trạng thái agent. *active | deprecated | pending*  
- **audit_required**: Bật cờ audit để Orchestrator log mọi thay đổi. *true/false*  
- **required_env_vars**: Các biến môi trường bắt buộc. 
- **ci_validation_hooks**: Các bước kiểm tra CI/CD.
- **required_dependencies**: Các dependency và version, bắt buộc phải liệt kê chính xác.
- **security & secrets**: Liệt kê secrets cần thiết và nơi lưu trữ.
- **runbook_refs**: Tham chiếu tới tài liệu xử lý sự cố.
- **deployment_strategy**: Chiến lược rollout.
- **data_governance**: Chính sách dữ liệu.
- **working_dir**: Thư mục project mà agent làm việc.

---

## Role
Mô tả ngắn gọn vai trò tổng thể của agent trong hệ thống.  

---

## Core Responsibilities
Liệt kê chi tiết các nhiệm vụ chính mà agent đảm nhận, dạng bullet (bám sát theo `DOS.md`).

---

## Key Constraints
Các ràng buộc, hành vi bị cấm, outbound call (bám sát theo `DOS.md`, `agent_boundaries.yaml`, `data_schema.yaml`, `openapi.yaml`)

---

## Technical Stack
Ngôn ngữ, framework, thư viện chính (bám sát theo `DOS.md`)  

---

## Knowledge Scope
- **Must know**: Kiến thức cần thiết phải biết và đào sâu
- **Must not know**: Kiến thức ngoài phạm vi, không cần biết, không được phép can thiệp.

---

## Observability Targets
- **Metrics to log**
- **SLOs**
- **Alert thresholds**
- **Health probes**

---

## Error Handling Patterns
- **Common scenarios** 
- **Predefined responses** 
- **Difference from Skill.md**: Skill.md ghi lại lỗi bất ngờ đã fix; Error Handling định nghĩa lỗi dự phòng và cách phản ứng ngay.  

---

## Success Criteria
Định nghĩa rõ ràng thế nào là “làm đúng”, đảm bảo agent không ảo tưởng về kết quả mà nó làm ra.  

---