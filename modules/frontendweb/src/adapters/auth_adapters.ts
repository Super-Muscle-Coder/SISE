/**
 * @file auth_adapters.ts
 * @layer adapters
 * @description Pure async adapter functions for auth API calls.
 *              Uses global scaffoldAdapter for all auth endpoints.
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

import { AUTH_CONFIG } from '../configs/auth_configs';
import { scaffoldAdapter } from './scaffold_adapters';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    User,
    StandardError,
} from '../entities/auth_entities';

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
            message: 'Invalid response format from server.',
        } as StandardError;
    }

    const response = data as Record<string, unknown>;

    // Validate access_token field
    if (typeof response.access_token !== 'string' || !response.access_token.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid access_token in response.',
        } as StandardError;
    }

    // Validate token_type field
    if (typeof response.token_type !== 'string' || !response.token_type.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid token_type in response.',
        } as StandardError;
    }

    // Validate expires_in field
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
 * Validate User response payload structure from POST /auth/register and GET /auth/me.
 * Required fields: id, username, email, created_at, role.
 * Dùng chung cho CẢ HAI endpoint (register 201 và /auth/me 200) vì cả hai
 * trả cùng 1 schema User theo openapi.yaml.
 *
 * @param data - Unknown data from backend response
 * @returns Validated User | throws StandardError
 * @throws StandardError with code 'ERR_INVALID_RESPONSE' if validation fails
 */
function validateUserResponse(data: unknown): User {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Invalid response format from server.',
        } as StandardError;
    }

    const response = data as Record<string, unknown>;

    // Validate id field
    if (typeof response.id !== 'number' || Number.isNaN(response.id)) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid id in response.',
        } as StandardError;
    }

    // Validate username field
    if (typeof response.username !== 'string' || !response.username.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid username in response.',
        } as StandardError;
    }

    // Validate email field
    if (typeof response.email !== 'string' || !response.email.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid email in response.',
        } as StandardError;
    }

    // Validate created_at field
    if (typeof response.created_at !== 'string' || !response.created_at.trim()) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid created_at in response.',
        } as StandardError;
    }

    // Validate role field
    if (
        typeof response.role !== 'string' ||
        (response.role !== 'user' && response.role !== 'admin')
    ) {
        throw {
            code: 'ERR_INVALID_RESPONSE',
            message: 'Missing or invalid role in response.',
        } as StandardError;
    }

    return {
        id: response.id as number,
        username: response.username as string,
        email: response.email as string,
        created_at: response.created_at as string,
        role: response.role as 'user' | 'admin',
    };
}

type AxiosLikeError = {
    code?: string;
    response?: {
        status?: number;
        data?: unknown;
    };
};

function isAxiosLikeError(error: unknown): error is AxiosLikeError {
    return (
        typeof error === 'object' &&
        error !== null &&
        ('response' in error || 'code' in error)
    );
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
 * @param error - Unknown error from adapter
 * @returns StandardError normalized error object
 */
function parseBackendError(error: unknown): StandardError {
    if (isAxiosLikeError(error)) {
        const statusCode = error.response?.status;
        const backendData = error.response?.data as Record<string, unknown> | undefined;

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

        // ===== Backend Structured Error (with code field) =====
        if (backendData && typeof backendData === 'object' && 'code' in backendData) {
            return {
                code: String(backendData.code) || 'UNKNOWN_ERROR',
                message: String(backendData.detail || backendData.message || 'An error occurred.'),
            };
        }

        // ===== Backend Detail-only Error (Pydantic validation) =====
        if (backendData && typeof backendData.detail === 'string') {
            // Map common backend messages to error codes
            const detail = backendData.detail.toLowerCase();

            if (detail.includes('already exists') || detail.includes('duplicate')) {
                return {
                    code: 'ERR_USER_ALREADY_EXISTS',
                    message: backendData.detail as string,
                };
            }

            if (detail.includes('invalid') && detail.includes('password')) {
                return {
                    code: 'ERR_INVALID_CREDENTIALS',
                    message: backendData.detail as string,
                };
            }

            if (detail.includes('validation')) {
                return {
                    code: 'ERR_VALIDATION_FAILED',
                    message: backendData.detail as string,
                };
            }

            // Generic detail message
            return {
                code: 'ERR_SERVER_ERROR',
                message: backendData.detail as string,
            };
        }

        // ===== HTTP Status Code Mapping (fallback) =====
        switch (statusCode) {
            case 400:
                return {
                    code: 'ERR_VALIDATION_FAILED',
                    message: 'Validation failed. Please check your input.',
                };
            case 401:
                return {
                    code: 'ERR_INVALID_CREDENTIALS',
                    message: 'Invalid username or password. Please try again.',
                };
            // LƯU Ý: nhánh này hiếm khi chạy tới vì scaffoldAdapter interceptor đã chuẩn hóa lỗi 409 thành ERR_CONFLICT trước đó — cần rà soát thống nhất khi audit workflow tiếp theo dùng chung pattern lỗi 409.
            case 409:
                return {
                    code: 'ERR_USER_ALREADY_EXISTS',
                    message: 'This username or email is already registered.',
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

    // ===== Non-Axios Error (e.g., parsing error, validation error) =====
    return {
        code: 'UNKNOWN_ERROR',
        message: (error as Error)?.message || 'An unexpected error occurred.',
    };
}

/**
 * LOGIN: POST /auth/login
 * 
 * Request: { username, password }
 * Response: { access_token, token_type, expires_in }
 * 
 * Uses scaffoldAdapter (global interceptors/retry/idempotency stack).
 *
 * @param payload - { username, password }
 * @returns AuthResponse containing JWT token
 * @throws StandardError structured error object
 */
export async function loginUser(payload: LoginRequest): Promise<AuthResponse> {
    try {
        const response = await scaffoldAdapter.post<unknown>(
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
 * Response: User object (id, username, email, created_at, role).
 * KHÔNG chứa token — Frontend phải tự gọi loginUser() sau khi
 * register thành công để lấy token (xem auth_services.ts useRegister).
 * 
 * Uses scaffoldAdapter (global interceptors/retry/idempotency stack).
 *
 * @param payload - { username, email, password }
 * @returns User object
 * @throws StandardError structured error object
 */
export async function registerUser(payload: RegisterRequest): Promise<User> {
    try {
        const response = await scaffoldAdapter.post<unknown>(
            AUTH_CONFIG.paths.register,
            payload
        );

        // Validate response structure
        return validateUserResponse(response.data);
    } catch (error) {
        const standardError = parseBackendError(error);
        throw standardError;
    }
}

/**
 * GET PROFILE: GET /auth/me
 * 
 * Authorization header is injected automatically by scaffoldAdapter interceptor
 * — KHÔNG cần truyền token thủ công (đã xóa tham số token khỏi chữ ký hàm,
 * trước đây là tham số chết không được dùng bên trong thân hàm).
 *
 * Response cùng schema User như POST /auth/register — dùng chung
 * validateUserResponse() để đảm bảo runtime validation nhất quán, không
 * chỉ dựa vào type assertion <User> lúc compile-time (không đảm bảo dữ
 * liệu thật khớp nếu Backend trả thiếu field, ví dụ thiếu role).
 *
 * @returns User profile object
 * @throws StandardError structured error object (401 if token invalid/expired)
 */
export async function getCurrentUser(): Promise<User> {
    try {
        const response = await scaffoldAdapter.get<unknown>(
            AUTH_CONFIG.paths.getCurrentUser
        );

        return validateUserResponse(response.data);
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