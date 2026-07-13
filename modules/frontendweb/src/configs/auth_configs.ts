/**
 * @file auth_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow auth: storage key, session event,
 *              API path, quy tắc validate form.
 * @owner AG-04
 * @reference frontend.env.local, openapi.yaml AuthRequest/AuthResponse/User
 */

import {
    getEnvVarWithDefault,
    getEnvNumberWithDefault,
} from '@/utils/env_helpers';

export const AUTH_CONFIG = {
    /**
     * [UI-ONLY] Storage key localStorage — quy ước riêng Frontend, không có
     * trong hợp đồng.
     */
    storage: {
        tokenKey: getEnvVarWithDefault('VITE_AUTH_STORAGE_TOKEN_KEY', 'sise_auth_token'),
        userKey: getEnvVarWithDefault('VITE_AUTH_STORAGE_USER_KEY', 'sise_user_profile'),
    } as const,

    /**
     * [UI-ONLY] Tên CustomEvent cross-tab sync — quy ước riêng Frontend.
     * CHỈ 1 bộ tên duy nhất (namespace "sise:*"). Không tạo biến trùng lặp
     * không namespace (đã xác nhận dư thừa khi audit scaffold — xem
     * Workflow_Centric_Architecture.md §2.4.3 AP-9).
     */
    events: {
        sessionStarted: getEnvVarWithDefault('VITE_AUTH_SESSION_STARTED_EVENT', 'sise:sessionStarted'),
        sessionExpired: getEnvVarWithDefault('VITE_AUTH_SESSION_EXPIRED_EVENT', 'sise:sessionExpired'),
        sessionEnded: getEnvVarWithDefault('VITE_AUTH_SESSION_ENDED_EVENT', 'sise:sessionEnded'),
    } as const,

    getStoredToken: (): string | null => {
        const token = localStorage.getItem(AUTH_CONFIG.storage.tokenKey);
        if (!token || token === 'undefined' || token === 'null' || !token.trim()) {
            return null;
        }
        return token;
    },

    clearStoredAuth: (): void => {
        localStorage.removeItem(AUTH_CONFIG.storage.tokenKey);
        localStorage.removeItem(AUTH_CONFIG.storage.userKey);
    },

    /**
     * [CONTRACT] API Endpoints — openapi.yaml paths thật.
     * LƯU Ý: POST /auth/register trả về schema `User` (KHÔNG phải
     * `AuthResponse`) kể từ v1.2.0 — xem auth_entities.ts và auth_adapters.ts
     * để biết cách xử lý đúng (không auto-login từ response register).
     */
    paths: {
        login: '/auth/login',
        register: '/auth/register',
        getCurrentUser: '/auth/me',
    } as const,

    /**
     * [UI-ONLY] Quy tắc validate phía client — mirror giá trị Backend thật
     * đã audit ở BackendModule (Pydantic), nhưng bản thân openapi.yaml
     * KHÔNG công bố giới hạn min/max trong schema. Nếu Backend đổi giới
     * hạn, phải cập nhật tay ở đây.
     */
    validation: {
        email: {
            pattern: new RegExp(
                getEnvVarWithDefault(
                    'VITE_AUTH_EMAIL_PATTERN',
                    '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
                )
            ),
            message: 'Please enter a valid email address.',
        },
        username: {
            minLength: getEnvNumberWithDefault('VITE_AUTH_USERNAME_MIN_LENGTH', 3),
            maxLength: getEnvNumberWithDefault('VITE_AUTH_USERNAME_MAX_LENGTH', 50),
            pattern: /^[a-zA-Z0-9_-]+$/,
            message: 'Username must be 3-50 characters, alphanumeric and underscores/hyphens only.',
        },
        password: {
            minLength: getEnvNumberWithDefault('VITE_AUTH_PASSWORD_MIN_LENGTH', 8),
            maxLength: getEnvNumberWithDefault('VITE_AUTH_PASSWORD_MAX_LENGTH', 128),
            message: 'Password must be at least 8 characters.',
        },
    } as const,

    /**
     * [UI-ONLY] Error message hiển thị cho người dùng — mapping từ
     * StandardError.code do auth_adapters.ts chuẩn hóa.
     */
    errorMessages: {
        ERR_INVALID_CREDENTIALS: 'Invalid username or password. Please try again.',
        ERR_USER_ALREADY_EXISTS: 'This username or email is already registered. Try logging in instead.',
        ERR_VALIDATION_FAILED: 'Please check your input and try again.',
        ERR_TIMEOUT: 'Request timed out. Please check your connection and try again.',
        ERR_NETWORK: 'Network error. Please check your internet connection.',
        ERR_INVALID_RESPONSE: 'Server returned an unexpected response. Please try again.',
        ERR_SERVER_ERROR: 'Server error. Please try again later.',
        UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
    } as const,
} as const;

export type AuthConfig = typeof AUTH_CONFIG;
export type AuthErrorCode = keyof typeof AUTH_CONFIG.errorMessages;