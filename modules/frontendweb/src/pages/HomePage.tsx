/**
 * @file HomePage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description Trang chủ Dashboard — điểm vào chính cho luồng search.
 *              SỬA (quyết định lại toàn bộ vai trò trang này): ban đầu dự
 *              định "feed ảnh từ mọi user trên nền tảng", nhưng đối chiếu
 *              hợp đồng xác nhận GET /media CHỈ trả ảnh của chính user
 *              đăng nhập ("List images for the authenticated user") —
 *              không có endpoint feed toàn nền tảng. Quyết định: HomePage
 *              trở thành điểm hiển thị KẾT QUẢ SEARCH (masonry ảnh thực
 *              tế) — trước khi search: empty state gợi ý dùng ô tìm kiếm
 *              ở Header; sau khi search: hiển thị search.results (đã có
 *              sẵn từ DashboardPage qua props, KHÔNG tự gọi
 *              useSearchController() ở đây — tránh tạo 2 state search độc
 *              lập không đồng bộ).
 *              Phân vai trò rõ với ResultPage: HomePage = ẢNH (trực quan),
 *              ResultPage = CHỈ SỐ (latency, MRR/HitRate/Precision/Recall,
 *              KHÔNG hiển thị lại ảnh).
 * @owner AG-04
 */

import React from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { ImageCard } from '@/components/media'
import type { SearchResultItem, SearchResponse } from '@/entities/search_entities'
import type { ImageMetadata } from '@/entities/media_entities'

/**
 * Context được truyền từ DashboardPage (layout cha) qua <Outlet context={...}/>
 * — search state sống ở tầng DashboardPage để chia sẻ được giữa HomePage
 * và ResultPage (cả 2 cần cùng 1 nguồn search.results, không tự gọi API
 * riêng).
 */
export interface DashboardOutletContext {
    searchQuery: string
    searchResults: SearchResultItem[]
    isSearchLoading: boolean
    lastSearchResponse: SearchResponse | null
}

export function HomePage(): React.ReactElement {
    const navigate = useNavigate()
    const { searchQuery, searchResults, isSearchLoading } = useOutletContext<DashboardOutletContext>()

    const images: ImageMetadata[] = searchResults.map((r) => r.metadata)

    const handleImageClick = (item: ImageMetadata) => {
        navigate(`/dashboard/image/${item.image_id}`)
    }

    if (isSearchLoading) {
        return <p style={{ color: 'var(--color-text-secondary)' }}>Searching...</p>
    }

    if (!searchQuery.trim() && images.length === 0) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    textAlign: 'center',
                    gap: 'var(--spacing-base)',
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: 'var(--text-heading-h3-size)',
                        fontWeight: 'var(--text-heading-h3-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Search your photos
                </h2>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', maxWidth: '360px' }}>
                    Type a description in the search bar above, or use the image
                    icon to search by picture.
                </p>
            </div>
        )
    }

    if (images.length === 0) {
        return <p style={{ color: 'var(--color-text-secondary)' }}>No results found.</p>
    }

    return (
        <div className="masonry-4">
            {images.map((item) => (
                <div key={item.image_id} className="masonry-item">
                    <ImageCard item={item} onClick={handleImageClick} />
                </div>
            ))}
        </div>
    )
}