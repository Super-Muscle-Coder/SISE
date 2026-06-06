/**
 * @file media_entities.ts
 * @layer entities
 * @description Strict types for media management workflow (T004-03)
 *              Type-only file. No barrel exports. No utils.
 *              Matches openapi.yaml contract exactly.
 * @owner AG-04
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum IndexStatus {
    PENDING = 'pending',
    READY = 'ready',
    FAILED = 'failed',
}

export enum PrivacyLevel {
    PRIVATE = 0,
    FRIENDS = 1,
    PUBLIC = 2,
}

// ============================================================================
// API REQUEST/RESPONSE TYPES (from openapi.yaml)
// ============================================================================

export interface PresignedUploadRequest {
    filename: string;
    content_type: string;
    expected_size_mb?: number;
}

export interface PresignedUploadResponse {
    upload_url: string; // Direct PUT URL to MinIO, expires after presigned_url_expiry_sec
    object_key: string; // Path key in MinIO for later confirmation
    expires_in_sec: number;
    max_file_size_mb: number;
    allowed_content_types: string[];
}

export interface UploadConfirmRequest {
    object_key: string;
    album_id: number | null;
    privacy_level: PrivacyLevel;
    tags?: string[];
}

export interface UploadResponse {
    image_id: string; // UUID of registered image
    status: string; // e.g., 'pending' or 'ready'
    index_status: IndexStatus;
    minio_url: string; // Initial presigned GET URL
}

export interface ImageMetadata {
    id: string; // UUID
    user_id: number;
    album_id: number | null;
    minio_url: string; // Presigned signed GET URL from backend (if authorized)
    privacy_level: PrivacyLevel;
    tags: string[];
    created_at: string; // ISO 8601 timestamp
    index_status: IndexStatus;
    width: number; // For aspect-ratio calculation
    height: number;
}

export interface MediaItem {
    id: string; // UUID
    user_id: number;
    album_id: number | null;
    minio_object_name: string;
    minio_bucket: string;
    privacy_level: PrivacyLevel;
    tags: string[];
    index_status: IndexStatus;
    created_at: string; // ISO 8601 timestamp
    updated_at: string;
    deleted_at: string | null; // Soft delete marker; backend filters, frontend respects
    width: number; // For aspect-ratio calculation
    height: number;
    minio_url: string; // Presigned signed GET URL from backend (if authorized)
}

export interface PaginationMeta {
    current_page: number;
    page_size: number;
    total_items: number;
    has_next: boolean;
}

export interface MediaListResponse {
    items: MediaItem[];
    meta: PaginationMeta;
}

export interface Album {
    id: number;
    user_id: number;
    title: string;
    description: string | null;
    is_public: boolean;
    created_at: string;
    deleted_at: string | null;
}

// ============================================================================
// ERROR RESPONSE TYPES (from openapi.yaml)
// ============================================================================

export interface StandardError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}