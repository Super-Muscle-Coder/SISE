import React, { useEffect, useMemo, useRef, useState } from 'react'
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
    const [selectedAlbumId, setSelectedAlbumId] = useState<number | undefined>(defaultAlbumId)
    const [selectedPrivacy, setSelectedPrivacy] = useState<0 | 1 | 2>(2)
    const [batchError, setBatchError] = useState<string | null>(null)
    const [tagsInput, setTagsInput] = useState('')

    const completedMarkerRef = useRef<string>('')

    const queueState = uploadState.state
    const queueItems = queueState.items

    useEffect(() => {
        setSelectedAlbumId(defaultAlbumId)
    }, [defaultAlbumId])

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

    const parseTags = (): string[] | undefined => {
        const tags = tagsInput
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        return tags.length > 0 ? tags : undefined
    }

    const enqueue = async (files: File[]) => {
        if (!selectedAlbumId) {
            setBatchError('Please select an album before uploading.')
            return
        }
        if (files.length === 0) {
            setBatchError('Please choose at least one file.')
            return
        }

        try {
            setBatchError(null)
            completedMarkerRef.current = ''
            await onEnqueueFiles(files, selectedAlbumId, selectedPrivacy, parseTags())
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
                        style={{
                            border: '1px solid var(--color-border-medium)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            borderRadius: 'var(--radius-base)',
                            padding: 'var(--spacing-sm) var(--spacing-base)',
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--spacing-base)',
                        marginBottom: 'var(--spacing-base)',
                    }}
                >
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        <span style={{ fontSize: 'var(--text-ui-label-size)', color: 'var(--color-text-secondary)' }}>
                            Album
                        </span>
                        <select
                            value={selectedAlbumId ?? ''}
                            onChange={(e) =>
                                setSelectedAlbumId(
                                    e.target.value ? Number(e.target.value) : undefined
                                )
                            }
                            style={{
                                border: '1px solid var(--color-border-light)',
                                borderRadius: 'var(--radius-base)',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                            }}
                        >
                            <option value="">Select album</option>
                            {albums.map((album) => (
                                <option key={album.id} value={album.id}>
                                    {album.title}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                        <span style={{ fontSize: 'var(--text-ui-label-size)', color: 'var(--color-text-secondary)' }}>
                            Privacy
                        </span>
                        <select
                            value={selectedPrivacy}
                            onChange={(e) => setSelectedPrivacy(Number(e.target.value) as 0 | 1 | 2)}
                            style={{
                                border: '1px solid var(--color-border-light)',
                                borderRadius: 'var(--radius-base)',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                            }}
                        >
                            <option value={0}>Private</option>
                            <option value={1}>Friends</option>
                            <option value={2}>Public</option>
                        </select>
                    </label>
                </div>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-base)' }}>
                    <span style={{ fontSize: 'var(--text-ui-label-size)', color: 'var(--color-text-secondary)' }}>
                        Tags (comma separated, optional)
                    </span>
                    <input
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        placeholder="nature, sunset, family"
                        style={{
                            border: '1px solid var(--color-border-light)',
                            borderRadius: 'var(--radius-base)',
                            padding: 'var(--spacing-sm)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                        }}
                    />
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