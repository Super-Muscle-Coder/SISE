/**
 * @file scaffold_adapters.ts
 * @layer adapters
 * @description Axios HTTP adapter with request/response interceptors, retry logic, and error standardization.
 *              All outbound HTTP calls route through this singleton adapter.
 * @owner AG-04
 * @reference
 *   - openapi.yaml (BearerAuth, IdempotencyKey, error codes)
 *   - data_schema.yaml (retry_policy, idempotency, presigned URLs)
 *   - SCAFFOLD_CONFIG for retry/idempotency/timeout values
 */

import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { SCAFFOLD_CONFIG } from '../configs/scaffold_configs'
import { AUTH_CONFIG } from '../configs/auth_configs'
import type { StandardError } from '../entities/scaffold_entities'

/**
 * HTTP Methods that support idempotency
 * Reference: openapi.yaml IdempotencyKey parameter (all mutating operations)
 */
const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/**
 * ScaffoldAdapter: Global HTTP client with error handling, auth injection, retries
 * Implements retry strategy per data_schema.yaml retry_policy
 * Implements idempotency tracking per data_schema.yaml idempotency
 */
export class ScaffoldAdapter {
    private client: AxiosInstance
    private requestRetryMap: Map<string, number> = new Map()  // Track retry attempts per request

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            timeout: SCAFFOLD_CONFIG.API.timeoutMs,
            headers: SCAFFOLD_CONFIG.API.defaultHeaders,
        })

        this.setupRequestInterceptor()
        this.setupResponseInterceptor()
        this.setupRetryInterceptor()
    }

    /**
     * REQUEST INTERCEPTOR
     * Injects JWT Bearer token, Idempotency-Key header, and request logging
     * Reference: openapi.yaml BearerAuth scheme
     */
    private setupRequestInterceptor(): void {
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                // ============================================================
                // 1. JWT Bearer Token Injection (per openapi.yaml BearerAuth)
                // ============================================================
                const token = AUTH_CONFIG.getStoredToken()
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`
                }

                // ============================================================
                // 2. Idempotency-Key Header Injection (per openapi.yaml parameter)
                // ============================================================
                if (
                    MUTATING_METHODS.includes(config.method?.toUpperCase() || '') &&
                    !config.headers[SCAFFOLD_CONFIG.IDEMPOTENCY.headerName]
                ) {
                    // Check if client previously stored a key for this URL
                    const storedKey = this.getStoredIdempotencyKey(config.url || '')
                    if (storedKey && SCAFFOLD_CONFIG.IDEMPOTENCY.isValidKey(storedKey.createdAtMs)) {
                        // Reuse stored key (enables server-side dedup)
                        config.headers[SCAFFOLD_CONFIG.IDEMPOTENCY.headerName] = storedKey.key
                    } else {
                        // Generate fresh key and store it
                        const newKey = uuidv4()
                        config.headers[SCAFFOLD_CONFIG.IDEMPOTENCY.headerName] = newKey
                        this.storeIdempotencyKey(config.url || '', newKey)
                    }
                }

                // ============================================================
                // 3. Request Logging (if enabled in config)
                // ============================================================
                if (SCAFFOLD_CONFIG.DEBUG.enableRequestLogging) {
                    SCAFFOLD_CONFIG.DEBUG.log(
                        'debug',
                        `[HTTP] ${config.method?.toUpperCase()} ${config.url}`,
                        { headers: config.headers }
                    )
                }

                return config
            },
            (error: unknown) => Promise.reject(error)
        )
    }

    /**
     * RESPONSE INTERCEPTOR
     * Handles errors, maps to StandardError, and implements 401 global logout
     * Reference: openapi.yaml error handling, data_schema.yaml error codes
     */
    private setupResponseInterceptor(): void {
        this.client.interceptors.response.use(
            (response) => {
                if (SCAFFOLD_CONFIG.DEBUG.enableRequestLogging) {
                    SCAFFOLD_CONFIG.DEBUG.log(
                        'debug',
                        `[HTTP] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`
                    )
                }
                return response
            },
            (error: AxiosError<unknown>) => {
                // ============================================================
                // CRITICAL: 401 UNAUTHORIZED — Auto-logout
                // ============================================================
                if (error.response?.status === 401) {
                    SCAFFOLD_CONFIG.DEBUG.log('warn', '[Auth] 401 Unauthorized detected. Auto-logging out.')

                    // Clear all auth data from localStorage
                    AUTH_CONFIG.clearStoredAuth()

                    // Dispatch session ended event (cross-tab sync + UI update)
                    window.dispatchEvent(
                        new CustomEvent(AUTH_CONFIG.events.sessionEnded, {
                            detail: { reason: 'unauthorized_401_intercepted', timestamp: Date.now() },
                        })
                    )

                    // Redirect to login (only if not already there)
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }

                    return Promise.reject(this.buildStandardError(401, 'Session expired'))
                }

                // ============================================================
                // STATUS-SPECIFIC ERROR HANDLING
                // ============================================================
                if (error.response?.status === 403) {
                    SCAFFOLD_CONFIG.DEBUG.log('warn', '[Auth] 403 Forbidden')
                    return Promise.reject(this.buildStandardError(403, 'Access forbidden'))
                }

                if (error.response?.status === 404) {
                    SCAFFOLD_CONFIG.DEBUG.log('warn', '[Client] 404 Not Found')
                    return Promise.reject(this.buildStandardError(404, 'Resource not found'))
                }

                if (error.response?.status === 409) {
                    SCAFFOLD_CONFIG.DEBUG.log('warn', '[Client] 409 Conflict (possible duplicate request)')
                    return Promise.reject(this.buildStandardError(409, 'Duplicate request detected'))
                }

                if (error.response?.status === 413) {
                    SCAFFOLD_CONFIG.DEBUG.log('warn', '[Client] 413 Payload Too Large')
                    return Promise.reject(this.buildStandardError(413, 'File exceeds size limit'))
                }

                // ============================================================
                // SERVER ERRORS (5xx) — Will be retried
                // ============================================================
                if (error.response && error.response.status >= 500) {
                    SCAFFOLD_CONFIG.DEBUG.log('error', `[Server] ${error.response.status} Server Error`)
                    return Promise.reject(this.buildStandardError(error.response.status, 'Server error'))
                }

                // ============================================================
                // TIMEOUT & NETWORK ERRORS
                // ============================================================
                if (error.code === 'ECONNABORTED') {
                    SCAFFOLD_CONFIG.DEBUG.log('error', '[Network] Request timeout')
                    return Promise.reject(
                        this.buildStandardError(408, 'Request timeout. Please try again.')
                    )
                }

                if (!error.response) {
                    SCAFFOLD_CONFIG.DEBUG.log('error', '[Network] Network error or no response')
                    return Promise.reject(
                        this.buildStandardError(0, 'Network error. Check your connection.')
                    )
                }

                // ============================================================
                // GENERIC ERROR HANDLER
                // ============================================================
                return Promise.reject(
                    this.buildStandardError(error.response?.status || 500, 'Request failed')
                )
            }
        )
    }

    /**
     * RETRY INTERCEPTOR
     * Implements exponential backoff retry logic per data_schema.yaml retry_policy
     * Reference: VITE_RETRY_MAX_ATTEMPTS, VITE_RETRY_BACKOFF_MS, VITE_RETRY_BACKOFF_FACTOR
     */
    private setupRetryInterceptor(): void {
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const config = error.config as InternalAxiosRequestConfig & { retryCount?: number }

                // Initialize retry counter if not present
                if (!config.retryCount) {
                    config.retryCount = 0
                }

                // Determine if we should retry
                const isRetryable =
                    config.retryCount < SCAFFOLD_CONFIG.RETRY.maxAttempts &&
                    SCAFFOLD_CONFIG.RETRY.isRetryableStatus(error.response?.status || 0)

                if (!isRetryable) {
                    return Promise.reject(error)
                }

                // Increment retry counter
                config.retryCount += 1

                // Calculate backoff delay
                const backoffMs = SCAFFOLD_CONFIG.RETRY.getBackoffMs(config.retryCount - 1)
                SCAFFOLD_CONFIG.DEBUG.log(
                    'info',
                    `[Retry] Attempt ${config.retryCount}/${SCAFFOLD_CONFIG.RETRY.maxAttempts} after ${backoffMs}ms delay`,
                    { url: config.url }
                )

                // Wait before retrying
                await new Promise((resolve) => setTimeout(resolve, backoffMs))

                // Retry the request
                return this.client(config)
            }
        )
    }

    /**
     * Helper: Build StandardError from HTTP status + message
     * Reference: openapi.yaml Error schema
     */
    private buildStandardError(status: number, message: string): StandardError {
        const codeMap: Record<number, string> = {
            400: 'ERR_BAD_REQUEST',
            401: 'ERR_UNAUTHORIZED',
            403: 'ERR_FORBIDDEN',
            404: 'ERR_NOT_FOUND',
            409: 'ERR_CONFLICT',
            413: 'ERR_PAYLOAD_TOO_LARGE',
            500: 'ERR_INTERNAL_SERVER_ERROR',
            503: 'ERR_SERVICE_UNAVAILABLE',
        }

        return {
            code: codeMap[status] || 'ERR_UNKNOWN',
            message,
            details: { httpStatus: status },
        }
    }

    /**
     * Helper: Store idempotency key in localStorage with timestamp
     * Returns key for reuse within TTL window
     */
    private storeIdempotencyKey(url: string, key: string): void {
        const storageKey = `${SCAFFOLD_CONFIG.IDEMPOTENCY.storageKeyPrefix}${url}`
        localStorage.setItem(
            storageKey,
            JSON.stringify({
                key,
                createdAtMs: Date.now(),
            })
        )
    }

    /**
     * Helper: Retrieve idempotency key from localStorage
     */
    private getStoredIdempotencyKey(url: string): { key: string; createdAtMs: number } | null {
        const storageKey = `${SCAFFOLD_CONFIG.IDEMPOTENCY.storageKeyPrefix}${url}`
        const stored = localStorage.getItem(storageKey)
        if (!stored) return null
        try {
            return JSON.parse(stored)
        } catch (e) {
            return null
        }
    }

    /**
     * PUBLIC API: Get underlying Axios instance
     * Use only for advanced scenarios (not recommended)
     */
    public getClient(): AxiosInstance {
        return this.client
    }

    /**
     * Generic GET request wrapper
     * @template T Response data type
     */
    public async get<T = unknown>(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<{ data: T; headers: Record<string, unknown> }> {
        const response = await this.client.get<T>(url, config)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Generic POST request wrapper
     */
    public async post<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<{ data: T; headers: Record<string, unknown> }> {
        const response = await this.client.post<T>(url, data, config)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Generic PUT request wrapper
     */
    public async put<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<{ data: T; headers: Record<string, unknown> }> {
        const response = await this.client.put<T>(url, data, config)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Generic PATCH request wrapper
     */
    public async patch<T = unknown>(
        url: string,
        data?: unknown,
        config?: AxiosRequestConfig
    ): Promise<{ data: T; headers: Record<string, unknown> }> {
        const response = await this.client.patch<T>(url, data, config)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Generic DELETE request wrapper
     */
    public async delete(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<{ status: number; headers: Record<string, unknown> }> {
        const response = await this.client.delete(url, config)
        return {
            status: response.status,
            headers: response.headers,
        }
    }

    /**
     * Health Readiness Probe
     * Reference: openapi.yaml GET /health/readiness
     * Returns X-Expected-Vector-Dim header for client validation
     */
    public async getHealthReadiness(
        options?: AxiosRequestConfig
    ): Promise<{
        data: Record<string, unknown>
        headers: Record<string, unknown>
    }> {
        const response = await this.client.get(SCAFFOLD_CONFIG.HEALTH.readinessPath, options)
        return {
            data: response.data,
            headers: response.headers,
        }
    }

    /**
     * Health Liveness Probe
     * Reference: openapi.yaml GET /health/liveness
     */
    public async getHealthLiveness(
        options?: AxiosRequestConfig
    ): Promise<Record<string, unknown>> {
        const response = await this.client.get(SCAFFOLD_CONFIG.HEALTH.livenessPath, options)
        return response.data
    }
}

/**
 * Global Axios Adapter Instance
 * Used by all services, components, and hooks for HTTP communication.
 * Configuration sourced from SCAFFOLD_CONFIG (env-driven, no hardcoding).
 */
export const scaffoldAdapter = new ScaffoldAdapter(SCAFFOLD_CONFIG.API.baseUrl)