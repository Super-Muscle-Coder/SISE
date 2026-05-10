
---

## Log_[N].md 

*Log Template* là một tài liệu Markdown chuẩn, chứa bộ khung đã được thiết lập sẵn, khi các agent viết tệp Log của chính nó, cần phải tuân thủ cấu trúc này để đảm bảo tính nhất quán, dễ dàng truy cập và bảo trì. Dưới đây là hướng dẫn chi tiết về cách điền vào từng phần của template:

### Metadata
- **id**: Mã định danh duy nhất cho file Log.  
- **agent_id**: ID của agent sở hữu.  
- **agent_name**: Tên dễ đọc của agent.  
- **log_version**: Phiên bản của schema log.  
- **log_type**: Loại log (episodic_memory, event_journal…).  
- **created_at**: Ngày bắt đầu log.  
- **last_event_at**: Thời điểm sự kiện gần nhất.  
- **retention_policy_days**: Thời gian giữ sự kiện trước khi lưu trữ.  
- **compression_policy**: Quy tắc nén/lưu trữ sự kiện.  
- **status**: Trạng thái (active | read_only | archived).

### Event Entry (mỗi sự kiện)
- **event_id**: Mã định danh duy nhất cho sự kiện.  
- **timestamp**: Thời điểm xảy ra sự kiện.  
- **event_type**: Loại sự kiện (milestone | failure | anomaly | decision | context_switch | external_change).  
- **significance_score**: Điểm quan trọng (0.0–1.0) để quyết định giữ/lưu trữ.  
- **session_id**: Liên kết tới phiên làm việc.  
- **task_id**: Liên kết tới Tasks.yaml (nếu có).  
- **summary**: Tóm tắt ngắn gọn sự kiện.  
- **details**: Mô tả chi tiết, ngữ cảnh, kết quả, tác động.  
- **metrics**: Số liệu liên quan (latency, CPU, memory…).  
- **related_events**: Liên kết tới các sự kiện khác.  
- **related_skills**: Liên kết tới các kỹ năng liên quan.  
- **tags**: Nhãn để phân loại.  
- **retention_priority**: Mức ưu tiên giữ lâu dài (cao | trung bình | thấp).  
- **archived**: Đánh dấu sự kiện đã lưu trữ.

### Decision Journal
- **decision_id**: Mã định danh cho quyết định.  
- **decision_point**: Điểm ra quyết định.  
- **options_considered**: Các lựa chọn đã cân nhắc (ưu/nhược điểm).  
- **chosen_option**: Lựa chọn cuối cùng.  
- **rationale**: Lý do chọn và mức độ đảo ngược.  
- **outcome**: Kết quả và xác nhận quyết định.

### Compression & Retention
- **compression_triggers**: Điều kiện kích hoạt nén (số lượng sự kiện, tuổi).  
- **compression_algorithm**: Cách chọn sự kiện để giữ/lưu trữ/xoá.  
- **exempt_event_rules**: Quy tắc sự kiện không bao giờ bị nén (milestones, high priority, linked skills).

### Governance & Validation
- **provenance_required**: Các trường bắt buộc để truy vết (author, commit_hash, session_id).  
- **ci_validation_hooks**: Các bước kiểm tra CI (cú pháp, tính duy nhất, PII scrub, link validation).  
- **edit_roles**: Ai có quyền thêm sự kiện, ai có quyền lưu trữ.  
- **archive_schedule**: Lịch tự động lưu trữ/nén log.

### Operational Metadata
- **statistics**: Thống kê tự động (tổng sự kiện, theo loại, điểm trung bình).  
- **next_compression_date**: Ngày dự kiến chạy nén tiếp theo.  
- **session_continuity_protocol**: Quy trình khôi phục ngữ cảnh khi bắt đầu phiên mới.  
- **notes_and_todo**: Ghi chú tự do hoặc kế hoạch cải tiến.

### Workflow & Session Retrospective Integration (AG-00 Audit)
*Quy trình bắt buộc cho phần báo cáo của tất cả các Agent:*
1. **Agent tự báo cáo**: Ngay sau khi hoàn thành Task và chuyển trạng thái sang `review` hoặc `done` trong `Tasks.yaml`, Agent BẮT BUỘC phải tạo một Event Entry vào file `Log_[N].md` của mình. Event này phải ghi rõ chi tiết những file đã sửa, logic đã viết, và các vấn đề (nếu có).
2. **AG-00 Audit**: AG-00 không yêu cầu Agent báo cáo trực tiếp trong chat. Thay vào đó, AG-00 sẽ trace đến file `Log_[N].md` của Agent đó để đọc, kiểm toán (Audit) và đánh giá chất lượng công việc.
3. **Tổng hợp theo Template**: Tổng hợp các Log nội bộ đã được kiểm toán, AG-00 sẽ tự động tạo file Session Retrospective chuẩn theo mẫu `.context/Sessions/report_template.md`.

---