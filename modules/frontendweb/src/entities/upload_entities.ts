/**
 * @file upload_entities.ts
 * @layer entities
 * @description Type definitions cho workflow upload (S1 presigned → S2 direct
 *              PUT MinIO → S3 confirm). Khớp 1-1 openapi.yaml
 *              PresignedUploadResponse, UploadResponse (v1.2.3).
 *              PrivacyLevel/IndexStatus TRÙNG LẶP CÓ CHỦ ĐÍCH với
 *              media_entities.ts — áp dụng đúng tiền lệ đã thống nhất ở
 *              BackendModule (Workflow_Centric_Architecture.md §3.2:
 *              "Workflow-Centric chấp nhận trùng lặp để giữ tách biệt").
 *              KHÔNG cross-import giữa upload và media.
 * @owner AG-04
 * @reference openapi.yaml POST /media/upload-url, POST /media/upload/confirm
 */

/**
 * PRIVACY LEVEL — trùng lặp có chủ đích với media_entities.ts.
 * openapi.yaml components.schemas.PrivacyLevel: 0=Private, 1=Friends, 2=Public
 */
export type UploadPrivacyLevel = 0 | 1 | 2

/**
 * INDEX STATUS — trùng lặp có chủ đích với media_entities.ts.
 * openapi.yaml components.schemas.IndexStatus (enum, [FIX Medium#8] v1.2.0)
 */
export type UploadIndexStatus = 'pending' | 'ready' | 'failed'

/**
 * PRESIGNED UPLOAD REQUEST (S1)
 * Reference: openapi.yaml POST /media/upload-url requestBody
 * required: [filename, content_type]
 */
export interface PresignedUploadRequest {
    filename: string
    content_type: string
    expected_size_mb?: number
}

/**
 * PRESIGNED UPLOAD RESPONSE (S1)
 * Reference: openapi.yaml components.schemas.PresignedUploadResponse
 * Trả về ở CẢ response 200 (thành công lần đầu) VÀ 409 (duplicate
 * idempotent request — [FIX Blocking#2] đã sửa để trả cùng schema này,
 * không phải UploadResponse như tài liệu cũ sai).
 */
export interface PresignedUploadResponse {
    upload_url: string
    object_key: string
    expires_in_sec: number
    max_file_size_mb: number
    allowed_content_types: string[]
    note?: string
}

/**
 * UPLOAD CONFIRM REQUEST (S3)
 * Reference: openapi.yaml POST /media/upload/confirm requestBody
 * required: [object_key, album_id, privacy_level]
 * LƯU Ý QUAN TRỌNG: album_id là INTEGER BẮT BUỘC, KHÔNG nullable theo
 * hợp đồng. Quyết định sản phẩm (Project Owner, không đổi Backend): bắt
 * buộc người dùng chọn hoặc tạo album trước khi upload — KHÔNG hỗ trợ
 * "upload không cần album" ở thời điểm hiện tại.
 */
export interface UploadConfirmRequest {
    object_key: string
    album_id: number
    privacy_level: UploadPrivacyLevel
    tags?: string[]
}

/**
 * UPLOAD RESPONSE (S3)
 * Reference: openapi.yaml components.schemas.UploadResponse
 * Trả về ở CẢ response 200 (confirm thành công) VÀ 409 (duplicate
 * idempotent request — [FIX Blocking#3] đã bổ sung, dùng cùng schema này).
 */
export interface UploadResponse {
    image_id: string // UUID
    minio_url: string
    status: string // example: "pending"
    index_status: UploadIndexStatus
}

/**
 * Trạng thái pipeline upload phía client — KHÔNG có trong hợp đồng, thuần
 * UI state để theo dõi tiến trình S1→S2→S3.
 */
export type UploadItemState =
    | 'pending'
    | 'presigning'
    | 'uploading'
    | 'confirming'
    | 'done'
    | 'error'
    | 'cancelled'

/**
 * 1 mục trong hàng đợi upload (dùng cho cả single-file và bulk upload —
 * single-file chỉ là hàng đợi có đúng 1 phần tử, KHÔNG tách riêng type).
 */
export interface UploadQueueItem {
    uploadId: string // UUID v4, sinh phía client, ổn định qua các lần retry
    file: File
    state: UploadItemState
    progress: {
        loaded: number
        total: number
    }
    error: {
        code: string
        message: string
    } | null
    presignedUrl?: string
    objectKey?: string
    expiresInSec?: number
    albumId: number // Bắt buộc — xem UploadConfirmRequest
    privacyLevel: UploadPrivacyLevel
    tags?: string[]
    uploadedImage?: UploadResponse // Set sau khi S3 thành công
    abortController?: AbortController // Gắn khi bắt đầu S2, dùng để cancel()
    retryCount: number
    startedAt: number
    completedAt?: number
}