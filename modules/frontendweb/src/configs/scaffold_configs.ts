/**
 * @file scaffold_configs.ts
 * @layer configs
 * @description Centralized configuration object derived from environment variables.
 *              Single source of truth for app-wide configuration.
 * @owner AG-04
 * @reference data_schema.yaml, openapi.yaml
 */

import {
    getEnvVarWithDefault,
    getEnvNumberWithDefault,
    getEnvBooleanWithDefault,
    getEnvListWithDefault,
} from '@/utils/env_helpers';

// ============================================================================
// SCAFFOLD CONFIGURATION OBJECT
// ============================================================================

export const SCAFFOLD_CONFIG = {
    /**
     * API Gateway Configuration
     */
    API: {
        baseUrl: getEnvVarWithDefault('VITE_API_BASE_URL', 'http://localhost:8000'),
        timeoutMs: getEnvNumberWithDefault('VITE_API_TIMEOUT_MS', 10000),
        defaultHeaders: {
            'Content-Type': 'application/json',
        },
    } as const,

    /**
     * Health & Readiness Probe Configuration
     */
    HEALTH: {
        checkIntervalMs: getEnvNumberWithDefault('VITE_HEALTH_CHECK_INTERVAL_MS', 30000),
        livenessPath: '/health/liveness',
        readinessPath: '/health/readiness',
    } as const,

    /**
     * Retry Policy Configuration
     * Implements exponential backoff: backoff_ms × (factor ^ attempt_number)
     */
    RETRY: {
        maxAttempts: getEnvNumberWithDefault('VITE_RETRY_MAX_ATTEMPTS', 3),
        backoffMs: getEnvNumberWithDefault('VITE_RETRY_BACKOFF_MS', 1000),
        backoffFactor: getEnvNumberWithDefault('VITE_RETRY_BACKOFF_FACTOR', 2),
        getBackoffMs: (attemptNumber: number): number => {
            const backoffMs = getEnvNumberWithDefault('VITE_RETRY_BACKOFF_MS', 1000);
            const backoffFactor = getEnvNumberWithDefault('VITE_RETRY_BACKOFF_FACTOR', 2);
            return backoffMs * Math.pow(backoffFactor, attemptNumber);
        },
        isRetryableStatus: (status: number): boolean => {
            return status === 408 || status === 429 || (status >= 500 && status < 600);
        },
    } as const,

    /**
     * Idempotency Configuration
     * Prevents duplicate request processing within TTL window
     */
    IDEMPOTENCY: {
        headerName: 'Idempotency-Key',
        ttlHours: getEnvNumberWithDefault('VITE_IDEMPOTENCY_TTL_HOURS', 24),
        storageKeyPrefix: 'idempotency_',
        isValidKey: (createdAtMs: number): boolean => {
            const ttlHours = getEnvNumberWithDefault('VITE_IDEMPOTENCY_TTL_HOURS', 24);
            const ttlMs = ttlHours * 60 * 60 * 1000;
            return Date.now() - createdAtMs < ttlMs;
        },
    } as const,

    /**
     * Presigned Upload Configuration
     */
    UPLOAD: {
        expirySeconds: getEnvNumberWithDefault('VITE_PRESIGNED_URL_EXPIRY_SEC', 3600),
        maxFileSizeMb: getEnvNumberWithDefault('VITE_MAX_FILE_SIZE_MB', 20),
        allowedContentTypes: getEnvListWithDefault('VITE_ALLOWED_CONTENT_TYPES', [
            'image/jpeg',
            'image/png',
        ]),
        validateFile: (file: File): { isValid: boolean; error?: string } => {
            const maxFileSize = getEnvNumberWithDefault('VITE_MAX_FILE_SIZE_MB', 20);
            const allowedTypes = getEnvListWithDefault('VITE_ALLOWED_CONTENT_TYPES', [
                'image/jpeg',
                'image/png',
            ]);

            const maxBytes = maxFileSize * 1024 * 1024;
            if (file.size > maxBytes) {
                return { isValid: false, error: `File exceeds ${maxFileSize}MB limit` };
            }
            if (!allowedTypes.includes(file.type)) {
                return { isValid: false, error: `Content type ${file.type} not allowed` };
            }
            return { isValid: true };
        },
    } as const,

    /**
     * Vector Embedding Configuration
     */
    VECTOR: {
        defaultDim: getEnvNumberWithDefault('VITE_DEFAULT_VECTOR_DIM', 512),
        supportedDims: getEnvListWithDefault('VITE_SUPPORTED_VECTOR_DIMS', ['512', '768']).map(
            (d) => parseInt(d, 10)
        ),
        validateDimension: (vectorLength: number): { isValid: boolean; error?: string } => {
            const supportedDims = getEnvListWithDefault('VITE_SUPPORTED_VECTOR_DIMS', [
                '512',
                '768',
            ]).map((d) => parseInt(d, 10));

            if (!supportedDims.includes(vectorLength)) {
                return {
                    isValid: false,
                    error: `Vector dimension ${vectorLength} not supported. Expected one of: ${supportedDims.join(
                        ', '
                    )}`,
                };
            }
            return { isValid: true };
        },
    } as const,

    /**
     * Authentication Storage & Session Configuration
     */
    AUTH: {
        tokenStorageKey: getEnvVarWithDefault('VITE_AUTH_STORAGE_TOKEN_KEY', 'sise_auth_token'),
        userStorageKey: getEnvVarWithDefault('VITE_AUTH_STORAGE_USER_KEY', 'sise_user_data'),
        events: {
            sessionEnded: getEnvVarWithDefault('VITE_SESSION_ENDED_EVENT', 'sessionExpired'),
            sessionStarted: getEnvVarWithDefault('VITE_SESSION_STARTED_EVENT', 'sessionStarted'),
        },
        getStoredToken: (): string | null => {
            const tokenKey = getEnvVarWithDefault('VITE_AUTH_STORAGE_TOKEN_KEY', 'sise_auth_token');
            const token = localStorage.getItem(tokenKey);
            if (!token || token === 'undefined' || token === 'null') return null;
            return token;
        },
        setStoredToken: (token: string): void => {
            const tokenKey = getEnvVarWithDefault('VITE_AUTH_STORAGE_TOKEN_KEY', 'sise_auth_token');
            localStorage.setItem(tokenKey, token);
        },
        clearStoredAuth: (): void => {
            const tokenKey = getEnvVarWithDefault('VITE_AUTH_STORAGE_TOKEN_KEY', 'sise_auth_token');
            const userKey = getEnvVarWithDefault('VITE_AUTH_STORAGE_USER_KEY', 'sise_user_data');
            localStorage.removeItem(tokenKey);
            localStorage.removeItem(userKey);
        },
    } as const,

    /**
     * Error Code Mappings
     */
    ERROR_CODES: {
        VECTOR_DIM_MISMATCH: 'ERR_VECTOR_DIM_MISMATCH',
        HEALTH_CHECK_FAILED: 'ERR_HEALTH_CHECK_FAILED',
        UNAUTHORIZED: 'ERR_UNAUTHORIZED',
        FORBIDDEN: 'ERR_FORBIDDEN',
        NOT_FOUND: 'ERR_NOT_FOUND',
        CONFLICT: 'ERR_CONFLICT',
        PAYLOAD_TOO_LARGE: 'ERR_PAYLOAD_TOO_LARGE',
        INTERNAL_SERVER_ERROR: 'ERR_INTERNAL_SERVER_ERROR',
    } as const,

    /**
     * HTTP Status Code Categories
     */
    HTTP_STATUS: {
        RETRYABLE: [408, 429, 500, 502, 503, 504],
        CLIENT_ERROR: [400, 401, 403, 404, 409, 413],
        SERVER_ERROR: [500, 502, 503, 504],
    } as const,

    /**
     * Logging & Debug Configuration
     */
    DEBUG: {
        logLevel: getEnvVarWithDefault('VITE_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
        enableRequestLogging: getEnvBooleanWithDefault('VITE_ENABLE_REQUEST_LOGGING', false),
        log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void => {
            const logLevel = getEnvVarWithDefault('VITE_LOG_LEVEL', 'info');
            const levels = { debug: 0, info: 1, warn: 2, error: 3 };
            if (levels[level] >= levels[logLevel as keyof typeof levels]) {
                const method = level === 'warn' || level === 'error' ? level : 'log';
                console[method](`[${level.toUpperCase()}] ${message}`, data);
            }
        },
    } as const,
} as const;

export type ScaffoldConfigType = typeof SCAFFOLD_CONFIG;