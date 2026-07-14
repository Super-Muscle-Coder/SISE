/**
 * @file media_entities.ts
 * @layer entities
 * @description Type definitions cho workflow media (Album + Image CRUD
 *              thuần túy — KHÔNG chứa upload). Khớp 1-1 openapi.yaml
 *              Album, ImageMetadata, PrivacyLevel, IndexStatus (v1.2.3).
 *              SỬA: đã xóa PresignedUploadResponse — type này chỉ thuộc
 *              workflow upload (đã định nghĩa đúng ở upload_entities.ts),
 *              không phải type domain dùng chung như PrivacyLevel/
 *              IndexStatus. Giữ nó ở đây là trùng lặp KHÔNG có chủ đích
 *              (khác PrivacyLevel/IndexStatus — trùng lặp CÓ chủ đích theo
 *              tiền lệ Backend), và đã trôi dạt khỏi bản đúng (thiếu field
 *              `note` so với openapi.yaml).
 * @owner AG-04
 * @reference openapi.yaml components.schemas.Album/ImageMetadata/
 *            PrivacyLevel/IndexStatus
 */

/**
 * PRIVACY LEVEL — openapi.yaml components.schemas.PrivacyLevel
 * 0: Private, 1: Friends, 2: Public
 */
export type PrivacyLevel = 0 | 1 | 2

export const PRIVACY_LEVEL_LABEL: Record<PrivacyLevel, string> = {
    0: 'Private',
    1: 'Friends',
    2: 'Public',
} as const

/**
 * INDEX STATUS — openapi.yaml components.schemas.IndexStatus
 * [FIX Medium#8] Trước đây type:string+example rời rạc ở nhiều chỗ, nay
 * dùng enum dùng chung.
 */
export type IndexStatus = 'pending' | 'ready' | 'failed'

/**
 * ALBUM
 * Reference: openapi.yaml components.schemas.Album (v1.2.3)
 * deleted_at: [FIX Blocking#4, v1.2.0] Field tồn tại từ v1.1.1 nhưng không
 * khớp DDL — nay data_schema.yaml v1.2.0 đã bổ sung cột, hết mâu thuẫn.
 */
export interface Album {
    id: number
    user_id: number
    title: string
    description?: string
    is_public: boolean
    created_at: string // ISO 8601
    deleted_at: string | null // Soft delete timestamp
}

/**
 * IMAGE METADATA
 * Reference: openapi.yaml components.schemas.ImageMetadata (v1.2.3)
 */
export interface ImageMetadata {
    image_id: string // UUID
    user_id: number
    album_id?: number
    minio_url: string // Presigned download URL
    privacy_level: PrivacyLevel
    tags?: string[]
    created_at: string // ISO 8601
    index_status: IndexStatus
}

/**
 * PAGINATED LIST RESPONSE — shape chung của GET /albums, GET /media
 * (openapi.yaml: items[], total, offset, limit).
 */
export interface PaginatedResponse<T> {
    items: T[]
    total: number
    offset: number
    limit: number
}

export type AlbumListResponse = PaginatedResponse<Album>
export type MediaListResponse = PaginatedResponse<ImageMetadata>

/**
 * CREATE ALBUM REQUEST — openapi.yaml POST /albums request body.
 * required: [title]
 */
export interface CreateAlbumRequest {
    title: string
    description?: string
    is_public?: boolean // default: false
}

/**
 * UPDATE MEDIA REQUEST — openapi.yaml PUT /media/{id}/update request body.
 */
export interface UpdateMediaRequest {
    privacy_level?: PrivacyLevel
    tags?: string[]
}