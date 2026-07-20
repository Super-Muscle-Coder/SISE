/**
 * @file DashboardPage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description LAYOUT WRAPPER cho toàn bộ khu vực đã đăng nhập — giữ
 *              Sidebar + Header CỐ ĐỊNH, render trang con qua <Outlet/>.
 *              SỬA (thiết kế lại để hỗ trợ DetailImagePage có URL thật):
 *              TRƯỚC ĐÂY DashboardPage tự quản lý "trang nào đang active"
 *              bằng useState nội bộ (activeNavItem) — không có URL thật,
 *              không share link được, back/forward không hoạt động, và
 *              không mở rộng được cho DetailImagePage (cần
 *              /dashboard/image/:imageId là URL thật).
 *              NAY: DashboardPage chỉ là KHUNG (Sidebar+Header), dùng
 *              React Router nested route thật — HomePage/UploadPage/
 *              ResultPage/DetailImagePage là các Route con riêng biệt,
 *              render vào <Outlet/>. activeNavItem giờ suy ra TỪ URL hiện
 *              tại (useLocation), không phải state tự quản lý.
 *              Search state (query/results/...) vẫn gọi useSearchController()
 *              Ở ĐÂY (tầng cha) để DetailImagePage và Header cùng chia sẻ
 *              được — nếu đặt trong từng trang con sẽ mất state khi
 *              chuyển trang.
 * @owner AG-04
 */

import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/page-layouts/dashboard-layout'
import type { DashboardNavItem } from '@/components/dashboard-sidebar'
import { useSearchController } from '@/routers/search_routers'

/**
 * Suy ra "mục nav đang active" từ URL hiện tại — thay cho state cũ.
 * DetailImagePage (/dashboard/image/:id) không có mục sidebar tương ứng
 * (đúng thiết kế: Pinterest không highlight sidebar khi xem chi tiết ảnh)
 * — trả về 'home' làm mặc định gần đúng nhất trong trường hợp đó.
 */
function resolveActiveNavItem(pathname: string): DashboardNavItem {
    if (pathname.startsWith('/dashboard/upload')) return 'upload'
    if (pathname.startsWith('/dashboard/result')) return 'result'
    return 'home'
}

export function DashboardPage(): React.ReactElement {
    const location = useLocation()
    const navigate = useNavigate()
    const search = useSearchController()

    // SỬA: thêm lastSearchResponse — HomePage/ResultPage con (qua Outlet
    // context) cần shape đầy đủ SearchResponse (results + latency_ms +
    // top_k), không chỉ mảng results thô. Cập nhật mỗi khi search thay
    // đổi kết quả.
    const [lastSearchResponse, setLastSearchResponse] = React.useState<
        import('@/entities/search_entities').SearchResponse | null
    >(null)

    React.useEffect(() => {
        if (search.results.length > 0 || search.latencyMs !== null) {
            setLastSearchResponse({
                results: search.results,
                latency_ms: search.latencyMs ?? 0,
                top_k: search.results.length,
            })
        }
    }, [search.results, search.latencyMs])

    const activeNavItem = resolveActiveNavItem(location.pathname)

    const handleNavigate = (item: DashboardNavItem) => {
        navigate(`/dashboard/${item === 'home' ? '' : item}`)
    }

    const handleSelectSuggestion = (): void => {
        navigate('/dashboard/result')
    }

    return (
        <DashboardLayout
            activeNavItem={activeNavItem}
            onNavigate={handleNavigate}
            searchQuery={search.query}
            isSearchLoading={search.isLoading}
            searchResults={search.results}
            onSearchQueryChange={search.searchByText}
            onSubmitTextSearch={search.searchByText}
            onSubmitImageSearch={search.searchByImage}
            onSelectSuggestion={handleSelectSuggestion}
        >
            {/* Trang con (HomePage/UploadPage/ResultPage/DetailImagePage)
                render vào đây qua React Router nested route.
                context: search state dùng chung cho HomePage + ResultPage
                (đọc qua useOutletContext<DashboardOutletContext>()). */}
            <Outlet
                context={{
                    searchQuery: search.query,
                    searchResults: search.results,
                    isSearchLoading: search.isLoading,
                    lastSearchResponse,
                }}
            />
        </DashboardLayout>
    )
}