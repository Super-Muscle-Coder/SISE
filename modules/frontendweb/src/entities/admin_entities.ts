/**
 * @file admin_entities.ts
 * @layer entities
 * @description Type definitions cho workflow admin (admin only). Khớp 1-1
 *              openapi.yaml POST /admin/reindex (v1.2.3).
 *              SỬA (Bước 3 audit): TriggerReindexResponse trước đây SAI 2
 *              điểm — (1) thiếu hẳn field `status`, (2) `job_id` khai bắt
 *              buộc string trong khi hợp đồng ghi nullable: true. Theo
 *              đúng nguyên văn openapi.yaml [LÀM RÕ v1.2.2]: "response 201
 *              chỉ trả về SAU KHI UPDATE images.embedding đã hoàn tất.
 *              status luôn là 'completed', job_id luôn là null (field giữ
 *              chỗ cho khả năng mở rộng tương lai, KHÔNG có endpoint tra
 *              cứu job_id ở v1.2.2)." Response code thật là 201, KHÔNG
 *              phải 202 (khác với /eval/run — dễ nhầm vì cùng cơ chế
 *              admin_authorization nhưng khác kiểu xử lý: eval bất đồng
 *              bộ thật, admin/reindex xử lý đồng bộ dù trước đây tài liệu
 *              nội bộ dự án mô tả nhầm là 202/bất đồng bộ).
 * @owner AG-04
 * @reference openapi.yaml POST /admin/reindex
 */

/**
 * TRIGGER REINDEX REQUEST
 * Reference: openapi.yaml POST /admin/reindex request body (không required)
 */
export interface TriggerReindexRequest {
    batch_size?: number // default: 100
    resume_from?: string
}

/**
 * TRIGGER REINDEX RESPONSE
 * Reference: openapi.yaml POST /admin/reindex response 201 (KHÔNG phải
 * 202 — endpoint xử lý ĐỒNG BỘ theo [LÀM RÕ v1.2.2], response chỉ trả về
 * sau khi reindex đã hoàn tất thật sự).
 * status LUÔN là "completed" (enum chỉ có 1 giá trị này ở v1.2.2).
 * job_id LUÔN là null — field giữ chỗ cho mở rộng tương lai, KHÔNG có
 * endpoint tra cứu job_id ở phiên bản hiện tại.
 */
export interface TriggerReindexResponse {
    status: 'completed'
    job_id: string | null
}