/**
 * @file auth_entities.ts
 * @layer entities
 * @description Pure TypeScript interfaces for auth domain.
 *              Maps 1-to-1 with openapi.yaml and data_schema.yaml contracts.
 * @owner AG-04
 */

/**
 * Standard error response from backend.
 * Matches StandardError schema in openapi.yaml.
 */
export interface StandardError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}

/**
 * Login request payload.
 * Matches AuthRequest schema in openapi.yaml.
 */
export interface LoginRequest {
    username: string;
    password: string;
}

/**
 * Register request payload.
 * Extends AuthRequest with email field.
 */
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

/**
 * Authentication response containing JWT token.
 * Matches AuthResponse schema in openapi.yaml.
 */
export interface AuthResponse {
    access_token: string;
    token_type: string; // e.g., "bearer"
    expires_in: number; // seconds
}

/**
 * User profile information.
 * Matches User schema in openapi.yaml.
 */
export interface User {
    id: number;
    username: string;
    email: string;
    created_at: string; // ISO 8601 datetime
}

/**
 * Auth state returned by useLogin and useRegister hooks.
 */
export interface AuthState {
    isLoading: boolean;
    error: string | null;
    errorCode: string | null;
}

/**
 * Combined auth context state.
 */
export interface AuthContextState extends AuthState {
    user: User | null;
    isAuthenticated: boolean;
}