/**
 * @file DashboardPage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description LAYOUT WRAPPER cho toàn bộ khu vực đã đăng nhập — giữ
 *              Sidebar + Header CỐ ĐỊNH, render trang con qua <Outlet/>.
 *              Search state (query/results/...) gọi useSearchController()
 *              Ở ĐÂY (tầng cha) để DetailImagePage/HomePage/ResultPage và
 *              Header cùng chia sẻ được.
 *              SỬA (hoàn thiện UX search — trước đây search-by-image
 *              không có nơi hiển thị kết quả, submit xong không thấy gì):
 *              Thêm điều hướng TỰ ĐỘNG sang /dashboard (HomePage — nơi
 *              hiển thị kết quả search dạng masonry đầy đủ) ngay sau khi
 *              1 lần SUBMIT TƯỜNG MINH (Enter cho text, hoặc chọn ảnh cho
 *              image) hoàn tất — KHÔNG điều hướng khi đang gõ dở (mỗi lần
 *              debounce trả preview cho dropdown). Cơ chế: dùng 1 cờ
 *              isExplicitSubmitRef đánh dấu NGAY TRƯỚC khi gọi search do
 *              submit thật, theo dõi search.isLoading true→false để biết
 *              lúc search vừa xong — nếu cờ đang bật thì điều hướng rồi
 *              tắt cờ. Không cần thêm state mới, không sửa search_services.ts.
 * @owner AG-04
 */

import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/page-layouts/dashboard-layout'
import type { DashboardNavItem } from '@/components/dashboard-sidebar'
import { useSearchController } from '@/routers/search_routers'
import type { SearchResponse } from '@/entities/search_entities'

function resolveActiveNavItem(pathname: string): DashboardNavItem {
    if (pathname.startsWith('/dashboard/upload')) return 'upload'
    if (pathname.startsWith('/dashboard/result')) return 'result'
    return 'home'
}

export function DashboardPage(): React.ReactElement {
    const location = useLocation()
    const navigate = useNavigate()
    const search = useSearchController()

    const [lastSearchResponse, setLastSearchResponse] = React.useState<SearchResponse | null>(null)

    // Cờ đánh dấu "search hiện tại là do 1 hành động SUBMIT tường minh"
    // (Enter, hoặc chọn ảnh) — KHÔNG bật khi chỉ đang gõ chữ (debounce
    // preview cho dropdown). Chỉ điều hướng khi cờ này đang bật lúc
    // search hoàn tất.
    const isExplicitSubmitRef = React.useRef(false)
    const wasLoadingRef = React.useRef(false)

    React.useEffect(() => {
        if (search.results.length > 0 || search.latencyMs !== null) {
            setLastSearchResponse({
                results: search.results,
                latency_ms: search.latencyMs ?? 0,
                top_k: search.results.length,
            })
        }
    }, [search.results, search.latencyMs])

    // Phát hiện đúng thời điểm search VỪA HOÀN TẤT (isLoading: true→false)
    // — nếu là submit tường minh, điều hướng sang HomePage xem kết quả
    // đầy đủ. Không điều hướng nếu search lỗi (không có gì để xem) hoặc
    // nếu chỉ là preview trong lúc gõ.
    React.useEffect(() => {
        const justFinished = wasLoadingRef.current && !search.isLoading
        wasLoadingRef.current = search.isLoading

        if (justFinished && isExplicitSubmitRef.current) {
            isExplicitSubmitRef.current = false
            if (!search.error) {
                navigate('/dashboard')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search.isLoading])

    const activeNavItem = resolveActiveNavItem(location.pathname)

    const handleNavigate = (item: DashboardNavItem) => {
        navigate(`/dashboard/${item === 'home' ? '' : item}`)
    }

    // Gõ chữ — CHỈ cập nhật dropdown preview, KHÔNG điều hướng (cờ giữ
    // nguyên false).
    const handleQueryChange = (text: string) => {
        search.searchByText(text)
    }

    // Enter/submit text thật — bật cờ TRƯỚC khi gọi search, để useEffect
    // phía trên biết đây là submit tường minh khi search xong.
    const handleSubmitTextSearch = (text: string) => {
        isExplicitSubmitRef.current = true
        search.searchByText(text)
    }

    // Search bằng ảnh LUÔN là hành động submit tường minh (không có khái
    // niệm "đang gõ dở" cho ảnh).
    const handleSubmitImageSearch = (file: File) => {
        isExplicitSubmitRef.current = true
        search.searchByImage(file)
    }

    const handleSelectSuggestion = (): void => {
        navigate('/dashboard')
    }

    return (
        <DashboardLayout
            activeNavItem={activeNavItem}
            onNavigate={handleNavigate}
            searchMode={search.mode}
            searchQuery={search.query}
            isSearchLoading={search.isLoading}
            searchResults={search.results}
            onSearchQueryChange={handleQueryChange}
            onSubmitTextSearch={handleSubmitTextSearch}
            onSubmitImageSearch={handleSubmitImageSearch}
            onSelectSuggestion={handleSelectSuggestion}
        >
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