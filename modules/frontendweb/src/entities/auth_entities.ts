/**
 * @file auth_entities.ts
 * @layer entities
 * @description Pure TypeScript interfaces for auth domain.
 *              Maps 1-to-1 with openapi.yaml schemas.
 *              No business logic, no state, only type definitions.
 * 
 * Công dụng: Định nghĩa kiểu dữ liệu (TypeScript types)
  - LoginRequest, RegisterRequest (payload gửi tới backend)
  - AuthResponse, User (phản hồi từ backend)
  Nếu backend response format thay đổi, update type ở đây
 * @owner AG-04
 * @reference .context/openapi.yaml, DOS.md (Auth Workflow T003-02)
 */

/**
 * Standard error response from backend.
 * Matches Error schema in openapi.yaml.
 */
export interface StandardError {
    code?: string; // e.g., 'ERR_INVALID_CREDENTIALS', 'ERR_USER_ALREADY_EXISTS'
    detail?: string; // Main error message from backend
    message?: string; // Alternative error message field
    details?: Record<string, unknown>;
}

/**
 * LOGIN REQUEST
 * Endpoint: POST /auth/login
 * Fields: username + password only (no email)
 * 
 * Backend validates:
 * - username: required (not empty)
 * - password: required (not empty)
 * 
 * Possible errors:
 * - 400: Missing required fields
 * - 401: Invalid username or password
 */
export interface LoginRequest {
    username: string; // Can be email or username
    password: string;
}

/**
 * REGISTER REQUEST
 * Endpoint: POST /auth/register
 * Fields: username + email + password
 * 
 * Backend validates:
 * - username: 3-50 characters, unique
 * - email: valid email format, unique
 * - password: minimum 8 characters
 * 
 * Possible errors:
 * - 400: Invalid format or duplicate
 * - 400: validation error
 */
export interface RegisterRequest {
    username: string; // 3-50 chars, unique
    email: string; // Valid email format, unique
    password: string; // Minimum 8 characters
}

/**
 * AUTHENTICATION RESPONSE
 * Returned by:
 * - POST /auth/login (200 OK)
 * - POST /auth/register (201 Created)
 * 
 * Contains JWT token that frontend must store and use for subsequent requests
 */
export interface AuthResponse {
    access_token: string; // JWT token (HS256 algorithm)
    token_type: string; // Typically "bearer"
    expires_in: number; // Token lifetime in seconds (86400 = 24 hours)
}

/**
 * USER OBJECT
 * Returned by: GET /auth/me
 * Contains user information after successful authentication
 */
export interface User {
    id: number;
    username: string;
    email: string;
    created_at: string; // ISO 8601 timestamp
}

/**
 * AUTH STATE
 * Frontend state management for authentication
 */
export interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * FORM VALIDATION RESULT
 * Used for form-level validation errors before submission
 */
export interface FormValidationResult {
    isValid: boolean;
    errors: Record<string, string>;
}

/**
 * AUTH CONTEXT STATE
 * Provided by AuthContextProvider to entire app
 */
export interface AuthContextState extends AuthState {
    login: (credentials: LoginRequest) => Promise<void>;
    register: (credentials: RegisterRequest) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}