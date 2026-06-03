/**
 * @file auth_adapters.ts
 * @layer adapters
 * @description Pure async adapter functions for auth API calls.
 *              Owns Axios configuration for auth endpoints and error mapping.
 *              Does NOT manage state or side effects.
 * @owner AG-04
 */

import axios, { AxiosError } from 'axios';
import { scaffoldConfig } from '@/configs/scaffold_env';
import { AUTH_CONFIG, AuthErrorCode } from '@/configs/auth_config';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    User,
    StandardError,
} from '@/entities/auth_entities';

/**
 * Create an Axios instance for auth API calls.
 * Uses the gateway base URL from scaffold config.
 * Auth endpoints do NOT require JWT token (no interceptor needed).
 */
const authClient = axios.create({
    baseURL: scaffoldConfig.API_BASE_URL,
    timeout: scaffoldConfig.API_TIMEOUT_MS,
});

/**
 * Normalize backend error response to StandardError contract.
 */
function parseBackendError(error: unknown): StandardError {
    if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const backendError = error.response?.data as Partial<StandardError> | undefined;

        // If backend returns a structured error, use it
        if (backendError && typeof backendError === 'object' && 'code' in backendError) {
            return {
                code: backendError.code || 'UNKNOWN_ERROR',
                message: backendError.message || 'An error occurred.',
                details: backendError.details,
            };
        }

        // Map HTTP status codes to error codes
        switch (statusCode) {
            case 401:
                return {
                    code: 'ERR_INVALID_CREDENTIALS',
                    message: 'Invalid credentials.',
                };
            case 400:
                return {
                    code: 'ERR_VALIDATION_FAILED',
                    message: error.response?.data?.message || 'Validation failed.',
                };
            case 409:
                return {
                    code: 'ERR_USER_ALREADY_EXISTS',
                    message: 'User already exists.',
                };
            case 500:
                return {
                    code: 'ERR_SERVER_ERROR',
                    message: 'Server error.',
                };
            default:
                return {
                    code: 'ERR_NETWORK',
                    message: error.message || 'Network error.',
                };
        }
    }

    return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred.',
    };
}

/**
 * Login user with email and password.
 * @param payload - { username, password }
 * @returns AuthResponse containing JWT token
 * @throws StandardError structured error
 */
export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
    try {
        const response = await authClient.post<AuthResponse>(
            AUTH_CONFIG.paths.login,
            payload
        );
        return response.data;
    } catch (error) {
        const standardError = parseBackendError(error);
        throw standardError;
    }
}

/**
 * Register a new user.
 * @param payload - { username, email, password }
 * @returns AuthResponse containing JWT token (instant activation)
 * @throws StandardError structured error
 */
export async function registerUser(payload: RegisterRequest): Promise<AuthResponse> {
    try {
        const response = await authClient.post<AuthResponse>(
            AUTH_CONFIG.paths.register,
            payload
        );
        return response.data;
    } catch (error) {
        const standardError = parseBackendError(error);
        throw standardError;
    }
}

/**
 * Retrieve the authenticated user's profile.
 * Requires a valid Bearer token in the Authorization header.
 * @param token - JWT access token
 * @returns User profile
 * @throws StandardError structured error
 */
export async function getCurrentUser(token: string): Promise<User> {
    try {
        const response = await authClient.get<User>(AUTH_CONFIG.paths.getCurrentUser, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        const standardError = parseBackendError(error);
        throw standardError;
    }
}

/**
 * Map backend error code to user-friendly message.
 * @param errorCode - Backend error code (e.g., 'ERR_INVALID_CREDENTIALS')
 * @returns User-friendly error message
 */
export function mapErrorToMessage(errorCode: string): string {
    const message = AUTH_CONFIG.errorMessages[errorCode as AuthErrorCode];
    return message || AUTH_CONFIG.errorMessages.UNKNOWN_ERROR;
}