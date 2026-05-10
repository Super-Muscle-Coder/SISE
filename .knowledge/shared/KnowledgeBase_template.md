
---

# KnowledgeBase_[N].md

*KnowledgeBase Template* là một tài liệu Markdown chuẩn, chứa bộ khung đã được thiết lập sẵn, khi các agent viết tệp KnowledgeBase của chính nó, cần phải tuân thủ cấu trúc này để đảm bảo tính nhất quán, dễ dàng truy cập và bảo trì. Dưới đây là hướng dẫn chi tiết về cách điền vào từng phần của template:

## Metadata  
- **id**: Mã định danh duy nhất cho KnowledgeBase.  
- **title**: Tiêu đề ngắn gọn, mô tả phạm vi tri thức.  
- **version**: Phiên bản của KnowledgeBase (theo ngày hoặc semantic).  
- **created_at**: Ngày tạo.  
- **created_by**: Ai tạo.  
- **last_updated**: Ngày cập nhật gần nhất.  
- **last_reviewed**: Ngày review gần nhất.  
- **review_owner**: Người/nhóm chịu trách nhiệm review.  
- **status**: Trạng thái (active | archived | deprecated).  
- **visibility**: Mức độ hiển thị (public | internal | restricted).  
- **retention_policy_days**: Chính sách giữ dữ liệu (số ngày).

---

## Scope and Purpose  
- **scope_summary**: Tóm tắt phạm vi tri thức mà agent cần biết.  
- **dos_reference**: Liệt kê các section trong DOS.md làm SSOT cho phạm vi này.  

---

## Core Concepts  
- Liệt kê các định nghĩa, hằng số, nguyên tắc bất biến mà agent phải tuân thủ.  

---

## Trusted References  
- Danh sách nguồn tham khảo chất lượng (URL, tài liệu, chuẩn, paper).  
- Mỗi entry cần có: **title, url, type, trust_level, notes**.  

---

## Internal References  
- Liên kết tới các file trong repo: `.context`, `.runbooks`, `.knowledge` khác.  

---

## Do Not Do  
- Liệt kê các hành vi cấm, anti‑patterns, vùng kiến thức không được phép can thiệp.  

---

## Provenance and Change Log  
- Nhật ký thay đổi, ghi rõ: **date, author, commit, change, impact**.  

---

## Validation Hooks  
- Các bước kiểm tra CI/CD cho KnowledgeBase:  
  - Kiểm tra URL còn sống.  
  - Lint format Markdown.  
  - Đảm bảo không chứa PII.  

---

## Review Cadence  
- **review_interval_days**: Chu kỳ review (ví dụ: 90 ngày).  
- **next_review_due**: Ngày review tiếp theo.  

---

## Tags and Search Metadata  
- **tags**: Từ khóa chính để phân loại.  
- **keywords**: Từ khóa để index và tìm kiếm nhanh.  
- **canonical_id**: ID chuẩn để tham chiếu trong hệ thống.  

---

