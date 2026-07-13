/**
 * @file media_entities.ts
 * @layer entities
 * @description Type definitions cho workflow media (Album + Image CRUD +
 *              Upload). Khớp 1-1 openapi.yaml Album, ImageMetadata,
 *              UploadResponse, PresignedUploadResponse, PrivacyLevel,
 *              IndexStatus (v1.2.3).
 * @owner AG-04
 * @reference openapi.yaml components.schemas.Album/ImageMetadata/
 *            UploadResponse/PrivacyLevel/IndexStatus
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
 * UPLOAD RESPONSE
 * Reference: openapi.yaml components.schemas.UploadResponse
 * Trả về khi client xác nhận upload xong (S3_Metadata_Pending — xem
 * data_schema.yaml transaction_semantics.upload_pipeline).
 */
export interface UploadResponse {
    image_id: string // UUID
    minio_url: string
    status: string // example: "pending"
    index_status: IndexStatus
}

/**
 * PRESIGNED UPLOAD RESPONSE
 * Trả về bởi bước S1_Presigned (POST /media/upload-url).
 * openapi.yaml không định nghĩa schema riêng tên này trong components —
 * cấu trúc suy từ transaction_semantics.upload_pipeline (data_schema.yaml)
 * và hành vi Backend đã audit.
 */
export interface PresignedUploadResponse {
    upload_url: string // Presigned PUT URL cho MinIO
    object_key: string // Object key trong MinIO bucket
    expires_in_sec: number
    max_file_size_mb: number
    allowed_content_types: string[]
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