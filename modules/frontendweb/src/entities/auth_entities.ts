/**
 * @file auth_entities.ts
 * @layer entities
 * @description Type definitions cho workflow auth. Khớp 1-1 openapi.yaml
 *              AuthRequest, AuthResponse, User (v1.2.3).
 * @owner AG-04
 * @reference openapi.yaml components.schemas.AuthRequest/AuthResponse/User
 */

import type { StandardError } from './scaffold_entities'

// Re-export để code cũ import từ auth_entities vẫn hoạt động, tránh phải
// sửa toàn bộ import path ngay lập tức ở các layer khác trong cùng đợt vá.
export type { StandardError }

/**
 * LOGIN REQUEST
 * Endpoint: POST /auth/login
 * Reference: openapi.yaml components.schemas.AuthRequest
 * required: [username, password]
 */
export interface LoginRequest {
    username: string
    password: string
}

/**
 * REGISTER REQUEST
 * Endpoint: POST /auth/register
 * openapi.yaml không định nghĩa schema riêng RegisterRequest — request
 * body thực tế (username, email, password) suy từ hành vi Backend đã audit
 * (BackendModule auth_entities.py). Giữ định nghĩa tường minh ở đây.
 */
export interface RegisterRequest {
    username: string
    email: string
    password: string
}

/**
 * AUTHENTICATION RESPONSE
 * Reference: openapi.yaml components.schemas.AuthResponse
 * CHỈ trả về bởi POST /auth/login (200). KHÔNG phải response của
 * POST /auth/register — xem User bên dưới.
 */
export interface AuthResponse {
    access_token: string
    token_type: string // "bearer"
    expires_in: number // giây, ví dụ 86400 = 24h
}

/**
 * USER OBJECT
 * Reference: openapi.yaml components.schemas.User (v1.2.3)
 * Trả về bởi: GET /auth/me (200), POST /auth/register (201).
 * [APPEND v1.2.0] field `role` — khớp cột users.role, dùng cho
 * admin_authorization (data_schema.yaml Clause D). Trước v1.2.0 field này
 * bị thiếu ở entity Frontend — đã sửa.
 */
export interface User {
    id: number
    username: string
    email: string
    created_at: string // ISO 8601
    role: 'user' | 'admin'
}

/**
 * FORM VALIDATION RESULT — validate phía client trước khi submit.
 */
export interface FormValidationResult {
    isValid: boolean
    errors: Record<string, string>
}