/**
 * @file DashboardHeader.tsx
 * @layer components (Layer 2)
 * @description Header cố định cho Dashboard. Chứa ô tìm kiếm text
 *              (dropdown preview kèm % độ liên quan) + nút mở
 *              SearchByImageDialog.
 *              Component thuần — nhận TOÀN BỘ state/callback search qua
 *              props, KHÔNG tự gọi useSearchController().
 *              SỬA (modality gap — threshold tách theo mode):
 *              1. Nhận thêm prop `mode` ('text'|'image'|null) — cần biết
 *                 để chọn ĐÚNG bộ ngưỡng khi phân loại score
 *                 (SEARCH_CONFIG.scoreThreshold.classify(score, mode)).
 *              2. Thêm dòng giải thích ngắn dưới mỗi badge % — khác nhau
 *                 tùy mode, giúp người dùng hiểu 2 con số không so sánh
 *                 trực tiếp được với nhau (text-to-image vs
 *                 image-to-image similarity).
 * @owner AG-04
 */

import React from 'react';
import { ImageIcon } from 'lucide-react';
import { SEARCH_CONFIG } from '@/configs/search_configs';
import type { SearchResultItem } from '@/entities/search_entities';
import { SearchByImageDialog } from './SearchByImageDialog';

interface DashboardHeaderProps {
    mode: 'text' | 'image' | null;
    query: string;
    isLoading: boolean;
    results: SearchResultItem[];
    onQueryChange: (text: string) => void;
    onSubmitTextSearch: (text: string) => void;
    onSubmitImageSearch: (file: File) => void;
    onSelectSuggestion: (item: SearchResultItem) => void;
}

const SCORE_BADGE_COLOR: Record<'high' | 'medium' | 'low', string> = {
    high: 'var(--color-semantic-success)',
    medium: 'var(--color-semantic-warning)',
    low: 'var(--color-text-tertiary)',
};

export function DashboardHeader({
    mode,
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

    const suggestionLabel = (item: SearchResultItem): string => {
        const tags = item.metadata.tags;
        if (tags && tags.length > 0) return tags.join(', ');
        return 'Untitled image';
    };

    // effectiveMode: mode có thể null lúc chưa search lần nào — fallback
    // 'text' chỉ để classify() luôn nhận đủ tham số hợp lệ (không có ý
    // nghĩa thực tế vì dropdown rỗng thì không hiển thị badge nào cả).
    const effectiveMode: 'text' | 'image' = mode ?? 'text';

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

                {isDropdownOpen && (isLoading || results.length > 0) && (
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
                            maxHeight: '360px',
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

                        {!isLoading && results.length > 0 && (
                            <p
                                style={{
                                    margin: 0,
                                    padding: 'var(--spacing-sm) var(--spacing-base)',
                                    fontSize: 'var(--text-body-xs-size)',
                                    color: 'var(--color-text-tertiary)',
                                    borderBottom: '1px solid var(--color-border-light)',
                                }}
                            >
                                {effectiveMode === 'text'
                                    ? 'Compared via text-to-image similarity'
                                    : 'Compared via image-to-image similarity'}
                            </p>
                        )}

                        {!isLoading &&
                            results.map((item) => {
                                const level = SEARCH_CONFIG.scoreThreshold.classify(item.score, effectiveMode);
                                const matchPercent = Math.round(item.score * 100);

                                return (
                                    <button
                                        key={item.image_id}
                                        type="button"
                                        onMouseDown={() => onSelectSuggestion(item)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 'var(--spacing-sm)',
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
                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {suggestionLabel(item)}
                                        </span>
                                        <span
                                            style={{
                                                flexShrink: 0,
                                                fontSize: 'var(--text-body-xs-size)',
                                                fontWeight: 'var(--font-weight-semibold)',
                                                color: SCORE_BADGE_COLOR[level],
                                            }}
                                        >
                                            {matchPercent}% match
                                        </span>
                                    </button>
                                );
                            })}
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
                    setIsDropdownOpen(true);
                }}
            />
        </header>
    );
}