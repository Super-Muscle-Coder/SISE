/**
 * @file env_helpers.ts
 * @description Utilities for safely reading and parsing Vite environment variables.
 * @owner AG-04 (Frontend Web)
 * @reference frontendweb.env.local (environment variables source)
 * 
 * Vite exposes environment variables via `import.meta.env` object.
 * All variables must have VITE_ prefix (enforced by Vite).
 * 
 * EXAMPLE:
 *   VITE_API_BASE_URL=http://localhost:8000
 *   → import.meta.env.VITE_API_BASE_URL = 'http://localhost:8000'
 */

/**
 * Safely retrieve a string environment variable.
 * Returns the value as-is if it exists, null otherwise.
 */
export function getEnvVar(key: string): string | null {
    const value = import.meta.env[key as keyof ImportMetaEnv];
    if (value === undefined || value === '') {
        return null;
    }
    return String(value);
}

/**
 * Safely retrieve a string environment variable with a fallback default value.
 */
export function getEnvVarWithDefault(key: string, defaultValue: string): string {
    return getEnvVar(key) ?? defaultValue;
}

/**
 * Safely retrieve a numeric environment variable.
 */
export function getEnvNumber(key: string): number | null {
    const value = getEnvVar(key);
    if (value === null) {
        return null;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        console.warn(
            `[env_helpers] Failed to parse '${key}' as number: '${value}'. Returning null.`
        );
        return null;
    }
    return parsed;
}

/**
 * Safely retrieve a numeric environment variable with a fallback default value.
 */
export function getEnvNumberWithDefault(key: string, defaultValue: number): number {
    return getEnvNumber(key) ?? defaultValue;
}

/**
 * Safely retrieve a float/decimal environment variable.
 */
export function getEnvFloat(key: string): number | null {
    const value = getEnvVar(key);
    if (value === null) {
        return null;
    }
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
        console.warn(
            `[env_helpers] Failed to parse '${key}' as float: '${value}'. Returning null.`
        );
        return null;
    }
    return parsed;
}

/**
 * Safely retrieve a float environment variable with a fallback default value.
 */
export function getEnvFloatWithDefault(key: string, defaultValue: number): number {
    return getEnvFloat(key) ?? defaultValue;
}

/**
 * Safely retrieve a boolean environment variable.
 * Accepts: 'true', '1', 'yes', 'on' → true
 * Accepts: 'false', '0', 'no', 'off' → false
 */
export function getEnvBoolean(key: string): boolean | null {
    const value = getEnvVar(key);
    if (value === null) {
        return null;
    }
    const lowerValue = value.toLowerCase().trim();
    if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
        return true;
    }
    if (['false', '0', 'no', 'off'].includes(lowerValue)) {
        return false;
    }
    console.warn(
        `[env_helpers] Invalid boolean value for '${key}': '${value}'. Returning null.`
    );
    return null;
}

/**
 * Safely retrieve a boolean environment variable with a fallback default value.
 */
export function getEnvBooleanWithDefault(key: string, defaultValue: boolean): boolean {
    return getEnvBoolean(key) ?? defaultValue;
}

/**
 * Safely retrieve a comma-separated list environment variable.
 * Parses as comma-delimited list, trims whitespace from each item.
 */
export function getEnvList(key: string): string[] {
    const value = getEnvVar(key);
    if (value === null) {
        return [];
    }
    return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

/**
 * Safely retrieve a comma-separated list with a fallback default list.
 */
export function getEnvListWithDefault(key: string, defaultList: string[]): string[] {
    const list = getEnvList(key);
    return list.length > 0 ? list : defaultList;
}

/**
 * Assert that a required environment variable exists and is not empty.
 * Throws an error if the variable is missing.
 */
export function assertEnvVar(key: string): void {
    const value = getEnvVar(key);
    if (value === null) {
        throw new Error(
            `[env_helpers] Required environment variable '${key}' is not defined. ` +
            `Please add it to frontendweb.env.local and ensure Vite has reloaded.`
        );
    }
}

/**
 * Assert that a required numeric environment variable exists and can be parsed.
 */
export function assertEnvNumber(key: string): void {
    assertEnvVar(key);
    const value = getEnvNumber(key);
    if (value === null) {
        throw new Error(
            `[env_helpers] Environment variable '${key}' must be a valid number. ` +
            `Received: '${getEnvVar(key)}'`
        );
    }
}

/**
 * Validate environment variable format using a RegExp pattern.
 */
export function validateEnvFormat(
    key: string,
    pattern: RegExp,
    errorMessage?: string
): boolean {
    const value = getEnvVar(key);
    if (value === null) {
        return false;
    }
    if (!pattern.test(value)) {
        throw new Error(
            errorMessage ||
            `[env_helpers] Environment variable '${key}' does not match expected format. ` +
            `Received: '${value}'`
        );
    }
    return true;
}

/**
 * Log all currently loaded environment variables (for debugging).
 * Only logs variables starting with 'VITE_' prefix.
 * DO NOT use in production – may leak sensitive information!
 */
export function logEnvVars(filter?: string): void {
    if (import.meta.env.PROD) {
        console.warn('[env_helpers] logEnvVars() called in production. Skipping for security.');
        return;
    }

    const envObj = import.meta.env as Record<string, unknown>;
    const filtered = Object.entries(envObj)
        .filter(([key]) => key.startsWith('VITE_'))
        .filter(([key]) => !filter || key.includes(filter));

    console.group(`[env_helpers] Environment Variables${filter ? ` (filtered: ${filter})` : ''}`);
    filtered.forEach(([key, value]) => {
        const isSensitive = key.includes('TOKEN') || key.includes('SECRET') || key.includes('PASSWORD');
        const displayValue = isSensitive ? '***' : value;
        console.log(`  ${key} = ${displayValue}`);
    });
    console.groupEnd();
}

// ============================================================================
// TYPE DEFINITIONS FOR IMPORTMETAENV
// ============================================================================

declare global {
    interface ImportMetaEnv {
        // ====================================================================
        // [CONTRACT] API GATEWAY — Clause D (BackendModule)
        // ====================================================================
        readonly VITE_API_BASE_URL: string;
        readonly VITE_API_TIMEOUT_MS: string;

        // ====================================================================
        // [UI-ONLY] HEALTH & READINESS PROBE
        // ====================================================================
        readonly VITE_HEALTH_CHECK_INTERVAL_MS: string;

        // ====================================================================
        // [CONTRACT] RETRY POLICY — data_schema.yaml global_configs.retry_policy
        // (chỉ áp dụng lỗi HTTP 408/429/5xx, KHÔNG dùng cho polling job)
        // ====================================================================
        readonly VITE_RETRY_MAX_ATTEMPTS: string;
        readonly VITE_RETRY_BACKOFF_MS: string;
        readonly VITE_RETRY_BACKOFF_FACTOR: string;

        // ====================================================================
        // [CONTRACT] IDEMPOTENCY — data_schema.yaml global_configs.idempotency_ttl_hours
        // ====================================================================
        readonly VITE_IDEMPOTENCY_TTL_HOURS: string;

        // ====================================================================
        // [CONTRACT] PRESIGNED UPLOAD — data_schema.yaml global_configs / storage.presigned
        // ====================================================================
        readonly VITE_PRESIGNED_URL_EXPIRY_SEC: string;
        readonly VITE_MAX_FILE_SIZE_MB: string;
        readonly VITE_ALLOWED_CONTENT_TYPES: string;

        // ====================================================================
        // [CONTRACT] VECTOR EMBEDDING — data_schema.yaml global_configs.vector_dim
        // ====================================================================
        readonly VITE_DEFAULT_VECTOR_DIM: string;
        readonly VITE_SUPPORTED_VECTOR_DIMS: string;

        // ====================================================================
        // [CONTRACT] METRIC TYPE — openapi.yaml MetricType (thu hẹp v1.2.0, chỉ COSINE)
        // ====================================================================
        readonly VITE_SEARCH_METRIC: string;

        // ====================================================================
        // AUTH WORKFLOW (T004-02)
        // ====================================================================
        readonly VITE_AUTH_STORAGE_TOKEN_KEY: string;
        readonly VITE_AUTH_STORAGE_USER_KEY: string;
        readonly VITE_AUTH_SESSION_STARTED_EVENT: string;
        readonly VITE_AUTH_SESSION_EXPIRED_EVENT: string;
        readonly VITE_AUTH_SESSION_ENDED_EVENT: string;
        readonly VITE_AUTH_EMAIL_PATTERN: string;
        readonly VITE_AUTH_USERNAME_MIN_LENGTH: string;
        readonly VITE_AUTH_USERNAME_MAX_LENGTH: string;
        readonly VITE_AUTH_PASSWORD_MIN_LENGTH: string;
        readonly VITE_AUTH_PASSWORD_MAX_LENGTH: string;

        // ====================================================================
        // MEDIA WORKFLOW (T004-03) — openapi.yaml /albums, /media/*
        // ====================================================================
        readonly VITE_MEDIA_LIST_DEFAULT_LIMIT: string;
        readonly VITE_MEDIA_LIST_DEFAULT_OFFSET: string;
        readonly VITE_MEDIA_INDEX_STATUS_POLL_INTERVAL_MS: string;
        readonly VITE_MEDIA_MAX_POLL_RETRIES: string;
        readonly VITE_MEDIA_BULK_MAX_CONCURRENT_UPLOADS: string;
        readonly VITE_MEDIA_BULK_MAX_RETRIES: string;
        readonly VITE_MEDIA_BULK_MAX_FILES_PER_BATCH: string;

        // ====================================================================
        // SEARCH WORKFLOW (T004-05) — openapi.yaml /search/image, /search/text
        // ====================================================================
        readonly VITE_SEARCH_DEBOUNCE_MS: string;
        readonly VITE_SEARCH_DEFAULT_TOP_K: string;
        readonly VITE_SEARCH_SCORE_THRESHOLD_HIGH: string;
        readonly VITE_SEARCH_SCORE_THRESHOLD_MEDIUM: string;
        readonly VITE_SEARCH_REQUEST_TIMEOUT_MS: string;
        readonly VITE_SEARCH_MAX_IMAGE_SIZE_MB: string;

        // ====================================================================
        // EVALUATION WORKFLOW (T003-07, admin only) — openapi.yaml /eval/*
        // ====================================================================
        readonly VITE_EVAL_RUN_DEFAULT_LIMIT: string;
        readonly VITE_EVAL_RUN_TIMEOUT_MS: string;
        readonly VITE_EVAL_POLL_INTERVAL_MS: string;
        readonly VITE_EVAL_POLL_MAX_DURATION_MS: string;
        readonly VITE_EVAL_RUN_BUTTON_LABEL: string;
        readonly VITE_EVAL_RESET_BUTTON_LABEL: string;

        // ====================================================================
        // ADMIN — openapi.yaml POST /admin/reindex
        // ====================================================================
        readonly VITE_ADMIN_REINDEX_DEFAULT_BATCH_SIZE: string;

        // ====================================================================
        // LOGGING & DEBUG
        // ====================================================================
        readonly VITE_LOG_LEVEL: string;
        readonly VITE_ENABLE_REQUEST_LOGGING: string;
    }
}

export { };