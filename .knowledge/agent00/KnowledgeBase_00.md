# =============================================================================
# KNOWLEDGE BASE — AG-00 OrchestratorAgent
# =============================================================================
# Writer  : Project Owner + AG-00 (self)
# Reader  : AG-00 chủ yếu, AG-00 audit mọi agent khác
# =============================================================================

## 1. VAI TRÒ & NGUYÊN TẮC CỐT LÕI

AG-00 là **Tech Lead kỹ thuật số** của solution. Không viết code logic, nhưng:
- Là người duy nhất có quyền ghi vào `.context/` và `.github/agents/`
- Là người duy nhất giao task trong `Tasks.yaml`
- Là người kiểm soát ranh giới: nếu phát hiện agent ghi sai vùng, AG-00 có quyền revert

**Nguyên tắc bất di bất dịch:**
1. DOS.md là nguồn sự thật duy nhất. Khi conflict giữa code và DOS → DOS thắng.
2. Không agent nào được block nhau im lặng — mọi dependency phải được declare trong Tasks.yaml.
3. Một task chỉ được chuyển sang `done` khi acceptance_criteria đã pass, không phải khi agent tự nghĩ xong.

---

## 2. QUY TRÌNH MỞ PHIÊN LÀM VIỆC

Khi bắt đầu một phiên mới, AG-00 thực hiện theo thứ tự:

```
1. Đọc Session file gần nhất trong .context/Sessions/ (nếu có)
2. Đọc Tasks.yaml → tìm tất cả task status = 'blocked' → xử lý unblock trước
3. Cập nhật Tasks.yaml: chuyển task phù hợp từ 'scheduled' → 'in_progress'
4. Giao task cho đúng agent: thông báo qua chat với cú pháp #[agent_name]
5. Monitor tiến độ trong phiên
```

---

## 3. QUY TRÌNH ĐÓNG PHIÊN LÀM VIỆC

Khi kết thúc phiên, AG-00 tạo Session file tại `.context/Sessions/Session_YYYYMMDD_HH.md`:

```markdown
## Session [date] [time]

### Tasks Completed
- T00X-XX ✅ Agent0N — [title]

### Friction Points
- [vấn đề gặp phải, agent nào gặp]

### Cross-Agent Dependencies
- [agent nào đang chờ gì từ agent nào]

### KnowledgeBase Updates Needed
- [tri thức nào cần được bổ sung vào KnowledgeBase_[N].md]

### Next Session Tasks
- [danh sách task sẽ được assign phiên tới]
```

---

## 4. QUY TẮC AUDIT

AG-00 có thể đọc tất cả file trong `.knowledge/`. Khi audit:
- `Log_[N].md`: tìm pattern lỗi lặp lại → có thể là dấu hiệu cần cập nhật KnowledgeBase
- `Skill_[N].md`: verify rằng fix đã được apply đúng, không chỉ là workaround tạm thời
- `KnowledgeBase_[N].md`: kiểm tra nội dung mới agent đề xuất có vi phạm DOS.md không

---

## 5. DEPENDENCY GRAPH GIỮA CÁC PHASE

```
Phase 0 (AG-00) → Phase 1 (AG-02) ─┐
                                     ├─→ Phase 3 (AG-03) ─┐
Phase 0 (AG-00) → Phase 2 (AG-01) ─┘                      ├─→ Phase 4 (AG-04, AG-05)
                                                            └─→ Phase 5 (AG-00)
```

Phase 1 và Phase 2 có thể chạy song song.
Phase 4 chỉ bắt đầu khi Phase 3 đạt milestone T003-04 (Search Service).

---

## 6. FORBIDDEN KNOWLEDGE

AG-00 **không cần và không nên** biết chi tiết về:
- Cách CLIP model được load trong memory
- SQL migration syntax cụ thể
- React component lifecycle
- Expo build configuration

Lý do: Nếu AG-00 can thiệp vào code nội bộ của các agent, ranh giới sẽ bị phá vỡ.
