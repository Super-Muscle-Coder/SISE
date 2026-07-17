/**
 * @file admin_routers.ts
 * @layer routers
 * @description Admin router layer (0% JSX): orchestrates admin guard + reindex service.
 *              SỬA (Bước 3 audit): cùng lỗi vòng lặp gọi API vô hạn như
 *              eval_routers.ts — xem giải thích chi tiết ở file đó. Sửa
 *              dependency useEffect thành rỗng [].
 * @owner AG-04
 */

import { useEffect } from 'react'
import { useGetCurrentUser } from '../services/auth_services'
import { isAdmin } from './auth_routers'
import { useTriggerReindex } from '../services/admin_services'

export function useAdminController() {
    const currentUser = useGetCurrentUser()
    const reindex = useTriggerReindex()

    // SỬA: dependency rỗng [] — chỉ gọi loadUser() đúng 1 lần lúc mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        void currentUser.loadUser()
    }, [])

    return {
        isAdminUser: isAdmin(currentUser.user),
        isCheckingAdmin: currentUser.isLoading,
        reindex,
    }
}