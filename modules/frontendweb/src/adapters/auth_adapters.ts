/**
 * @file auth_adapters.ts
 * @layer adapters
 * @description Pure async adapter functions for auth API calls.
 *              Owns Axios configuration for auth endpoints.
 *              Normalizes backend errors to StandardError contract.
 *              Does NOT manage state or side effects.
 * 
 * Công dụng: Tầng giao tiếp với backend
  - loginUser() - call API /login
  - registerUser() - call API /register
  - getCurrentUser() - lấy thông tin user hiện tại
  Nếu backend API thay đổi, sửa ở đây
 * @owner AG-04
 * @reference .context/openapi.yaml, DOS.md
 */

import axios, { AxiosError } from 'axios';
import { AUTH_CONFIG } from '../configs/auth_configs';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    User,
    StandardError,
} from '../entities/auth_entities';

/**
 * Create an Axios instance for auth API calls.
 * Base URL comes from VITE_API_BASE_URL environment variable.
 * Timeout comes from VITE_API_TIMEOUT_MS environment variable.
 * 
 * Auth endpoints do NOT require JWT token by default (public endpoints).
 * Exception: GET /auth/me requires Bearer token.
 */
function createAuthClient() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '10000', 10);

    return axios.create({
        baseURL: baseUrl,
        timeout: timeout,
    });
}

const authClient = createAuthClient();

/**
 * FIX D.1: Type guard to validate AuthResponse payload structure.
 * Ensures backend response contains all required fields with correct types.
 * Prevents contract drift between frontend and backend.
 * 
 * Response format from backend:
 * {
 *   "access_token": "eyJ...",
 *   "token_type": "bearer",
 *   "expires_in": 86400
 * }
 *
 * @param data - Unknown data from backend response
 * @returns Validated AuthResponse | throws StandardError
 * @throws StandardError with code 'ERR_INVALID_RESPONSE' if validation fails
 */
function validateAuthResponse(data: unknown): AuthResponse {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            detail: 'Invalid response format from server.',
        } as StandardError;
    }

    const response = data as Record<string, unknown>;

    // Validate access_token field
    if (typeof response.access_token !== 'string' || !response.access_token.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            detail: 'Missing or invalid access_token in response.',
        } as StandardError;
    }

    // Validate token_type field
    if (typeof response.token_type !== 'string' || !response.token_type.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            detail: 'Missing or invalid token_type in response.',
        } as StandardError;
    }

    // Validate expires_in field
    if (typeof response.expires_in !== 'number' || response.expires_in <= 0) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            detail: 'Missing or invalid expires_in in response.',
        } as StandardError;
    }

    return {
        access_token: response.access_token as string,
        token_type: response.token_type as string,
        expires_in: response.expires_in as number,
    };
}

/**
 * FIX D.2: Normalize backend error response to StandardError contract.
 * Backend (FastAPI + Pydantic) returns errors in format:
 * {
 *   "detail": "Error message string"
 * }
 * 
 * Or for structured errors:
 * {
 *   "code": "ERR_CODE",
 *   "detail": "Error message"
 * }
 * 
 * Differentiates between network errors, timeouts, and HTTP error responses.
 * Maps HTTP status codes to semantic error codes.
 * Implements fallback resilience for schema drift.
 *
 * @param error - Unknown error from axios
 * @returns StandardError normalized error object
 */
function parseBackendError(error: unknown): StandardError {
    if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const backendData = error.response?.data as Record<string, unknown> | undefined;

        // ===== Network & Timeout Errors =====
        if (error.code === 'ECONNABORTED') {
            return {
                code: 'ERR_TIMEOUT',
                detail: 'Request timed out. Please check your connection.',
            };
        }

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return {
                code: 'ERR_NETWORK',
                detail: 'Network error. Please check your internet connection.',
            };
        }

        // ===== Backend Structured Error (with code field) =====
        if (backendData && typeof backendData === 'object' && 'code' in backendData) {
            return {
                code: String(backendData.code) || 'UNKNOWN_ERROR',
                detail: String(backendData.detail || backendData.message || 'An error occurred.'),
            };
        }

        // ===== Backend Detail-only Error (Pydantic validation) =====
        if (backendData && typeof backendData.detail === 'string') {
            // Map common backend messages to error codes
            const detail = backendData.detail.toLowerCase();

            if (detail.includes('already exists') || detail.includes('duplicate')) {
                return {
                    code: 'ERR_USER_ALREADY_EXISTS',
                    detail: backendData.detail as string,
                };
            }

            if (detail.includes('invalid') && detail.includes('password')) {
                return {
                    code: 'ERR_INVALID_CREDENTIALS',
                    detail: backendData.detail as string,
                };
            }

            if (detail.includes('validation')) {
                return {
                    code: 'ERR_VALIDATION_FAILED',
                    detail: backendData.detail as string,
                };
            }

            // Generic detail message
            return {
                code: 'ERR_SERVER_ERROR',
                detail: backendData.detail as string,
            };
        }

        // ===== HTTP Status Code Mapping (fallback) =====
        switch (statusCode) {
            case 400:
                return {
                    code: 'ERR_VALIDATION_FAILED',
                    detail: 'Validation failed. Please check your input.',
                };
            case 401:
                return {
                    code: 'ERR_INVALID_CREDENTIALS',
                    detail: 'Invalid username or password. Please try again.',
                };
            case 409:
                return {
                    code: 'ERR_USER_ALREADY_EXISTS',
                    detail: 'This username or email is already registered.',
                };
            case 500:
                return {
                    code: 'ERR_SERVER_ERROR',
                    detail: 'Server error. Please try again later.',
                };
            default:
                return {
                    code: 'UNKNOWN_ERROR',
                    detail: 'An unexpected error occurred. Please try again.',
                };
        }
    }

    // ===== Non-Axios Error (e.g., parsing error, validation error) =====
    return {
        code: 'UNKNOWN_ERROR',
        detail: (error as Error)?.message || 'An unexpected error occurred.',
    };
}

/**
 * LOGIN: POST /auth/login
 * 
 * Request: { username, password }
 * Response: { access_token, token_type, expires_in }
 * 
 * Does NOT include JWT token (public endpoint).
 *
 * @param payload - { username, password }
 * @returns AuthResponse containing JWT token
 * @throws StandardError structured error object
 */
export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
    try {
        const response = await authClient.post<unknown>(
            AUTH_CONFIG.paths.login,
            payload
        );

        // Validate response structure
        return validateAuthResponse(response.data);
    } catch (error) {
        const standardError = parseBackendError(error);
        throw standardError;
    }
}

/**
 * REGISTER: POST /auth/register
 * 
 * Request: { username, email, password }
 * Response: { access_token, token_type, expires_in } (auto-login)
 * 
 * Does NOT include JWT token (public endpoint).
 * Response includes AuthResponse (instant activation, no email confirmation needed).
 *
 * @param payload - { username, email, password }
 * @returns AuthResponse containing JWT token (auto-login on success)
 * @throws StandardError structured error object
 */
export async function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
    try {
        const response = await authClient.post<unknown>(
            AUTH_CONFIG.paths.register,
            payload
        );

        // Validate response structure
        return validateAuthResponse(response.data);
    } catch (error) {
        const standardError = parseBackendError(error);
        throw standardError;
    }
}

/**
 * GET PROFILE: GET /auth/me
 * 
 * Request header: Authorization: Bearer <token>
 * Response: { id, username, email, created_at }
 * 
 * REQUIRES Bearer token in Authorization header.
 * Fails with 401 if token invalid or expired.
 *
 * @param token - JWT access token
 * @returns User profile object
 * @throws StandardError structured error object (401 if token invalid/expired)
 */
export async function getCurrentUser(token: string): Promise<User> {
    try {
        const response = await authClient.get<User>(
            AUTH_CONFIG.paths.getCurrentUser,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    } catch (error) {
        const standardError = parseBackendError(error);
        throw standardError;
    }
}

/**
 * FIX D.3: Map backend error code to user-friendly message.
 * Reads from AUTH_CONFIG.errorMessages (defined in auth_configs.ts).
 * Provides i18n-ready fallback for unknown codes.
 *
 * @param errorCode - Backend error code (e.g., 'ERR_INVALID_CREDENTIALS')
 * @returns User-friendly error message from config
 */
export function mapErrorToMessage(errorCode: string): string {
    return (
        AUTH_CONFIG.errorMessages[errorCode as keyof typeof AUTH_CONFIG.errorMessages] ||
        AUTH_CONFIG.errorMessages.UNKNOWN_ERROR
    );
}