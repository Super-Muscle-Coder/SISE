/**
 * @file AlbumStrip.tsx
 * @layer components (Layer 2)
 * @description Hàng ngang cố định chiều cao, scroll ngang, hiển thị nút
 *              "Tạo album mới" (ngoài cùng trái) + danh sách album. Bấm 1
 *              album để highlight/lọc, bấm lại chính nó để bỏ chọn.
 *              Component thuần — nhận albums + selectedAlbumId +
 *              onSelectAlbum + onCreateAlbumClick qua props, KHÔNG tự gọi
 *              hook nào (đúng ranh giới Nhóm B).
 * @owner AG-04
 */

import React from 'react';
import { Plus } from 'lucide-react';
import type { Album } from '@/entities/media_entities';

interface AlbumStripProps {
    albums: Album[];
    selectedAlbumId: number | null;
    onSelectAlbum: (albumId: number) => void;
    onCreateAlbumClick: () => void;
}

export function AlbumStrip({
    albums,
    selectedAlbumId,
    onSelectAlbum,
    onCreateAlbumClick,
}: AlbumStripProps): React.ReactElement {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-base)',
                padding: 'var(--spacing-base) var(--spacing-xl)',
                overflowX: 'auto',
                overflowY: 'hidden',
                flexShrink: 0,
                borderBottom: '1px solid var(--color-border-light)',
                backgroundColor: 'var(--color-bg-primary)',
            }}
        >
            <button
                type="button"
                onClick={onCreateAlbumClick}
                aria-label="Create new album"
                style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px dashed var(--color-border-medium)`,
                    background: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                }}
            >
                <Plus size={24} strokeWidth={2} />
            </button>

            {albums.map((album) => {
                const isSelected = album.id === selectedAlbumId;
                return (
                    <button
                        key={album.id}
                        type="button"
                        onClick={() => onSelectAlbum(album.id)}
                        title={album.title}
                        style={{
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '96px',
                            height: '72px',
                            padding: '0 var(--spacing-base)',
                            borderRadius: 'var(--radius-lg)',
                            border: `2px solid ${isSelected ? 'var(--color-brand-primary)' : 'var(--color-border-light)'}`,
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: isSelected ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                            fontSize: 'var(--text-body-sm-size)',
                            fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            transition: `border-color var(--duration-normal) var(--easing-in-out), color var(--duration-normal) var(--easing-in-out)`,
                        }}
                    >
                        {album.title}
                    </button>
                );
            })}
        </div>
    );
}