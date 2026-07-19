/**
 * @file DashboardLayout.tsx
 * @layer page-layouts (Layer 3)
 * @description Khung 3 vùng cố định cho toàn bộ khu vực đã đăng nhập:
 *              Sidebar (trái) + Header (trên) + Content (còn lại).
 *              Component thuần — nhận toàn bộ nội dung/state qua props từ
 *              pages/DashboardPage.tsx (Nhóm C), không tự gọi hook nào.
 * @owner AG-04
 */

import React from 'react';
import { DashboardSidebar, type DashboardNavItem } from '@/components/dashboard-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import type { SearchResultItem } from '@/entities/search_entities';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activeNavItem: DashboardNavItem;
    onNavigate: (item: DashboardNavItem) => void;
    searchQuery: string;
    isSearchLoading: boolean;
    searchResults: SearchResultItem[];
    onSearchQueryChange: (text: string) => void;
    onSubmitTextSearch: (text: string) => void;
    onSubmitImageSearch: (file: File) => void;
    onSelectSuggestion: (item: SearchResultItem) => void;
}

export function DashboardLayout({
    children,
    activeNavItem,
    onNavigate,
    searchQuery,
    isSearchLoading,
    searchResults,
    onSearchQueryChange,
    onSubmitTextSearch,
    onSubmitImageSearch,
    onSelectSuggestion,
}: DashboardLayoutProps): React.ReactElement {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            <DashboardSidebar activeItem={activeNavItem} onNavigate={onNavigate} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <DashboardHeader
                    query={searchQuery}
                    isLoading={isSearchLoading}
                    results={searchResults}
                    onQueryChange={onSearchQueryChange}
                    onSubmitTextSearch={onSubmitTextSearch}
                    onSubmitImageSearch={onSubmitImageSearch}
                    onSelectSuggestion={onSelectSuggestion}
                />

                <main
                    style={{
                        flex: 1,
                        padding: 'var(--spacing-xl)',
                        backgroundColor: 'var(--color-bg-secondary)',
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}