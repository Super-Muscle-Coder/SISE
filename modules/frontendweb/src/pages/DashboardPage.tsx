/**
 * @file DashboardPage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description Trang Dashboard sau đăng nhập. Gọi useSearchController()
 *              (search_routers.ts) — nơi DUY NHẤT làm việc này, truyền
 *              state/callback xuống DashboardLayout/DashboardHeader qua
 *              props (đúng ranh giới Nhóm B không tự gọi hook).
 *              Quản lý điều hướng nội bộ giữa Home/Upload/Result bằng
 *              state cục bộ (KHÔNG dùng URL route riêng cho 3 trang này —
 *              đơn giản hóa theo đúng tinh thần "đi nhanh" của giai đoạn
 *              hiện tại; có thể nâng cấp thành route con sau nếu cần).
 *              Khi search thành công (text hoặc ảnh), tự động chuyển sang
 *              "result" và lưu SearchResponse mới nhất vào state để
 *              ResultPage hiển thị (theo đúng thiết kế đã chốt: ResultPage
 *              nhận kết quả qua điều hướng, KHÔNG tự gọi lại API search).
 * @owner AG-04
 */

import React from 'react';
import { DashboardLayout } from '@/page-layouts/dashboard-layout';
import type { DashboardNavItem } from '@/components/dashboard-sidebar';
import { useSearchController } from '@/routers/search_routers';
import type { SearchResultItem, SearchResponse } from '@/entities/search_entities';
import { UploadPage } from './UploadPage'

// Placeholder tạm — thay bằng pages/HomePage.tsx, pages/UploadPage.tsx,
// pages/ResultPage.tsx thật khi viết xong (đúng lộ trình đã chốt).
function HomePagePlaceholder(): React.ReactElement {
    return <p style={{ color: 'var(--color-text-secondary)' }}>Home page coming soon.</p>;
}
function UploadPagePlaceholder(): React.ReactElement {
    return <p style={{ color: 'var(--color-text-secondary)' }}>Upload page coming soon.</p>;
}
function ResultPagePlaceholder({ lastSearch }: { lastSearch: SearchResponse | null }): React.ReactElement {
    return (
        <div>
            <p style={{ color: 'var(--color-text-secondary)' }}>Result page coming soon.</p>
            {lastSearch && (
                <pre style={{ fontSize: 'var(--text-body-sm-size)' }}>
                    {JSON.stringify(lastSearch, null, 2)}
                </pre>
            )}
        </div>
    );
}

export function DashboardPage(): React.ReactElement {
    const [activeNavItem, setActiveNavItem] = React.useState<DashboardNavItem>('home');
    const [lastSearchResponse, setLastSearchResponse] = React.useState<SearchResponse | null>(null);

    const search = useSearchController();

    // LƯU Ý: search.searchByText() tự debounce nội bộ (đã audit Nhóm 3,
    // search_services.ts) — mỗi lần gõ ký tự gọi thẳng hàm này là ĐÚNG
    // thiết kế, KHÔNG cần tách riêng "chỉ update text" vs "trigger search".
    // Enter cũng gọi lại chính hàm này để đảm bảo search ngay lập tức,
    // không đợi hết debounce window.
    const handleSubmitTextSearch = async (text: string) => {
        await search.searchByText(text);
    };

    const handleSubmitImageSearch = async (file: File) => {
        await search.searchByImage(file);
    };

    // Bấm 1 gợi ý trong dropdown: chuyển sang tab Result. Không cần lọc
    // riêng theo item được chọn — toàn bộ search.results (cùng 1 lần gọi
    // API) đã là "những ảnh thuộc về gợi ý này", đúng ý đã chốt.
    const handleSelectSuggestion = (): void => {
        setActiveNavItem('result');
    };

    // Đồng bộ: mỗi khi search.results đổi (search thành công), lưu lại
    // SearchResponse đầy đủ (results + latencyMs + topK) cho ResultPage.
    React.useEffect(() => {
        if (search.results.length > 0 || search.latencyMs !== null) {
            setLastSearchResponse({
                results: search.results,
                latency_ms: search.latencyMs ?? 0,
                top_k: search.results.length,
            });
        }
    }, [search.results, search.latencyMs]);

    const renderContent = () => {
        switch (activeNavItem) {
            case 'upload':
                return <UploadPage />;
            case 'result':
                return <ResultPagePlaceholder lastSearch={lastSearchResponse} />;
            case 'home':
            default:
                return <HomePagePlaceholder />;
        }
    };

    return (
        <DashboardLayout
            activeNavItem={activeNavItem}
            onNavigate={setActiveNavItem}
            searchQuery={search.query}
            isSearchLoading={search.isLoading}
            searchResults={search.results}
            onSearchQueryChange={handleSubmitTextSearch}
            onSubmitTextSearch={handleSubmitTextSearch}
            onSubmitImageSearch={handleSubmitImageSearch}
            onSelectSuggestion={handleSelectSuggestion}
        >
            {renderContent()}
        </DashboardLayout>
    );
}