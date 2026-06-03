export interface HealthStatus {
    status: 'ready' | 'unavailable' | 'error'
    timestamp: string
    dependencies?: {
        postgres?: string
        milvus?: string
        minio?: string
        ai_service?: string
    }
}

export interface StandardError {
    code: string
    message: string
    details?: Record<string, unknown>
}

export interface ScaffoldContextState {
    expectedVectorDim: number | null
    healthStatus: HealthStatus | null
    isHealthy: boolean
    lastHealthCheckAt: number | null
    error: StandardError | null
}

export const VECTOR_DIM_ERROR_CODE = 'ERR_VECTOR_DIM_MISMATCH' as const
export const DEFAULT_VECTOR_DIM = 512 as const