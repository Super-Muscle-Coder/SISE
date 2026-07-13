/**
 * @file auth_routers.ts
 * @layer routers
 * @description Guard logic cho route yêu cầu đăng nhập. 0% JSX —
 *              export function thuần, KHÔNG phải React Component.
 * @owner AG-04
 */
import { getStoredToken } from '../services/auth_services'

/**
 * isAuthenticated: Kiểm tra người dùng đã đăng nhập hay chưa.
 * Dùng bởi scaffold_routers.ts để quyết định render route bảo vệ
 * hay redirect. KHÔNG render JSX — chỉ trả về boolean.
 */
export function isAuthenticated(): boolean {
    return getStoredToken() !== null
}