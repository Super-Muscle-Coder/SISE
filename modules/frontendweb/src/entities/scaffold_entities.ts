/**
 * @file scaffold_entities.ts
 * @layer entities
 * @description Type definitions for scaffold domain (health, errors, app state).
 *              All types derive from openapi.yaml schema definitions or app-specific state.
 * @owner AG-04
 * @reference
 *   - openapi.yaml HealthStatus, Error schemas
 *   - data_schema.yaml global_configs (vector_dim)
 */

/**
 * Health Status Type
 * Reference: openapi.yaml components.schemas.HealthStatus
 * Returned by /health/liveness and /health/readiness endpoints
 */
export interface HealthStatus {
    status: 'ready' | 'unavailable'  // ✅ FIXED: Removed invalid 'error' state per openapi.yaml
    timestamp: string                  // ISO 8601 date-time string
    dependencies?: {
        postgres?: string
        milvus?: string
        minio?: string
        ai_service?: string
    }
}

/**
 * Standard Error Response Type
 * Reference: openapi.yaml components.schemas.Error
 * Used for all error responses with error code, message, and optional details
 */
export interface StandardError {
    code: string
    message: string
    details?: Record<string, unknown>
}

/**
 * Authentication Response Type
 * Reference: openapi.yaml components.schemas.AuthResponse
 * Returned by /auth/login and /auth/register endpoints
 */
export interface AuthResponse {
    access_token: string
    token_type: 'bearer'
    expires_in: number  // Seconds
}

/**
 * User Profile Type
 * Reference: openapi.yaml components.schemas.User
 * Returned by /auth/me and /auth/register endpoints
 */
export interface User {
    id: number
    username: string
    email: string
    created_at: string  // ISO 8601 date-time
}

/**
 * Album Type
 * Reference: openapi.yaml components.schemas.Album
 * Represents a user's image collection
 */
export interface Album {
    id: number
    user_id: number
    title: string
    description?: string
    is_public: boolean
    created_at: string  // ISO 8601 date-time
    deleted_at: string | null  // Soft delete timestamp
}

/**
 * Image Metadata Type
 * Reference: openapi.yaml components.schemas.ImageMetadata
 * Metadata for uploaded and indexed images
 */
export interface ImageMetadata {
    image_id: string  // UUID
    user_id: number
    album_id?: number
    minio_url: string  // Presigned download URL
    privacy_level: 0 | 1 | 2  // 0=Private, 1=Friends, 2=Public
    tags?: string[]
    created_at: string  // ISO 8601 date-time
    index_status: 'pending' | 'ready' | 'failed'
}

/**
 * Presigned Upload Response Type
 * Reference: openapi.yaml components.schemas.PresignedUploadResponse
 * Returned by POST /media/upload-url endpoint
 */
export interface PresignedUploadResponse {
    upload_url: string  // Presigned PUT URL for MinIO
    object_key: string  // Object key in MinIO bucket
    expires_in_sec: number
    max_file_size_mb: number
    allowed_content_types: string[]
}

/**
 * Vector Embedding Type
 * Reference: openapi.yaml components.schemas.VectorEmbedding
 * Latent vector representation (must match VITE_DEFAULT_VECTOR_DIM or VITE_SUPPORTED_VECTOR_DIMS)
 */
export type VectorEmbedding = number[]

/**
 * Vector Embedding Response Type
 * Reference: openapi.yaml components.schemas.VectorEmbeddingResponse
 * Returned by /inference/embed/image and /inference/embed/text endpoints
 */
export interface VectorEmbeddingResponse {
    vector: VectorEmbedding
    dim: number
    model: string
}

/**
 * Search Result Item Type
 * Reference: openapi.yaml components.schemas.SearchResultItem
 * Individual result from search endpoints
 */
export interface SearchResultItem {
    image_id: string  // UUID
    score: number    // Similarity score (0-1 for cosine similarity)
    minio_url: string
    metadata: ImageMetadata
}

/**
 * Search Response Type
 * Reference: openapi.yaml components.schemas.SearchResponse
 * Returned by /search/image and /search/text endpoints
 */
export interface SearchResponse {
    results: SearchResultItem[]
    latency_ms: number
    top_k: number
}

/**
 * Evaluation Metrics Type
 * Reference: openapi.yaml /eval/metrics endpoint
 * Performance benchmarking indices
 */
export interface EvaluationMetrics {
    mrr: number  // Mean Reciprocal Rank (0-1)
    hit_rate: number  // Hit Rate@K (0-1)
    precision: number  // Precision@K (0-1)
    recall: number  // Recall (0-1)
}

/**
 * Evaluation Results Type
 * Reference: openapi.yaml /eval/results/{eval_id} endpoint
 * Results of a completed evaluation run
 */
export interface EvaluationResult {
    eval_id: string  // UUID
    status: 'running' | 'completed' | 'failed'
    mrr?: number
    hit_rate?: number
    precision?: number
    recall?: number
    query_count?: number
    completed_at?: string  // ISO 8601 date-time
}

/**
 * Scaffold Application State Type
 * Internal app state derived from/including contract types
 * Used by ScaffoldContextProvider for global scaffolding state
 */
export interface ScaffoldContextState {
    expectedVectorDim: number | null  // From /health/readiness header X-Expected-Vector-Dim
    healthStatus: HealthStatus | null
    isHealthy: boolean
    lastHealthCheckAt: number | null  // Timestamp (ms)
    error: StandardError | null
}

/**
 * Error Code Constants
 * Reference: openapi.yaml Error.code examples, data_schema.yaml
 * Do NOT hardcode these values in code; import from here
 */
export const ERROR_CODES = {
    VECTOR_DIM_MISMATCH: 'ERR_VECTOR_DIM_MISMATCH',
    HEALTH_CHECK_FAILED: 'ERR_HEALTH_CHECK_FAILED',
    UNAUTHORIZED: 'ERR_UNAUTHORIZED',
    FORBIDDEN: 'ERR_FORBIDDEN',
    NOT_FOUND: 'ERR_NOT_FOUND',
    CONFLICT: 'ERR_CONFLICT',
} as const

/**
 * Type Guard: Check if value is StandardError
 */
export const isStandardError = (value: unknown): value is StandardError => {
    return (
        typeof value === 'object' &&
        value !== null &&
        'code' in value &&
        'message' in value &&
        typeof (value as StandardError).code === 'string' &&
        typeof (value as StandardError).message === 'string'
    )
}

/**
 * Type Guard: Check if response is HealthStatus
 */
export const isHealthStatus = (value: unknown): value is HealthStatus => {
    return (
        typeof value === 'object' &&
        value !== null &&
        'status' in value &&
        ('ready' === (value as HealthStatus).status || 'unavailable' === (value as HealthStatus).status)
    )
}