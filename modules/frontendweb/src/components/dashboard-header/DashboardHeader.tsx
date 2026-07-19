/**
 * @file DashboardHeader.tsx
 * @layer components (Layer 2)
 * @description Header cố định cho Dashboard (KHÁC LandingHeader — không
 *              sticky-shadow-khi-cuộn, không dùng cho Landing). Chứa ô
 *              tìm kiếm text (dropdown gợi ý dạng text, đọc từ
 *              SearchResultItem.metadata.tags) + nút mở
 *              SearchByImageDialog.
 *              Component thuần — nhận TOÀN BỘ state/callback search qua
 *              props, KHÔNG tự gọi useSearchController() (đúng ranh giới
 *              Nhóm B — pages/DashboardPage.tsx là nơi duy nhất gọi hook).
 * @owner AG-04
 */

import React from 'react';
import { ImageIcon } from 'lucide-react';
import type { SearchResultItem } from '@/entities/search_entities';
import { SearchByImageDialog } from './SearchByImageDialog';

interface DashboardHeaderProps {
    query: string;
    isLoading: boolean;
    results: SearchResultItem[];
    onQueryChange: (text: string) => void;
    onSubmitTextSearch: (text: string) => void;
    onSubmitImageSearch: (file: File) => void;
    onSelectSuggestion: (item: SearchResultItem) => void;
}

export function DashboardHeader({
    query,
    isLoading,
    results,
    onQueryChange,
    onSubmitTextSearch,
    onSubmitImageSearch,
    onSelectSuggestion,
}: DashboardHeaderProps): React.ReactElement {
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false);

    // Gợi ý dạng text: gom nhãn từ tags (nếu có), fallback về image_id rút
    // gọn — đúng quyết định "chỉ hiện text, chưa cần thumbnail" (tương lai
    // mở rộng thêm thumbnail khi cần).
    const suggestionLabel = (item: SearchResultItem): string => {
        const tags = item.metadata.tags;
        if (tags && tags.length > 0) return tags.join(', ');
        return `Image ${item.image_id.slice(0, 8)}...`;
    };

    return (
        <header
            style={{
                position: 'sticky',
                top: 0,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-base)',
                padding: 'var(--spacing-base) var(--spacing-xl)',
                backgroundColor: 'var(--color-bg-primary)',
                borderBottom: '1px solid var(--color-border-light)',
            }}
        >
            <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }}>
                <input
                    type="text"
                    value={query}
                    placeholder="Search by description..."
                    onChange={(e) => {
                        onQueryChange(e.target.value);
                        setIsDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onSubmitTextSearch(query);
                            setIsDropdownOpen(false);
                        }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 'var(--spacing-sm) var(--spacing-base)',
                        fontSize: 'var(--text-body-base-size)',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-border-light)',
                        outline: 'none',
                        color: 'var(--color-text-primary)',
                        backgroundColor: 'var(--color-bg-secondary)',
                    }}
                />

                {isDropdownOpen && query.trim() && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + var(--spacing-xs))',
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--color-bg-primary)',
                            border: '1px solid var(--color-border-light)',
                            borderRadius: 'var(--radius-base)',
                            boxShadow: 'var(--shadow-lg)',
                            maxHeight: '320px',
                            overflowY: 'auto',
                            zIndex: 30,
                        }}
                    >
                        {isLoading && (
                            <p
                                style={{
                                    margin: 0,
                                    padding: 'var(--spacing-base)',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: 'var(--text-body-sm-size)',
                                }}
                            >
                                Searching...
                            </p>
                        )}

                        {!isLoading && results.length === 0 && (
                            <p
                                style={{
                                    margin: 0,
                                    padding: 'var(--spacing-base)',
                                    color: 'var(--color-text-secondary)',
                                    fontSize: 'var(--text-body-sm-size)',
                                }}
                            >
                                No results yet — press Enter to search.
                            </p>
                        )}

                        {!isLoading &&
                            results.map((item) => (
                                <button
                                    key={item.image_id}
                                    type="button"
                                    onMouseDown={() => onSelectSuggestion(item)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        textAlign: 'left',
                                        padding: 'var(--spacing-sm) var(--spacing-base)',
                                        border: 'none',
                                        background: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--color-text-primary)',
                                        fontSize: 'var(--text-body-sm-size)',
                                    }}
                                >
                                    {suggestionLabel(item)}
                                </button>
                            ))}
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={() => setIsImageDialogOpen(true)}
                aria-label="Search by image"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--color-border-light)',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                }}
            >
                <ImageIcon size={20} strokeWidth={2} />
            </button>

            <SearchByImageDialog
                isOpen={isImageDialogOpen}
                onClose={() => setIsImageDialogOpen(false)}
                isLoading={isLoading}
                onSubmit={(file) => {
                    onSubmitImageSearch(file);
                    setIsImageDialogOpen(false);
                }}
            />
        </header>
    );
}