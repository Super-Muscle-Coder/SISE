// src/entities/media_entities.ts
// Strict types for media management workflow (T004-03)
// No barrel files, no utils — purely data contracts

export enum IndexStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
  TIMEOUT_RETRY = 'timeout_retry',
}

export enum PrivacyLevel {
  PRIVATE = 0,
  FRIENDS = 1,
  PUBLIC = 2,
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

export interface Album {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface PresignedUploadResponse {
  upload_url: string; // Direct PUT URL to MinIO, expires after presigned_url_expiry_sec
  object_key: string; // Path key in MinIO for later confirmation
  expires_in_sec: number;
  max_file_size_mb: number;
  allowed_content_types: string[];
}

export interface UploadResponse {
  image_id: string; // UUID of registered image
  status: string; // e.g., 'pending' or 'ready'
  index_status: IndexStatus;
  minio_url: string; // Initial presigned GET URL
}

export interface ImageMetadata {
  id: string;
  user_id: number;
  album_id: number | null;
  minio_url: string; // Signed GET URL (if authorized)
  privacy_level: PrivacyLevel;
  tags: string[];
  created_at: string;
  index_status: IndexStatus;
  width: number;
  height: number;
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

export interface StandardError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}