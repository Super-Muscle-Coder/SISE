/**
 * @file friends_entities.ts
 * @layer entities
 * @description Type definitions cho workflow friends. Khớp 1-1 openapi.yaml
 *              GET /friends, POST /friends/request, DELETE /friends/{friend_id}
 *              (v1.2.3).
 * @owner AG-04
 * @reference openapi.yaml paths /friends, /friends/request,
 *            /friends/{friend_id}; components.schemas.User
 */

import type { User } from './auth_entities'

/**
 * FRIEND — VAY MƯỢN TRỰC TIẾP TỪ auth_entities.ts, KHÔNG PHẢI TYPE RIÊNG
 * CỦA WORKFLOW FRIENDS.
 *
 * Lý do ngoại lệ (khác PrivacyLevel/IndexStatus — nơi trùng lặp CÓ chủ
 * đích giữ workflow độc lập): openapi.yaml GET /friends response 200 trả
 * `items: User[]` — Backend trả về NGUYÊN schema User đầy đủ, không phải
 * bản rút gọn riêng cho friends. Về bản chất dữ liệu, "1 người bạn" LÀ 1
 * User, không phải 1 entity nghiệp vụ khác — cross-import ở đây là đúng,
 * không phải là workflow phụ thuộc workflow (giống StandardError đã có
 * ngoại lệ tương tự ở scaffold_entities.ts).
 *
 * ⚠️ CẢNH BÁO BẢO TRÌ: Nếu auth_entities.ts đổi cấu trúc User (thêm/bớt/
 * đổi tên field), file này (và mọi nơi dùng type Friend) BỊ ẢNH HƯỞNG
 * TRỰC TIẾP. Khi audit hoặc sửa auth_entities.ts, BẮT BUỘC kiểm tra chéo
 * luôn cả workflow friends — KHÔNG được coi 2 workflow là hoàn toàn độc
 * lập như các trường hợp trùng lặp khác trong dự án.
 */
export type Friend = User

/**
 * FRIEND LIST RESPONSE
 * Reference: openapi.yaml GET /friends response 200
 * { items: User[], total: integer } — LƯU Ý: KHÔNG có offset/limit trong
 * response (khác hẳn shape {items,total,offset,limit} của /albums, /media
 * — đã xác nhận qua đọc lại đúng nguyên văn openapi.yaml, đây KHÔNG phải
 * lỗi thiếu sót, response /friends chỉ có items + total).
 */
export interface FriendListResponse {
    items: Friend[]
    total: number
}

/**
 * SEND FRIEND REQUEST (MVP semantics — auto-accept, không có hàng đợi
 * pending riêng biệt. Xem openapi.yaml note: "nếu PO muốn mô hình
 * pending/accept 2 bước, cần contract version kế tiếp — KHÔNG nằm trong
 * phạm vi v1.2.0")
 * Reference: openapi.yaml POST /friends/request requestBody
 * required: [target_user_id]
 */
export interface SendFriendRequestPayload {
    target_user_id: number
}

/**
 * SEND FRIEND REQUEST RESPONSE
 * Reference: openapi.yaml POST /friends/request response 201
 * Backend ghi 2 dòng đối xứng (A,B)+(B,A) trong 1 transaction — nhưng
 * response chỉ trả về 1 bản ghi (góc nhìn từ user hiện tại gọi API).
 */
export interface FriendRequestResponse {
    user_id: number
    friend_id: number
    created_at: string // ISO 8601
}