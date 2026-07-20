/**
 * @file ImageCard.tsx
 * @layer components (Layer 2)
 * @description Card hiển thị 1 ảnh trong masonry gallery. Component thuần
 *              — nhận item + callback qua props, KHÔNG tự gọi hook từ
 *              routers/services/adapters (đúng ranh giới Nhóm B).
 *              SỬA:
 *              1. Bỏ aspect-ratio: 1/1 (crop vuông) — ảnh hiển thị đúng
 *                 tỷ lệ thật, đúng bản chất masonry Pinterest-style (các
 *                 cột cao thấp khác nhau tùy tỷ lệ ảnh gốc).
 *              2. Icon privacy đổi từ emoji tĩnh sang lucide-react (Lock/
 *                 Users/Globe) — đồng bộ thư viện icon toàn dự án.
 *              3. Thêm nút menu 3 chấm (MoreVertical) — mở dropdown Edit/
 *                 Delete. Component CHỈ phát ra sự kiện onEdit/onDelete
 *                 qua props, KHÔNG tự gọi useUpdateImage/useDeleteImage
 *                 (đó là việc của pages/ nơi dùng ImageCard).
 * @owner AG-04
 */

import React from 'react'
import { Lock, Users, Globe, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import type { ImageMetadata } from '../../entities/media_entities'

interface ImageCardProps {
    item: ImageMetadata
    onEdit?: (item: ImageMetadata) => void
    onDelete?: (item: ImageMetadata) => void
    onClick?: (item: ImageMetadata) => void
}

const PRIVACY_ICON: Record<0 | 1 | 2, typeof Lock> = {
    0: Lock,
    1: Users,
    2: Globe,
}

const PRIVACY_LABEL: Record<0 | 1 | 2, string> = {
    0: 'Private',
    1: 'Friends',
    2: 'Public',
}

const INDEX_STATUS_LABEL: Record<'pending' | 'ready' | 'failed', string> = {
    pending: 'Processing...',
    ready: 'Ready',
    failed: 'Failed',
}

const INDEX_STATUS_COLOR: Record<'pending' | 'ready' | 'failed', string> = {
    pending: 'var(--color-semantic-warning)',
    ready: 'var(--color-semantic-success)',
    failed: 'var(--color-semantic-error)',
}

export function ImageCard({ item, onEdit, onDelete, onClick }: ImageCardProps): React.ReactElement {
    const [imageLoadFailed, setImageLoadFailed] = React.useState(false)
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const menuRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (!isMenuOpen) return
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isMenuOpen])

    const shownTags = item.tags?.slice(0, 3) ?? []
    const extraTagCount = Math.max(0, (item.tags?.length ?? 0) - shownTags.length)
    const createdDate = new Date(item.created_at).toLocaleDateString()
    const PrivacyIcon = PRIVACY_ICON[item.privacy_level]

    return (
        <article
            onClick={() => onClick?.(item)}
            style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative',
            }}
        >
            {/* SỬA: bỏ aspect-ratio 1/1 (crop) — ảnh hiển thị đúng tỷ lệ
                thật, width 100% + height auto, đúng bản chất masonry. */}
            <div
                style={{
                    width: '100%',
                    backgroundColor: 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: imageLoadFailed ? '160px' : undefined,
                }}
            >
                {imageLoadFailed ? (
                    <div
                        style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--text-body-sm-size)',
                            textAlign: 'center',
                            padding: 'var(--spacing-base)',
                        }}
                    >
                        Failed to load image
                    </div>
                ) : (
                    <img
                        src={item.minio_url}
                        alt={`Image ${item.image_id}`}
                        onError={() => setImageLoadFailed(true)}
                        style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                        }}
                    />
                )}
            </div>

            {/* Menu 3 chấm — chỉ hiện khi có onEdit/onDelete được truyền */}
            {(onEdit || onDelete) && (
                <div
                    ref={menuRef}
                    style={{ position: 'absolute', top: 'var(--spacing-sm)', right: 'var(--spacing-sm)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen((prev) => !prev)}
                        aria-label="More options"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            backgroundColor: 'var(--color-overlay-white)',
                            backdropFilter: 'blur(4px)',
                            color: 'var(--color-text-inverted)',
                            cursor: 'pointer',
                        }}
                    >
                        <MoreVertical size={18} strokeWidth={2} />
                    </button>

                    {isMenuOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 'calc(100% + var(--spacing-xs))',
                                right: 0,
                                minWidth: '140px',
                                backgroundColor: 'var(--color-bg-primary)',
                                border: '1px solid var(--color-border-light)',
                                borderRadius: 'var(--radius-base)',
                                boxShadow: 'var(--shadow-lg)',
                                overflow: 'hidden',
                                zIndex: 10,
                            }}
                        >
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen(false)
                                        onEdit(item)
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        width: '100%',
                                        padding: 'var(--spacing-sm) var(--spacing-base)',
                                        border: 'none',
                                        background: 'none',
                                        color: 'var(--color-text-primary)',
                                        fontSize: 'var(--text-body-sm-size)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <Pencil size={14} strokeWidth={2} />
                                    Edit
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMenuOpen(false)
                                        onDelete(item)
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        width: '100%',
                                        padding: 'var(--spacing-sm) var(--spacing-base)',
                                        border: 'none',
                                        background: 'none',
                                        color: 'var(--color-semantic-error)',
                                        fontSize: 'var(--text-body-sm-size)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <Trash2 size={14} strokeWidth={2} />
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div style={{ padding: 'var(--spacing-base)' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-sm)',
                    }}
                >
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            fontSize: 'var(--text-body-sm-size)',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        <PrivacyIcon size={14} strokeWidth={2} />
                        {PRIVACY_LABEL[item.privacy_level]}
                    </span>

                    <span
                        style={{
                            fontSize: 'var(--text-ui-badge-size)',
                            fontWeight: 'var(--text-ui-badge-weight)',
                            color: INDEX_STATUS_COLOR[item.index_status],
                        }}
                    >
                        {INDEX_STATUS_LABEL[item.index_status]}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-xs)',
                        marginBottom: 'var(--spacing-sm)',
                    }}
                >
                    {shownTags.map((tag) => (
                        <span
                            key={`${item.image_id}-${tag}`}
                            style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                color: 'var(--color-text-secondary)',
                                borderRadius: 'var(--radius-full)',
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                fontSize: 'var(--text-body-xs-size)',
                            }}
                        >
                            #{tag}
                        </span>
                    ))}
                    {extraTagCount > 0 && (
                        <span
                            style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: 'var(--text-body-xs-size)',
                            }}
                        >
                            +{extraTagCount}
                        </span>
                    )}
                </div>

                <p
                    style={{
                        margin: 0,
                        color: 'var(--color-text-tertiary)',
                        fontSize: 'var(--text-body-xs-size)',
                    }}
                >
                    {createdDate}
                </p>
            </div>
        </article>
    )
}