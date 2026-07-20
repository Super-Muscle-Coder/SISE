/**
 * @file EditImageDialog.tsx
 * @layer components (Layer 2)
 * @description Dialog chỉnh sửa 1 ảnh — đổi album, privacy_level, tags.
 *              Component thuần — nhận item + albums + onSubmit qua props,
 *              KHÔNG tự gọi useUpdateImage() (đó là việc của pages/, đúng
 *              ranh giới Nhóm B). Khớp đúng PUT /media/{id}/update
 *              requestBody: { album_id?, privacy_level?, tags? }.
 * @owner AG-04
 */

import React from 'react'
import { X } from 'lucide-react'
import type { Album, ImageMetadata, PrivacyLevel } from '../../entities/media_entities'

interface EditImageDialogProps {
    isOpen: boolean
    image: ImageMetadata | null
    albums: Album[]
    onClose: () => void
    onSubmit: (updates: { album_id?: number; privacy_level?: PrivacyLevel; tags?: string[] }) => Promise<void>
    isSubmitting?: boolean
    error?: string | null
}

const PRIVACY_OPTIONS: { value: PrivacyLevel; label: string }[] = [
    { value: 0, label: 'Private' },
    { value: 1, label: 'Friends' },
    { value: 2, label: 'Public' },
]

export function EditImageDialog({
    isOpen,
    image,
    albums,
    onClose,
    onSubmit,
    isSubmitting = false,
    error = null,
}: EditImageDialogProps): React.ReactElement | null {
    const [albumId, setAlbumId] = React.useState<number | undefined>(undefined)
    const [privacyLevel, setPrivacyLevel] = React.useState<PrivacyLevel>(2)
    const [tags, setTags] = React.useState<string[]>([])
    const [tagDraft, setTagDraft] = React.useState('')

    // Đồng bộ state form với ảnh đang chỉnh sửa mỗi khi dialog mở lại với
    // ảnh khác — tránh giữ state cũ từ lần mở trước.
    React.useEffect(() => {
        if (image) {
            setAlbumId(image.album_id)
            setPrivacyLevel(image.privacy_level)
            setTags(image.tags ?? [])
        }
    }, [image])

    if (!isOpen || !image) return null

    const addTagFromDraft = () => {
        const trimmed = tagDraft.trim()
        if (!trimmed) return
        if (!tags.includes(trimmed)) {
            setTags((prev) => [...prev, trimmed])
        }
        setTagDraft('')
    }

    const removeTag = (tag: string) => {
        setTags((prev) => prev.filter((t) => t !== tag))
    }

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTagFromDraft()
        } else if (e.key === 'Backspace' && !tagDraft && tags.length > 0) {
            setTags((prev) => prev.slice(0, -1))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            album_id: albumId,
            privacy_level: privacyLevel,
            tags,
        })
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'var(--color-overlay-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-lg)',
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 'var(--spacing-xl)',
                    position: 'relative',
                }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: 'absolute',
                        top: 'var(--spacing-base)',
                        right: 'var(--spacing-base)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                    }}
                >
                    <X size={20} strokeWidth={2} />
                </button>

                <h3
                    style={{
                        margin: 0,
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: 'var(--text-heading-h4-size)',
                        fontWeight: 'var(--text-heading-h4-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Edit Image
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-base)' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        <span style={{ fontSize: 'var(--text-ui-label-size)', color: 'var(--color-text-secondary)' }}>
                            Album
                        </span>
                        <select
                            value={albumId ?? ''}
                            onChange={(e) => setAlbumId(e.target.value ? Number(e.target.value) : undefined)}
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                boxSizing: 'border-box',
                                padding: 'var(--spacing-sm) var(--spacing-base)',
                                borderRadius: 'var(--radius-base)',
                                border: '1px solid var(--color-border-light)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                            }}
                        >
                            <option value="">No album</option>
                            {albums.map((album) => (
                                <option key={album.id} value={album.id}>
                                    {album.title}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div>
                        <span
                            style={{
                                display: 'block',
                                marginBottom: 'var(--spacing-sm)',
                                fontSize: 'var(--text-ui-label-size)',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            Privacy
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-sm)' }}>
                            {PRIVACY_OPTIONS.map((option) => {
                                const isSelected = option.value === privacyLevel
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => setPrivacyLevel(option.value)}
                                        style={{
                                            padding: 'var(--spacing-sm) var(--spacing-base)',
                                            borderRadius: 'var(--radius-base)',
                                            border: `1px solid ${isSelected ? 'var(--color-brand-primary)' : 'var(--color-border-light)'}`,
                                            backgroundColor: isSelected ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                                            color: isSelected ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                                            fontSize: 'var(--text-body-sm-size)',
                                            fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        <span style={{ fontSize: 'var(--text-ui-label-size)', color: 'var(--color-text-secondary)' }}>
                            Tags
                        </span>
                        <div
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 'var(--spacing-xs)',
                                padding: 'var(--spacing-sm)',
                                border: '1px solid var(--color-border-light)',
                                borderRadius: 'var(--radius-base)',
                                backgroundColor: 'var(--color-bg-primary)',
                            }}
                        >
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        borderRadius: 'var(--radius-full)',
                                        backgroundColor: 'var(--color-bg-secondary)',
                                        color: 'var(--color-text-primary)',
                                        fontSize: 'var(--text-body-xs-size)',
                                    }}
                                >
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        aria-label={`Remove tag ${tag}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            border: 'none',
                                            background: 'none',
                                            color: 'var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            padding: 0,
                                        }}
                                    >
                                        <X size={12} strokeWidth={2} />
                                    </button>
                                </span>
                            ))}
                            <input
                                value={tagDraft}
                                onChange={(e) => setTagDraft(e.target.value)}
                                onKeyDown={handleTagInputKeyDown}
                                onBlur={addTagFromDraft}
                                disabled={isSubmitting}
                                placeholder={tags.length === 0 ? 'nature, sunset' : ''}
                                style={{
                                    flex: 1,
                                    minWidth: '100px',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    color: 'var(--color-text-primary)',
                                    fontSize: 'var(--text-body-sm-size)',
                                }}
                            />
                        </div>
                    </label>

                    {error && (
                        <p style={{ margin: 0, color: 'var(--color-semantic-error)', fontSize: 'var(--text-body-sm-size)' }}>
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            fontSize: 'var(--text-ui-button-size)',
                            fontWeight: 'var(--text-ui-button-weight)',
                            color: 'var(--color-text-inverted)',
                            backgroundColor: isSubmitting ? 'var(--color-text-tertiary)' : 'var(--color-brand-primary)',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    )
}