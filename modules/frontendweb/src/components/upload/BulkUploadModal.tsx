/**
 * @file BulkUploadModal.tsx
 * @layer components (Layer 2)
 * @description Modal upload nhiều file. Component thuần — nhận toàn bộ
 *              state/callback qua props, KHÔNG tự gọi hook từ
 *              routers/services/adapters (đúng ranh giới Nhóm B).
 *              SỬA (theo yêu cầu Project Owner, đối chiếu schema images
 *              thật):
 *              1. Bỏ dropdown chọn album — UploadPage.tsx đã chọn sẵn
 *                 album qua AlbumStrip (điều kiện để nút Upload hiện ra),
 *                 có 2 nơi cùng chọn 1 thứ gây nhầm lẫn. Thay bằng dòng
 *                 text chỉ đọc "Uploading to: {album.title}".
 *              2. Tags đổi từ input text thô (tách bằng dấu phẩy) sang
 *                 dạng "chip" — đúng bản chất cột images.tags là JSONB
 *                 mảng string, không phải 1 chuỗi. Gõ rồi Enter/dấu phẩy
 *                 để tạo chip, bấm X để xóa từng chip.
 *              3. Privacy level thêm mô tả ngắn dưới mỗi lựa chọn, khớp
 *                 đúng ý nghĩa cột images.privacy_level (CHECK 0/1/2).
 * @owner AG-04
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Album } from '../../entities/media_entities'
import type { useUploadController } from '../../routers/upload_routers'
import { UploadQueueItemCard } from './UploadQueueItemCard'

type UploadControllerState = ReturnType<typeof useUploadController>

interface BulkUploadModalProps {
    isOpen: boolean
    onClose: () => void
    albums: Album[]
    defaultAlbumId?: number
    uploadState: UploadControllerState
    onEnqueueFiles: (
        files: File[],
        albumId: number,
        privacyLevel: 0 | 1 | 2,
        tags?: string[]
    ) => Promise<string[]>
    onCancelFile: (uploadId: string) => void
    onRetryFile: (uploadId: string) => void
    onClearQueue: () => void
    onUploadSuccess?: (imageIds: string[]) => void
}

const PRIVACY_OPTIONS: { value: 0 | 1 | 2; label: string; description: string }[] = [
    { value: 0, label: 'Private', description: 'Only you can see this' },
    { value: 1, label: 'Friends', description: 'Only your friends can see this' },
    { value: 2, label: 'Public', description: 'Everyone can see this' },
]

export function BulkUploadModal({
    isOpen,
    onClose,
    albums,
    defaultAlbumId,
    uploadState,
    onEnqueueFiles,
    onCancelFile,
    onRetryFile,
    onClearQueue,
    onUploadSuccess,
}: BulkUploadModalProps): React.ReactElement | null {
    const [isDragActive, setIsDragActive] = useState(false)
    const [selectedPrivacy, setSelectedPrivacy] = useState<0 | 1 | 2>(2)
    const [batchError, setBatchError] = useState<string | null>(null)
    const [tags, setTags] = useState<string[]>([])
    const [tagDraft, setTagDraft] = useState('')

    const completedMarkerRef = useRef<string>('')

    const queueState = uploadState.state
    const queueItems = queueState.items

    const selectedAlbum = useMemo(
        () => albums.find((a) => a.id === defaultAlbumId),
        [albums, defaultAlbumId]
    )

    const isQueueFinished = useMemo(() => {
        return (
            queueState.totalCount > 0 &&
            queueState.pendingCount === 0 &&
            queueState.activeCount === 0 &&
            queueState.errorCount === 0
        )
    }, [queueState])

    useEffect(() => {
        if (!isQueueFinished || !onUploadSuccess) return

        const imageIds = queueItems
            .map((item) => item.uploadedImage?.image_id)
            .filter((id): id is string => typeof id === 'string')

        const marker = imageIds.join('|')
        if (marker && marker !== completedMarkerRef.current) {
            completedMarkerRef.current = marker
            onUploadSuccess(imageIds)
        }
    }, [isQueueFinished, onUploadSuccess, queueItems])

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
            // Xóa chip cuối cùng khi bấm Backspace trên ô input rỗng —
            // hành vi quen thuộc của UI chip-input.
            setTags((prev) => prev.slice(0, -1))
        }
    }

    const enqueue = async (files: File[]) => {
        if (!defaultAlbumId) {
            setBatchError('Please select an album first.')
            return
        }
        if (files.length === 0) {
            setBatchError('Please choose at least one file.')
            return
        }

        try {
            setBatchError(null)
            completedMarkerRef.current = ''
            await onEnqueueFiles(files, defaultAlbumId, selectedPrivacy, tags.length > 0 ? tags : undefined)
        } catch (error) {
            setBatchError(error instanceof Error ? error.message : 'Failed to enqueue files.')
        }
    }

    const onInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files
        if (!fileList) return
        await enqueue(Array.from(fileList))
        event.target.value = ''
    }

    const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        setIsDragActive(false)
        const files = Array.from(event.dataTransfer.files ?? [])
        await enqueue(files)
    }

    if (!isOpen) return null

    return (
        <div
            role="dialog"
            aria-modal="true"
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
                style={{
                    width: '100%',
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 'var(--spacing-lg)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--spacing-base)',
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--text-heading-h4-size)',
                        }}
                    >
                        Bulk Upload
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{
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
                </div>

                {/* SỬA: bỏ dropdown chọn album — chỉ đọc, đã chọn sẵn qua
                    AlbumStrip ở UploadPage. */}
                <p
                    style={{
                        margin: '0 0 var(--spacing-base) 0',
                        fontSize: 'var(--text-body-sm-size)',
                        color: 'var(--color-text-secondary)',
                    }}
                >
                    Uploading to:{' '}
                    <span style={{ color: 'var(--color-brand-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                        {selectedAlbum?.title ?? 'Unknown album'}
                    </span>
                </p>

                <div style={{ marginBottom: 'var(--spacing-base)' }}>
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
                            const isSelected = option.value === selectedPrivacy
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setSelectedPrivacy(option.value)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        gap: 'var(--spacing-xs)',
                                        padding: 'var(--spacing-sm) var(--spacing-base)',
                                        borderRadius: 'var(--radius-base)',
                                        border: `1px solid ${isSelected ? 'var(--color-brand-primary)' : 'var(--color-border-light)'}`,
                                        backgroundColor: isSelected ? 'var(--color-bg-secondary)' : 'var(--color-bg-primary)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 'var(--text-body-sm-size)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            color: isSelected ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                                        }}
                                    >
                                        {option.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 'var(--text-body-xs-size)',
                                            color: 'var(--color-text-secondary)',
                                        }}
                                    >
                                        {option.description}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* SỬA: tags dạng chip thay vì input text thô — đúng bản
                    chất images.tags là JSONB mảng string. */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-base)' }}>
                    <span style={{ fontSize: 'var(--text-ui-label-size)', color: 'var(--color-text-secondary)' }}>
                        Tags (optional — press Enter or comma to add)
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
                            placeholder={tags.length === 0 ? 'nature, sunset, family' : ''}
                            style={{
                                flex: 1,
                                minWidth: '120px',
                                border: 'none',
                                outline: 'none',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-primary)',
                                fontSize: 'var(--text-body-sm-size)',
                            }}
                        />
                    </div>
                </label>

                <div
                    onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragActive(true)
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={onDrop}
                    style={{
                        border: `2px dashed ${
                            isDragActive ? 'var(--color-brand-primary)' : 'var(--color-border-medium)'
                        }`,
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-lg)',
                        textAlign: 'center',
                        marginBottom: 'var(--spacing-base)',
                        backgroundColor: isDragActive
                            ? 'var(--color-bg-tertiary)'
                            : 'var(--color-bg-secondary)',
                    }}
                >
                    <p
                        style={{
                            margin: '0 0 var(--spacing-sm) 0',
                            color: 'var(--color-text-secondary)',
                        }}
                    >
                        Drag & drop files here
                    </p>
                    <input
                        type="file"
                        multiple
                        onChange={onInputChange}
                        style={{
                            border: '1px solid var(--color-border-light)',
                            borderRadius: 'var(--radius-base)',
                            padding: 'var(--spacing-sm)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                        }}
                    />
                </div>

                {batchError && (
                    <p
                        style={{
                            margin: '0 0 var(--spacing-base) 0',
                            color: 'var(--color-semantic-error)',
                            fontSize: 'var(--text-body-sm-size)',
                        }}
                    >
                        {batchError}
                    </p>
                )}

                <div
                    style={{
                        marginBottom: 'var(--spacing-base)',
                        display: 'flex',
                        gap: 'var(--spacing-base)',
                        flexWrap: 'wrap',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--text-body-sm-size)',
                    }}
                >
                    <span>Total: {queueState.totalCount}</span>
                    <span>Pending: {queueState.pendingCount}</span>
                    <span>Active: {queueState.activeCount}</span>
                    <span>Done: {queueState.doneCount}</span>
                    <span>Error: {queueState.errorCount}</span>
                </div>

                <div style={{ display: 'grid', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-base)' }}>
                    {queueItems.map((item) => (
                        <UploadQueueItemCard
                            key={item.uploadId}
                            item={item}
                            onRetry={() => onRetryFile(item.uploadId)}
                            onCancel={() => onCancelFile(item.uploadId)}
                        />
                    ))}
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <button
                        type="button"
                        onClick={onClearQueue}
                        style={{
                            border: '1px solid var(--color-border-medium)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            borderRadius: 'var(--radius-base)',
                            padding: 'var(--spacing-sm) var(--spacing-base)',
                            cursor: 'pointer',
                        }}
                    >
                        Clear Queue
                    </button>

                    {isQueueFinished && (
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                border: 'none',
                                backgroundColor: 'var(--color-brand-primary)',
                                color: 'var(--color-text-inverted)',
                                borderRadius: 'var(--radius-base)',
                                padding: 'var(--spacing-sm) var(--spacing-base)',
                                cursor: 'pointer',
                            }}
                        >
                            Done & Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}