/**
 * @file auth_configs.ts
 * @layer configs
 * @description Auth workflow configuration - env-to-config boundary.
 *              All values from environment variables (via env_helpers).
 * @owner AG-04
 * @reference data_schema.yaml, openapi.yaml
 */

import {
    getEnvVarWithDefault,
    getEnvNumberWithDefault,
} from '@/utils/env_helpers';

// ============================================================================
// AUTH CONFIGURATION (ENV-DRIVEN)
// ============================================================================

export const AUTH_CONFIG = {
    // ========================================================================
    // STORAGE (localStorage keys)
    // ========================================================================
    storage: {
        tokenKey: getEnvVarWithDefault('VITE_AUTH_STORAGE_TOKEN_KEY', 'sise_auth_token'),
        userKey: getEnvVarWithDefault('VITE_AUTH_STORAGE_USER_KEY', 'sise_user_profile'),
    } as const,

    // ========================================================================
    // EVENTS (custom events for cross-tab sync)
    // ========================================================================
    events: {
        sessionStarted: getEnvVarWithDefault('VITE_AUTH_SESSION_STARTED_EVENT', 'sise:sessionStarted'),
        sessionExpired: getEnvVarWithDefault('VITE_AUTH_SESSION_EXPIRED_EVENT', 'sise:sessionExpired'),
        sessionEnded: getEnvVarWithDefault('VITE_AUTH_SESSION_ENDED_EVENT', 'sise:sessionEnded'),
    } as const,

    // ========================================================================
    // API ENDPOINTS
    // ========================================================================
    paths: {
        login: '/auth/login',
        register: '/auth/register',
        getCurrentUser: '/auth/me',
    } as const,

    // ========================================================================
    // FORM VALIDATION RULES
    // ========================================================================
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

    // ========================================================================
    // ERROR MESSAGES
    // ========================================================================
    errorMessages: {
        ERR_INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
        ERR_USER_ALREADY_EXISTS: 'This email is already registered. Try logging in instead.',
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