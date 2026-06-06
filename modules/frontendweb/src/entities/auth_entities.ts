/**
 * @file auth_entities.ts
 * @layer entities
 * @description Pure TypeScript interfaces for auth domain.
 *              Maps 1-to-1 with openapi.yaml schemas.
 *              No business logic, no state, only type definitions.
 * @owner AG-04
 */

/**
 * Standard error response from backend.
 * Matches Error schema in openapi.yaml.
 */
export interface StandardError {
    code: string; // e.g., 'ERR_INVALID_CREDENTIALS', 'ERR_USER_ALREADY_EXISTS'
    message: string;
    details?: Record<string, unknown>;
}

/**
 * Login request payload.
 * Matches AuthRequest schema in openapi.yaml → POST /auth/login
 */
export interface LoginRequest {
    username: string; // email or username
    password: string;
}

/**
 * Register request payload.
 * Extends AuthRequest with email field.
 * Matches request schema in openapi.yaml → POST /auth/register
 */
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

/**
 * Authentication response containing JWT token.
 * Matches AuthResponse schema in openapi.yaml.
 * Returned by POST /auth/login and POST /auth/register.
 */
export interface AuthResponse {
    access_token: string; // JWT token
    token_type: string; // typically "bearer"
    expires_in: number; // token lifetime in seconds
}

/**
 * User profile information.
 * Matches User schema in openapi.yaml.
 * Returned by GET /auth/me.
 */
export interface User {
    id: number; // User DB ID
    username: string;
    email: string;
    created_at: string; // ISO 8601 datetime
}

/**
 * Local form state during auth operations.
 * Used by useLogin() and useRegister() hooks.
 */
export interface AuthState {
    isLoading: boolean; // True while request in-flight
    error: string | null; // User-friendly error message
    errorCode: string | null; // Machine-readable error code
}

/**
 * Unified auth context state.
 * Combines auth operation state + authenticated user profile.
 */
export interface AuthContextState extends AuthState {
    user: User | null; // Current authenticated user (null if not logged in)
    isAuthenticated: boolean; // Boolean convenience flag
}

/**
 * Form validation error map.
 * Maps field names to validation error messages.
 */
export interface FormValidationErrors {
    [fieldName: string]: string;
}

/**
 * Form validation result.
 */
export interface FormValidationResult {
    valid: boolean;
    errors: FormValidationErrors;
}