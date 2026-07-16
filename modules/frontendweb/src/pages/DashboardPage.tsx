import React, { useMemo, useState } from 'react'
import { useMediaGalleryController, useAlbumListController } from '../routers/media_routers'
import { useUploadController } from '../routers/upload_routers'
import { BulkUploadModal } from '../components/upload/BulkUploadModal'
import { ImageCard } from '../components/media/ImageCard'

export function DashboardPage(): React.ReactElement {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [selectedAlbumId, setSelectedAlbumId] = useState<number | undefined>(undefined)

    const mediaController = useMediaGalleryController(selectedAlbumId)
    const albumController = useAlbumListController()
    const uploadController = useUploadController()

    // SỬA: useAlbumListController() trả đúng UseAlbumListActions (field
    // "items", KHÔNG PHẢI "albums") — đã xác nhận qua media_services.ts.
    // Bỏ shape "mềm" đoán 2 khả năng (albums ?? items), dùng thẳng field
    // thật để TypeScript tự bắt lỗi nếu sau này API đổi, thay vì âm thầm
    // fallback sai.
    const albums = albumController.items

    const { offset, limit, total } = mediaController.pagination
    const start = total === 0 ? 0 : offset + 1
    const end = total === 0 ? 0 : Math.min(offset + limit, total)

    const handleAlbumFilterChange = (value: string) => {
        const nextAlbumId = value ? Number(value) : undefined
        setSelectedAlbumId(nextAlbumId)
        mediaController.setAlbumId(nextAlbumId)
    }

    const handleUploadSuccess = async () => {
        await mediaController.refetch()
        setIsUploadModalOpen(false)
    }

    return (
        <main
            style={{
                minHeight: '100vh',
                backgroundColor: 'var(--color-bg-secondary)',
                padding: 'var(--spacing-xl)',
            }}
        >
            <section
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-lg)',
                }}
            >
                <header
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--spacing-base)',
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--text-heading-h3-size)',
                        }}
                    >
                        Dashboard
                    </h1>

                    <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        style={{
                            border: 'none',
                            backgroundColor: 'var(--color-brand-primary)',
                            color: 'var(--color-text-inverted)',
                            borderRadius: 'var(--radius-base)',
                            padding: 'var(--spacing-sm) var(--spacing-base)',
                            cursor: 'pointer',
                            fontSize: 'var(--text-ui-button-size)',
                            fontWeight: 'var(--text-ui-button-weight)',
                        }}
                    >
                        Bulk Upload
                    </button>
                </header>

                <section
                    style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-base)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 'var(--spacing-base)',
                        flexWrap: 'wrap',
                    }}
                >
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-body-sm-size)' }}>
                            Filter by album:
                        </span>
                        <select
                            value={selectedAlbumId ?? ''}
                            onChange={(e) => handleAlbumFilterChange(e.target.value)}
                            style={{
                                border: '1px solid var(--color-border-light)',
                                borderRadius: 'var(--radius-base)',
                                padding: 'var(--spacing-sm)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                            }}
                        >
                            <option value="">All albums</option>
                            {albums.map((album) => (
                                <option key={album.id} value={album.id}>
                                    {album.title}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--text-body-sm-size)',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => mediaController.setOffset(Math.max(0, offset - limit))}
                            disabled={offset === 0}
                            style={{
                                border: '1px solid var(--color-border-medium)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                                borderRadius: 'var(--radius-base)',
                                padding: 'var(--spacing-sm) var(--spacing-base)',
                                cursor: offset === 0 ? 'not-allowed' : 'pointer',
                                opacity: offset === 0 ? 0.6 : 1,
                            }}
                        >
                            Prev
                        </button>

                        <span>
                            Showing {start}–{end} of {total}
                        </span>

                        <button
                            type="button"
                            onClick={() => mediaController.setOffset(offset + limit)}
                            disabled={offset + limit >= total}
                            style={{
                                border: '1px solid var(--color-border-medium)',
                                backgroundColor: 'var(--color-bg-primary)',
                                color: 'var(--color-text-primary)',
                                borderRadius: 'var(--radius-base)',
                                padding: 'var(--spacing-sm) var(--spacing-base)',
                                cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
                                opacity: offset + limit >= total ? 0.6 : 1,
                            }}
                        >
                            Next
                        </button>
                    </div>
                </section>

                {mediaController.error && (
                    <p
                        style={{
                            margin: 0,
                            color: 'var(--color-semantic-error)',
                            fontSize: 'var(--text-body-sm-size)',
                        }}
                    >
                        {mediaController.error.message}
                    </p>
                )}

                {albumController.error && (
                    <p
                        style={{
                            margin: 0,
                            color: 'var(--color-semantic-error)',
                            fontSize: 'var(--text-body-sm-size)',
                        }}
                    >
                        {albumController.error.message}
                    </p>
                )}

                {mediaController.loading ? (
                    <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Loading gallery...</p>
                ) : (
                    <section
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: 'var(--spacing-base)',
                        }}
                    >
                        {mediaController.items.map((item) => (
                            <ImageCard key={item.image_id} item={item} />
                        ))}
                    </section>
                )}
            </section>

            <BulkUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                albums={albums}
                defaultAlbumId={selectedAlbumId}
                uploadState={uploadController}
                onEnqueueFiles={uploadController.enqueueFiles}
                onCancelFile={uploadController.cancelFile}
                onRetryFile={uploadController.retryFile}
                onClearQueue={uploadController.clearQueue}
                onUploadSuccess={handleUploadSuccess}
            />
        </main>
    )
}