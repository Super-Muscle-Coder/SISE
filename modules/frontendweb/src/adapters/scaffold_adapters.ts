/**
 * @file scaffold_adapters.ts
 * @layer adapters
 * @description Axios HTTP adapter with request/response interceptors, retry logic, and error standardization.
 *              All outbound HTTP calls route through this singleton adapter.
 *              SỬA (phát hiện Blocking khi debug upload thật):
 *              setupResponseInterceptor() TRƯỚC ĐÂY tự bắt riêng lỗi 409
 *              và ném StandardError MỚI (buildStandardError), LÀM MẤT
 *              error.response.data gốc. Điều này phá vỡ chính thiết kế
 *              idempotency đã thống nhất từ đầu (409 phải giữ nguyên
 *              response.data để tầng gọi phía trên — vd upload_adapters.ts
 *              — tự quyết định coi đây là thành công hay lỗi thật, tùy
 *              endpoint). Hậu quả thực tế: upload_adapters.ts's
 *              isAxiosConflictWithData() luôn trả false vì error nhận
 *              được không còn là AxiosError thật (axios.isAxiosError()
 *              fail) — mọi request presign/confirm gặp 409 hợp lệ (đúng
 *              thiết kế idempotency) đều bị coi là lỗi thật, kích hoạt
 *              retry ở tầng nghiệp vụ (upload_services.ts), gây lặp
 *              request 3 lần rồi thất bại hẳn.
 *              Đã bỏ hẳn nhánh xử lý 409 riêng — lỗi 409 giờ đi qua đúng
 *              nguyên bản AxiosError, để từng adapter (upload_adapters.ts,
 *              friends_adapters.ts...) tự quyết định ý nghĩa 409 theo
 *              đúng ngữ cảnh endpoint của nó, không áp 1 chính sách chung
 *              sai cho mọi trường hợp.
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
        // SỬA (Blocking, phát hiện khi debug Edit/Delete media): thứ tự
        // đăng ký ĐẢO NGƯỢC so với bản cũ — setupRetryInterceptor() PHẢI
        // chạy TRƯỚC setupResponseInterceptor(). Axios chạy các response
        // interceptor lỗi theo ĐÚNG thứ tự đăng ký (đăng ký trước chạy
        // trước). Bản cũ: setupResponseInterceptor() chạy trước, biến MỌI
        // lỗi HTTP (401/403/404/413/5xx/timeout/network) thành object
        // StandardError MỚI (mất field .config gốc của AxiosError) —
        // setupRetryInterceptor() chạy sau, cố đọc error.config để track
        // số lần retry, nhưng error lúc này không còn .config nữa →
        // TypeError "Cannot read properties of undefined (reading
        // 'retryCount')" — lỗi này che mất hoàn toàn lỗi HTTP thật (vd
        // lỗi 500 từ Backend), khiến UI hiển thị thông báo vô nghĩa thay
        // vì lỗi thật. Nay retry chạy TRƯỚC (luôn thấy AxiosError gốc còn
        // nguyên .config), normalize lỗi thành StandardError chạy SAU
        // CÙNG (chỉ xử lý lỗi CUỐI CÙNG sau khi đã thử retry xong).
        this.setupRetryInterceptor()
        this.setupResponseInterceptor()
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
                // SỬA (phát hiện Blocking khi debug upload thật): TRƯỚC ĐÂY
                // tự động NHỚ và TÁI SỬ DỤNG key theo URL
                // (localStorage key = `idempotency_${url}`) — nhưng
                // "cùng URL" KHÔNG có nghĩa là "cùng thao tác nghiệp vụ".
                // Ví dụ thật đã xảy ra: upload EM1.jpg rồi upload EM4.jpg
                // đều gọi POST /media/upload-url (cùng URL, khác file hoàn
                // toàn) — code cũ tái sử dụng key đã lưu cho EM1.jpg, khiến
                // Backend coi EM4.jpg là request TRÙNG LẶP với EM1.jpg (409,
                // trả lại y hệt presigned URL cũ của EM1.jpg). Idempotency-Key
                // mang Ý NGHĨA NGHIỆP VỤ (đại diện 1 thao tác cụ thể của
                // người dùng), không phải khái niệm HTTP chung theo URL —
                // tầng scaffoldAdapter (transport chung) KHÔNG được tự ý
                // quyết định 2 request có "cùng là 1 thao tác" hay không.
                // Nay LUÔN sinh UUID MỚI cho mỗi request — nếu 1 workflow
                // cụ thể (vd retry đúng nghĩa cho CÙNG 1 file) cần giữ cố
                // định 1 key qua nhiều lần gọi, adapter của WORKFLOW ĐÓ
                // (không phải scaffoldAdapter) phải tự truyền key qua
                // config.headers, ghi đè giá trị mặc định ở đây.
                // ============================================================
                if (
                    MUTATING_METHODS.includes(config.method?.toUpperCase() || '') &&
                    !config.headers[SCAFFOLD_CONFIG.IDEMPOTENCY.headerName]
                ) {
                    config.headers[SCAFFOLD_CONFIG.IDEMPOTENCY.headerName] = uuidv4()
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
     *
     * SỬA: KHÔNG còn xử lý riêng 409 ở đây — 409 đi qua nguyên bản
     * AxiosError, để từng adapter tự quyết định ý nghĩa theo đúng endpoint
     * (idempotency success vs conflict thật). Đây là ngoại lệ có chủ đích
     * so với các status khác (401/403/404/413), vì CHỈ 409 có 2 khả năng
     * ngữ nghĩa khác nhau tùy endpoint — các status còn lại luôn là lỗi
     * thật trong mọi trường hợp của hệ thống này.
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

                // SỬA: nhánh 409 đã bị XÓA khỏi đây — KHÔNG bọc lại thành
                // StandardError nữa. Lỗi 409 giữ nguyên AxiosError thật,
                // tiếp tục rơi xuống nhánh "GENERIC ERROR HANDLER" bên
                // dưới CHỈ KHI nó thực sự đi hết pipeline reject — nhưng vì
                // Promise.reject(error) ở generic handler dùng error GỐC
                // (không tạo mới), axios.isAxiosError(error) ở tầng gọi
                // (upload_adapters.ts) sẽ trả true, error.response.data
                // vẫn còn nguyên — đúng yêu cầu idempotency.

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
                // GENERIC ERROR HANDLER — bao gồm cả 409 giờ rơi vào đây,
                // dùng Promise.reject(error) với error GỐC (không tạo mới
                // StandardError), giữ nguyên AxiosError + response.data để
                // tầng gọi (adapters cụ thể) tự xử lý ý nghĩa 409.
                // ============================================================
                if (error.response?.status === 409) {
                    return Promise.reject(error)
                }

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
     *
     * LƯU Ý: interceptor này chạy TRƯỚC setupResponseInterceptor() trong
     * chuỗi xử lý lỗi thực tế của axios (interceptor đăng ký sau chạy
     * trước đối với response error) — SCAFFOLD_CONFIG.RETRY.isRetryableStatus()
     * đã audit từ trước CHỈ coi 408/429/5xx là retryable, KHÔNG bao gồm
     * 409 — xác nhận lại đây để tránh vòng lặp retry kép giữa tầng HTTP
     * (ở đây) và tầng nghiệp vụ (upload_services.ts's processSingle loop).
     */
    private setupRetryInterceptor(): void {
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const config = error.config as InternalAxiosRequestConfig & {
                    retryCount?: number
                    skipRetry?: boolean
                }

                // SỬA: đọc cờ skipRetry — 1 số request (vd POST /eval/run,
                // không idempotent, mỗi lần gọi tạo 1 bản ghi mới trong DB)
                // cần đánh dấu tường minh KHÔNG được tự động retry, để
                // tránh kích hoạt nhiều lần thao tác trùng lặp phía Backend
                // chỉ vì timeout ở tầng client trong khi Backend vẫn đang
                // xử lý bình thường.
                if (config?.skipRetry) {
                    return Promise.reject(error)
                }

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