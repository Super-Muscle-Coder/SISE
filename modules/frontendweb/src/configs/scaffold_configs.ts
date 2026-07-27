/**
 * @file scaffold_configs.ts
 * @layer configs
 * @description Cấu hình lõi dùng chung toàn app: API Gateway, Health probe,
 *              Retry Policy, Idempotency, Presigned Upload, Vector Dimension.
 *              Đây là những giá trị KHÔNG thuộc riêng 1 workflow nghiệp vụ nào
 *              (auth/media/search/eval) — thuộc phạm vi scaffold theo đúng
 *              Workflow_Centric_Architecture.md §2.4.2.
 * @owner AG-04
 * @reference frontend.env.local, data_schema.yaml global_configs (v1.2.3)
 */

import {
    getEnvVarWithDefault,
    getEnvNumberWithDefault,
    getEnvBooleanWithDefault,
    getEnvListWithDefault,
} from '@/utils/env_helpers';

export const SCAFFOLD_CONFIG = {
    /**
     * [CONTRACT] API Gateway — trỏ tới BackendModule (AG-03), Clause D.
     */
    API: {
        baseUrl: getEnvVarWithDefault('VITE_API_BASE_URL', 'http://localhost:8000'),
        // [CONTRACT] data_schema.yaml global_configs.default_timeout_ms
        timeoutMs: getEnvNumberWithDefault('VITE_API_TIMEOUT_MS', 10000),
        // SỬA (Blocking, phát hiện qua debug search-by-image thật):
        // TRƯỚC ĐÂY defaultHeaders = {'Content-Type': 'application/json'}
        // ép CỨNG cho MỌI request qua scaffoldAdapter, kể cả khi gửi
        // FormData (search-by-image, upload). Axios chỉ TỰ ĐỘNG set đúng
        // Content-Type theo kiểu dữ liệu (JSON → application/json,
        // FormData → multipart/form-data; boundary=...) KHI header đó
        // CHƯA bị set sẵn từ nơi khác — nếu đã có giá trị cứng, axios
        // không ghi đè, dẫn tới FormData bị gửi kèm sai Content-Type
        // "application/json". Backend nhận request không parse được
        // multipart, báo lỗi 422 "file field required" dù thực tế file
        // đã được đính kèm đúng. Đây là 1 dạng khác của bug Content-Type
        // đã từng gặp ở search_adapters.ts (Nhóm 3, đã sửa header tự set
        // thủ công thiếu boundary) — lần này nằm ở tầng THẤP HƠN
        // (axios.create() mặc định toàn cục), ảnh hưởng MỌI request
        // FormData trong hệ thống, không chỉ riêng search-by-image.
        // Xóa hẳn defaultHeaders — để axios tự quyết định đúng theo từng
        // request, không ép cứng ở tầng transport chung.
        defaultHeaders: {} as Record<string, string>,
    } as const,

    /**
     * [UI-ONLY] Health & Readiness Probe — openapi.yaml /health/readiness
     * định nghĩa path và response shape, KHÔNG định nghĩa tần suất caller
     * phải gọi lại. Tần suất là quyết định UX của Frontend.
     */
    HEALTH: {
        checkIntervalMs: getEnvNumberWithDefault('VITE_HEALTH_CHECK_INTERVAL_MS', 30000),
        livenessPath: '/health/liveness',
        readinessPath: '/health/readiness',
    } as const,

    /**
     * [CONTRACT] Retry Policy — data_schema.yaml global_configs.retry_policy.
     * Exponential backoff: backoff_ms × (factor ^ attempt_number).
     * CHỈ áp dụng cho lỗi HTTP request (408/429/5xx). KHÔNG dùng cho polling
     * chờ job bất đồng bộ (xem EVAL_CONFIG.POLL ở eval_configs.ts).
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
     * [CONTRACT] Idempotency — data_schema.yaml global_configs.idempotency_ttl_hours,
     * openapi.yaml components.parameters.IdempotencyKey.
     * Áp dụng cho mọi endpoint có tham số Idempotency-Key (vd POST /media/upload-url).
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
     * [CONTRACT] Presigned Upload — data_schema.yaml global_configs +
     * storage.presigned (2 nơi đồng bộ theo đúng hợp đồng gốc).
     * Dùng chung bởi cả workflow `media` (upload) và `search` (search-by-image),
     * vì openapi.yaml quy định /search/image dùng cùng multipart/form-data
     * với cùng ràng buộc content-type/size.
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
     * [CONTRACT] Vector Embedding — data_schema.yaml global_configs.vector_dim,
     * supported_dims. Tại v1.2.3, hệ thống CHỈ vận hành với 512 — giá trị 768
     * là dự phòng tương lai, KHÔNG được hiểu là hỗ trợ song song 2 chiều.
     * VITE_DEFAULT_VECTOR_DIM chỉ dùng để validate cục bộ trước khi có
     * response thật từ /health/readiness (header X-Expected-Vector-Dim) —
     * header runtime luôn là nguồn sự thật, giá trị env chỉ là khởi tạo.
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
     * [CONTRACT] Metric Type — openapi.yaml MetricType, thu hẹp v1.2.0 chỉ
     * còn COSINE (data_schema.yaml Clause B chỉ có 1 index HNSW dùng
     * vector_cosine_ops). Dùng chung bởi workflow `search`. Đặt tại scaffold
     * (không phải search_configs) vì đây là hằng số hệ thống bất biến, không
     * phải tham số riêng của UI search.
     */
    SEARCH_METRIC: getEnvVarWithDefault('VITE_SEARCH_METRIC', 'COSINE') as 'COSINE',

    /**
     * Error Code Mappings — khớp openapi.yaml Error.code (không phải enum
     * cứng ở hợp đồng, nhưng đây là tập giá trị đã thấy dùng thật xuyên suốt
     * dự án, kể cả ở BackendModule).
     */
    ERROR_CODES: {
        VECTOR_DIM_MISMATCH: 'ERR_VECTOR_DIM_MISMATCH',
        HEALTH_CHECK_FAILED: 'ERR_HEALTH_CHECK_FAILED',
        UNAUTHORIZED: 'ERR_UNAUTHORIZED',
        FORBIDDEN: 'ERR_FORBIDDEN',
        FORBIDDEN_ADMIN_ONLY: 'ERR_FORBIDDEN_ADMIN_ONLY',
        NOT_FOUND: 'ERR_NOT_FOUND',
        CONFLICT: 'ERR_CONFLICT',
        PAYLOAD_TOO_LARGE: 'ERR_PAYLOAD_TOO_LARGE',
        INTERNAL_SERVER_ERROR: 'ERR_INTERNAL_SERVER_ERROR',
    } as const,

    /**
     * HTTP Status Code Categories — hỗ trợ phân loại lỗi ở tầng adapters
     * dùng chung cho mọi workflow.
     */
    HTTP_STATUS: {
        RETRYABLE: [408, 429, 500, 502, 503, 504],
        CLIENT_ERROR: [400, 401, 403, 404, 409, 413],
        SERVER_ERROR: [500, 502, 503, 504],
    } as const,

    /**
     * [UI-ONLY] Logging & Debug Configuration.
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