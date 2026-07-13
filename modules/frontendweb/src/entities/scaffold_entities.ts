/**
 * @file scaffold_entities.ts
 * @layer entities
 * @description Type definitions CHỈ thuộc riêng scaffold: HealthStatus,
 *              StandardError (dùng chung toàn app — ngoại lệ hợp lệ duy nhất,
 *              xem Workflow_Centric_Architecture.md §2.4.2), ScaffoldContextState.
 *              Mọi type nghiệp vụ khác (User, Album, ImageMetadata,
 *              SearchResponse...) đã dời về đúng [workflow]_entities.ts
 *              tương ứng — KHÔNG khai báo lại ở đây.
 * @owner AG-04
 * @reference
 *   - openapi.yaml components.schemas.HealthStatus, Error (v1.2.3)
 *   - data_schema.yaml observability.health_probes
 */

/**
 * Health Status Type
 * Reference: openapi.yaml components.schemas.HealthStatus (v1.2.3)
 * Returned by /health/liveness và /health/readiness.
 */
export interface HealthStatus {
    status: string // openapi.yaml không ràng buộc enum cứng, chỉ có example: "ready"
    timestamp: string // ISO 8601 date-time string
    /**
     * [APPEND v1.2.0] Kết quả validate cấu hình scaffold (vd vector_dim khớp
     * global_configs, presigned_url_expiry_sec > 0, env var bắt buộc đã có
     * giá trị). false nghĩa là có ít nhất 1 config sai — dependencies bên
     * dưới có thể vẫn "connected" nhưng service KHÔNG nên coi là sẵn sàng
     * phục vụ. isAppReady() ở scaffold_services.ts PHẢI xét field này.
     */
    config_validated?: boolean
    dependencies?: {
        postgres?: string  // Bao gồm cả pgvector extension
        minio?: string
        ai_service?: string
        redis?: string     // [APPEND v1.2.0] Celery broker + idempotency-key store
    }
}

/**
 * Standard Error Response Type
 * Reference: openapi.yaml components.schemas.Error
 * Type DUY NHẤT được phép dùng chung toàn app — mọi [workflow]_entities.ts
 * khác import lại từ đây, KHÔNG tự định nghĩa trùng lặp
 * (xem Workflow_Centric_Architecture.md §2.4.2, AP-9).
 */
export interface StandardError {
    code: string
    message: string
    details?: Record<string, unknown>
}

/**
 * Scaffold Application State Type
 * Internal app state, dùng bởi ScaffoldContextProvider.
 */
export interface ScaffoldContextState {
    expectedVectorDim: number | null  // Từ header X-Expected-Vector-Dim
    healthStatus: HealthStatus | null
    isHealthy: boolean
    lastHealthCheckAt: number | null  // Timestamp (ms)
    error: StandardError | null
}

/**
 * Error Code Constants — tập giá trị StandardError.code đã xác nhận dùng
 * thật xuyên suốt dự án (BackendModule + FrontendModule). openapi.yaml
 * không ràng buộc đây là enum cứng, nhưng PHẢI import từ đây, không
 * hardcode string literal ở nơi khác.
 */
export const ERROR_CODES = {
    VECTOR_DIM_MISMATCH: 'ERR_VECTOR_DIM_MISMATCH',
    HEALTH_CHECK_FAILED: 'ERR_HEALTH_CHECK_FAILED',
    UNAUTHORIZED: 'ERR_UNAUTHORIZED',
    FORBIDDEN: 'ERR_FORBIDDEN',
    FORBIDDEN_ADMIN_ONLY: 'ERR_FORBIDDEN_ADMIN_ONLY', // openapi.yaml /eval/run, /admin/reindex 403
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
        typeof (value as HealthStatus).status === 'string'
    )
}