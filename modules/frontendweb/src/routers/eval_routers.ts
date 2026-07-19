/**
 * @file eval_routers.ts
 * @layer routers
 * @description Evaluation router layer (0% JSX): orchestrates admin guard + eval services.
 *              SỬA (Bước 3 audit): useEffect trước đây có dependency
 *              [currentUser] — currentUser là OBJECT MỚI mỗi lần
 *              useGetCurrentUser() re-render (không useMemo), khiến
 *              useEffect chạy lại MỖI LẦN re-render → gọi loadUser() →
 *              setIsLoading → re-render → useEffect chạy lại → VÒNG LẶP
 *              GỌI API VÔ HẠN (infinite re-fetch loop). Đây là lỗi
 *              Blocking thật, không phải lý thuyết — sẽ làm trình duyệt
 *              treo/spam GET /auth/me liên tục khi vào trang có gọi
 *              useEvalController(). Sửa: dependency rỗng [], chỉ chạy
 *              đúng 1 lần khi mount.
 * @owner AG-04
 */

import { useEffect } from 'react'
import { useGetCurrentUser } from '../services/auth_services'
import { isAdmin } from './auth_routers'
import { useEvaluationMetrics, useRunEvaluation } from '../services/eval_services'

export function useEvalController() {
    const currentUser = useGetCurrentUser()
    const runEvaluation = useRunEvaluation()
    const metrics = useEvaluationMetrics()

    // SỬA: dependency rỗng [] — chỉ gọi loadUser() đúng 1 lần lúc mount,
    // KHÔNG đưa currentUser/loadUser vào dependency (object mới mỗi
    // render sẽ gây vòng lặp vô hạn — xem giải thích đầu file).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        void currentUser.loadUser()
    }, [])

    return {
        isAdminUser: isAdmin(currentUser.user),
        isCheckingAdmin: currentUser.isLoading,
        runEvaluation,
        metrics,
    }
}