/**
 * @file auth_adapters.ts
 * @layer adapters
 * @description Pure async adapter functions for auth API calls.
 *              Owns Axios configuration for auth endpoints.
 *              Normalizes backend errors to StandardError contract.
 *              Does NOT manage state or side effects.
 * @owner AG-04
 */

import axios, { AxiosError } from 'axios';
import { AUTH_CONFIG, AuthErrorCode } from '../configs/auth_configs';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    User,
    StandardError,
} from '../entities/auth_entities';

/**
 * Create an Axios instance for auth API calls.
 * Base URL comes from scaffold config (via VITE_API_BASE_URL).
 * Timeout comes from scaffold config (via VITE_API_TIMEOUT_MS).
 * 
 * Auth endpoints do NOT require JWT token by default (public endpoints).
 * Exception: GET /auth/me requires Bearer token.
 */
function createAuthClient() {
    // Import scaffold config dynamically to avoid circular dependency
    const scaffoldBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const scaffoldTimeout = parseInt(import.meta.env.VITE_API_TIMEOUT_MS || '10000', 10);

    return axios.create({
        baseURL: scaffoldBaseUrl,
        timeout: scaffoldTimeout,
    });
}

const authClient = createAuthClient();

/**
 * FIX D.1: Type guard to validate AuthResponse payload structure.
 * Ensures backend response contains all required fields with correct types.
 * Prevents contract drift between frontend and backend.
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
            message: 'Invalid response format from server.',
        } as StandardError;
    }

    const response = data as Record<string, unknown>;

    // Validate required fields
    if (typeof response.access_token !== 'string' || !response.access_token.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid access_token in response.',
        } as StandardError;
    }

    if (typeof response.token_type !== 'string' || !response.token_type.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid token_type in response.',
        } as StandardError;
    }

    if (typeof response.expires_in !== 'number' || response.expires_in <= 0) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid expires_in in response.',
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
        const backendError = error.response?.data as Partial<StandardError> | undefined;

        // ===== Network & Timeout Errors =====
        if (error.code === 'ECONNABORTED') {
            return {
                code: 'ERR_TIMEOUT',
                message: 'Request timed out. Please check your connection.',
            };
        }

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return {
                code: 'ERR_NETWORK',
                message: 'Network error. Please check your internet connection.',
            };
        }

        // ===== Backend Structured Error =====
        if (backendError && typeof backendError === 'object' && 'code' in backendError) {
            return {
                code: backendError.code || 'UNKNOWN_ERROR',
                message: backendError.message || 'An error occurred.',
                details: backendError.details,
            };
        }

        // ===== HTTP Status Code Mapping =====
        switch (statusCode) {
            case 400:
                return {
                    code: 'ERR_VALIDATION_FAILED',
                    message: 'Validation failed. Please check your input.',
                };
            case 401:
                return {
                    code: 'ERR_INVALID_CREDENTIALS',
                    message: 'Invalid email or password. Please try again.',
                };
            case 409:
                return {
                    code: 'ERR_USER_ALREADY_EXISTS',
                    message: 'This email is already registered. Try logging in instead.',
                };
            case 500:
                return {
                    code: 'ERR_SERVER_ERROR',
                    message: 'Server error. Please try again later.',
                };
            default:
                return {
                    code: 'UNKNOWN_ERROR',
                    message: 'An unexpected error occurred. Please try again.',
                };
        }
    }

    // ===== Non-Axios Error (e.g., parsing error) =====
    return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred.',
    };
}

/**
 * Login user with email/username and password.
 * Calls POST /auth/login (from AUTH_CONFIG.paths.login).
 * Does NOT include JWT token (public endpoint).
 *
 * @param payload - { username, password }
 * @returns AuthResponse containing JWT token, token_type, expires_in
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
 * Register a new user.
 * Calls POST /auth/register (from AUTH_CONFIG.paths.register).
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
 * Retrieve the authenticated user's profile.
 * Calls GET /auth/me (from AUTH_CONFIG.paths.getCurrentUser).
 * REQUIRES Bearer token in Authorization header.
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
 * Reads from AUTH_CONFIG.errorMessages (defined in auth_config.ts).
 * Provides i18n-ready fallback for unknown codes.
 *
 * @param errorCode - Backend error code (e.g., 'ERR_INVALID_CREDENTIALS')
 * @returns User-friendly error message
 */
export function mapErrorToMessage(errorCode: string): string {
    // Cast errorCode to AuthErrorCode instead of 'any'
    return AUTH_CONFIG.errorMessages[errorCode as AuthErrorCode] || AUTH_CONFIG.errorMessages.UNKNOWN_ERROR;
}