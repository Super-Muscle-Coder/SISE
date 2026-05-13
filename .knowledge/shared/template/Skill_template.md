
---

## Skill_[N].md 

*Skill Template* là một tài liệu Markdown chuẩn, chứa bộ khung đã được thiết lập sẵn, khi các agent viết tệp Skill của chính nó, cần phải tuân thủ cấu trúc này để đảm bảo tính nhất quán, dễ dàng truy cập và bảo trì. Dưới đây là hướng dẫn chi tiết về cách điền vào từng phần của template:

### Metadata
- **id**: Mã định danh duy nhất cho file Skill.  
- **agent_id**: ID của agent sở hữu (ví dụ AG‑01).  
- **agent_name**: Tên dễ đọc của agent.  
- **skill_db_version**: Phiên bản của cơ sở dữ liệu kỹ năng.  
- **total_skills_acquired**: Tổng số kỹ năng đã ghi nhận (tự động tăng).  
- **created_at**: Ngày tạo file Skill.  
- **last_skill_added**: Ngày thêm kỹ năng gần nhất.  
- **retention_policy_days**: Thời gian giữ kỹ năng trước khi lưu trữ.  
- **status**: Trạng thái (active | archived | locked).

### Skill Entry (mỗi kỹ năng)
- **skill_id**: Mã định danh duy nhất cho kỹ năng.  
- **timestamp**: Thời điểm ghi nhận kỹ năng.  
- **trigger_event**: Sự kiện bất ngờ dẫn đến việc học kỹ năng.  
- **context**: Ngữ cảnh (task_id, commit_hash, môi trường, dependency).  
- **symptom**: Triệu chứng quan sát được và tác động.  
- **root_cause**: Phân tích nguyên nhân gốc rễ và yếu tố góp phần.  
- **solution**: Cách khắc phục, thay đổi code, cách kiểm chứng.  
- **prevention**: Mẫu hành vi cần tránh và mẫu đúng cần theo.  
- **related_skills**: Liên kết tới các kỹ năng liên quan.  
- **tags**: Nhãn để phân loại và tìm kiếm.  
- **confidence_level**: Mức độ tin cậy (cao | trung bình | thấp).  
- **review_status**: Trạng thái review (validated | experimental | needs_review).  
- **reviewed_by**: Ai đã review (agent hoặc người phê duyệt).  
- **archived**: Đánh dấu kỹ năng đã lỗi thời.

### Governance & Validation
- **provenance_fields_required**: Các trường bắt buộc để truy vết (commit_hash, task_id, author).  
- **ci_validation_hooks**: Các bước kiểm tra CI (cú pháp, tính duy nhất, PII scrub).  
- **approval_required**: Có cần phê duyệt thủ công để xác nhận kỹ năng không.  
- **retention_and_archive_policy**: Quy tắc lưu trữ hoặc xoá kỹ năng cũ.

### Operational Metadata
- **statistics**: Thống kê tự động (tổng số kỹ năng, theo tag, theo confidence).  
- **review_cadence_days**: Chu kỳ review định kỳ.  
- **edit_roles**: Ai có quyền thêm/sửa/phê duyệt kỹ năng.  
- **notes_and_todo**: Ghi chú tự do hoặc kế hoạch cập nhật.

---