/**
 * @file auth_routers.ts
 * @layer routers
 * @description Guard logic cho route yêu cầu đăng nhập. 0% JSX —
 *              export function thuần, KHÔNG phải React Component.
 * @owner AG-04
 */
import { getStoredToken } from '../services/auth_services'
import type { User } from '../entities/auth_entities'

/**
 * isAuthenticated: Kiểm tra người dùng đã đăng nhập hay chưa.
 * Dùng bởi scaffold_routers.ts để quyết định render route bảo vệ
 * hay redirect. KHÔNG render JSX — chỉ trả về boolean.
 */
export function isAuthenticated(): boolean {
    return getStoredToken() !== null
}

/**
 * isAdmin: Kiểm tra user có quyền admin hay không.
 * Dùng bởi eval_routers.ts và admin_routers.ts để ẩn/hiện UI
 * admin-only. KHÔNG tự gọi API — nhận User đã tải sẵn (qua
 * useGetCurrentUser) làm tham số.
 */
export function isAdmin(user: User | null): boolean {
    return user?.role === 'admin'
}