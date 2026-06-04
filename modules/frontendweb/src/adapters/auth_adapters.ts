/**
 * @file auth_adapters.ts
 * @layer adapters
 * @description Pure async adapter functions for auth API calls.
 *              Owns Axios configuration for auth endpoints and error mapping.
 *              FIX 1.1: Added validateAuthResponse() type guard.
 *              Does NOT manage state or side effects.
 * @owner AG-04
 */

import axios, { AxiosError } from 'axios';
import { scaffoldConfig } from '../configs/scaffold_env';
import { AUTH_CONFIG, AuthErrorCode } from '../configs/auth_config';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  StandardError,
} from '../entities/auth_entities';

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
 * FIX 1.1: Type guard to validate AuthResponse payload structure.
 * Ensures backend response contains all required fields in correct types.
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

  // Check presence and type of required fields
  if (typeof response.access_token !== 'string' || !response.access_token.trim()) {
    throw {
      code: 'ERR_INVALID_RESPONSE',
      message: 'Missing or invalid access token in response.',
    } as StandardError;
  }

  if (typeof response.token_type !== 'string' || !response.token_type.trim()) {
    throw {
      code: 'ERR_INVALID_RESPONSE',
      message: 'Missing or invalid token type in response.',
    } as StandardError;
  }

  if (typeof response.expires_in !== 'number' || response.expires_in <= 0) {
    throw {
      code: 'ERR_INVALID_RESPONSE',
      message: 'Missing or invalid token expiry in response.',
    } as StandardError;
  }

  // Return validated response
  return {
    access_token: response.access_token as string,
    token_type: response.token_type as string,
    expires_in: response.expires_in as number,
  };
}

/**
 * Normalize backend error response to StandardError contract.
 * Enhanced with timeout & network error differentiation (Tier 2 Fix 2.1).
 */
function parseBackendError(error: unknown): StandardError {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const backendError = error.response?.data as Partial<StandardError> | undefined;

    // FIX 2.1: Differentiate timeout from network errors
    if (error.code === 'ECONNABORTED') {
      return {
        code: 'ERR_TIMEOUT',
        message: 'Request timed out. Please try again.',
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        code: 'ERR_NETWORK',
        message: 'Network error. Check your connection.',
      };
    }

    // If backend returns a structured error, use it
    if (backendError && typeof backendError === 'object' && 'code' in backendError) {
      return {
        code: backendError.code || 'UNKNOWN_ERROR',
        message: backendError.message || 'An error occurred.',
        details: backendError.details,
      };
    }

    // FIX 2.2: Contract drift resilience - deep merge fallback
    const code =
      (backendError as any)?.code ??
      (backendError as any)?.error?.code ??
      'UNKNOWN_ERROR';
    const message =
      (backendError as any)?.message ??
      (backendError as any)?.error?.message ??
      (backendError as any)?.error?.details?.reason ??
      'An error occurred.';

    // Map HTTP status codes to error codes
    switch (statusCode) {
      case 401:
        return {
          code: 'ERR_INVALID_CREDENTIALS',
          message: 'Invalid email or password. Please try again.',
        };
      case 400:
        return {
          code: 'ERR_VALIDATION_FAILED',
          message: message || 'Validation failed.',
        };
      case 409:
        return {
          code: 'ERR_USER_ALREADY_EXISTS',
          message: 'This email is already registered. Try logging in.',
        };
      case 500:
        return {
          code: 'ERR_SERVER_ERROR',
          message: 'Server error. Please try again later.',
        };
      default:
        return {
          code,
          message,
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
    const response = await authClient.post<unknown>(
      AUTH_CONFIG.paths.login,
      payload
    );
    // FIX 1.1: Validate response before returning
    return validateAuthResponse(response.data);
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
    const response = await authClient.post<unknown>(
      AUTH_CONFIG.paths.register,
      payload
    );
    // FIX 1.1: Validate response before returning
    return validateAuthResponse(response.data);
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
