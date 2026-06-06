/**
 * @file media_routers.tsx
 * @layer routers
 * @description Media dashboard router: gallery + bulk drag-drop upload modal
 *              T004-04: Bulk upload with queue UI, progress bars, retry controls
 * @owner AG-04
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useMediaGallery, useMediaUpload } from '@/services/media_services';
import { useBulkUploadQueue } from '@/services/bulk_media_services';
import { mediaAdapter } from '@/adapters/media_adapters';
import { PrivacyLevel, MediaItem, Album } from '@/entities/media_entities';
import { MEDIA_CONFIG } from '@/configs/media_configs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DragDropUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    albums: Album[];
    defaultAlbumId?: number;
    onUploadSuccess?: (imageIds: string[]) => void;
}

// ============================================================================
// COMPONENT: BulkUploadQueueItem UI Card
// ============================================================================

function UploadQueueItemCard({
    item,
    onRetry,
    onCancel,
}: {
    item: any; // BulkUploadQueueItem from hook
    onRetry: () => void;
    onCancel: () => void;
}) {
    const progressPercent =
        item.progress.total > 0
            ? Math.round((item.progress.loaded / item.progress.total) * 100)
            : 0;

    const statusColor =
        item.state === 'done'
            ? 'text-green-600'
            : item.state === 'error' || item.state === 'cancelled'
                ? 'text-red-600'
                : 'text-blue-600';

    const statusLabel =
        item.state === 'pending'
            ? 'Queued'
            : item.state === 'presigning'
                ? 'Preparing...'
                : item.state === 'uploading'
                    ? 'Uploading...'
                    : item.state === 'confirming'
                        ? 'Confirming...'
                        : item.state === 'done'
                            ? 'Complete'
                            : item.state === 'error'
                                ? 'Failed'
                                : 'Cancelled';

    return (
        <div className="flex items-center gap-3 border rounded p-3 bg-white">
            {/* File Icon + Name */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                <p className={`text-xs ${statusColor}`}>{statusLabel}</p>
                {item.error && <p className="text-xs text-red-500 mt-1">{item.error.message}</p>}
            </div>

            {/* Progress Bar */}
            {(item.state === 'uploading' || item.state === 'presigning') && (
                <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {item.state === 'error' && (
                    <button
                        onClick={onRetry}
                        className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                )}
                {(item.state === 'pending' ||
                    item.state === 'presigning' ||
                    item.state === 'uploading' ||
                    item.state === 'confirming') && (
                        <button
                            onClick={onCancel}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600"
                        >
                            Stop
                        </button>
                    )}
            </div>
        </div>
    );
}

// ============================================================================
// COMPONENT: Drag-Drop Upload Modal
// ============================================================================

function BulkUploadModal({
    isOpen,
    onClose,
    albums,
    defaultAlbumId,
    onUploadSuccess,
}: DragDropUploadModalProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [selectedAlbumId, setSelectedAlbumId] = useState<number | undefined>(defaultAlbumId);
    const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyLevel>(
        PrivacyLevel.PUBLIC
    );
    const [batchError, setBatchError] = useState<string | null>(null);
    const dragCounterRef = useRef(0);

    const { state, enqueueFiles, cancelFile, retryFile, clearQueue } =
        useBulkUploadQueue({
            maxConcurrency: MEDIA_CONFIG.bulkUpload.maxConcurrentUploads,
            maxRetries: MEDIA_CONFIG.bulkUpload.maxRetries,
            maxFiles: MEDIA_CONFIG.bulkUpload.maxFilesPerBatch,
        });

    // ========================================================================
    // HANDLER: Drag Enter
    // ========================================================================

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current += 1;
        setIsDragActive(true);
    }, []);

    // ========================================================================
    // HANDLER: Drag Leave
    // ========================================================================

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current === 0) {
            setIsDragActive(false);
        }
    }, []);

    // ========================================================================
    // HANDLER: Drag Over
    // ========================================================================

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // ========================================================================
    // HANDLER: Drop
    // ========================================================================

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);
            dragCounterRef.current = 0;
            setBatchError(null);

            if (!selectedAlbumId) {
                setBatchError('Please select an album before uploading.');
                return;
            }

            const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
                file.type.startsWith('image/')
            );

            if (droppedFiles.length === 0) {
                setBatchError('No image files detected. Please drop image files only.');
                return;
            }

            try {
                await enqueueFiles(droppedFiles, selectedAlbumId, selectedPrivacy);
            } catch (error: any) {
                setBatchError(error.message || 'Failed to queue files.');
            }
        },
        [selectedAlbumId, selectedPrivacy, enqueueFiles]
    );

    // ========================================================================
    // HANDLER: File Input (fallback for non-drag browsers)
    // ========================================================================

    const handleFileInputChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            setBatchError(null);

            if (!selectedAlbumId) {
                setBatchError('Please select an album before uploading.');
                return;
            }

            const selectedFiles = Array.from(e.target.files || []);
            if (selectedFiles.length === 0) return;

            try {
                await enqueueFiles(selectedFiles, selectedAlbumId, selectedPrivacy);
            } catch (error: any) {
                setBatchError(error.message || 'Failed to queue files.');
            }

            // Reset input
            e.target.value = '';
        },
        [selectedAlbumId, selectedPrivacy, enqueueFiles]
    );

    // ========================================================================
    // HANDLER: Close Modal
    // ========================================================================

    const handleClose = useCallback(() => {
        clearQueue();
        setBatchError(null);
        onClose();
    }, [clearQueue, onClose]);

    // ========================================================================
    // HANDLER: Confirm & Close (after all complete)
    // ========================================================================

    const isQueueDone = state.totalCount > 0 && state.uploadingCount === 0 && state.pendingCount === 0;

    const handleConfirmClose = useCallback(() => {
        const successImageIds = state.items
            .filter((i) => i.state === 'done' && i.uploadedImage)
            .map((i) => i.uploadedImage?.image_id || i.uploadId);

        if (onUploadSuccess && successImageIds.length > 0) {
            onUploadSuccess(successImageIds);
        }

        handleClose();
    }, [state.items, onUploadSuccess, handleClose]);

    if (!isOpen) return null;

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-lg flex flex-col">
                {/* HEADER */}
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-xl font-bold">Bulk Upload Images</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* ALBUM & PRIVACY SELECTOR */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Album
                            </label>
                            <select
                                value={selectedAlbumId || ''}
                                onChange={(e) =>
                                    setSelectedAlbumId(e.target.value ? parseInt(e.target.value) : undefined)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pinterest"
                            >
                                <option value="">-- Select Album --</option>
                                {albums.map((album) => (
                                    <option key={album.id} value={album.id}>
                                        {album.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Privacy
                            </label>
                            <select
                                value={selectedPrivacy}
                                onChange={(e) =>
                                    setSelectedPrivacy(parseInt(e.target.value) as PrivacyLevel)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pinterest"
                            >
                                <option value={PrivacyLevel.PRIVATE}>
                                    Private {MEDIA_CONFIG.privacy.icons[PrivacyLevel.PRIVATE]}
                                </option>
                                <option value={PrivacyLevel.FRIENDS}>
                                    Friends {MEDIA_CONFIG.privacy.icons[PrivacyLevel.FRIENDS]}
                                </option>
                                <option value={PrivacyLevel.PUBLIC}>
                                    Public {MEDIA_CONFIG.privacy.icons[PrivacyLevel.PUBLIC]}
                                </option>
                            </select>
                        </div>
                    </div>

                    {/* ERROR MESSAGE */}
                    {batchError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {batchError}
                        </div>
                    )}

                    {/* DRAG-DROP ZONE (when queue is empty) */}
                    {state.totalCount === 0 && (
                        <div
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded p-8 text-center transition-colors ${isDragActive ? 'border-pinterest bg-red-50' : 'border-gray-300 bg-gray-50'
                                }`}
                        >
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                />
                            </svg>
                            <p className="text-gray-600 font-medium mb-2">
                                Drag and drop images here
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                or click to select (max {MEDIA_CONFIG.upload.maxFileSizeMb}MB per file, up to{' '}
                                {MEDIA_CONFIG.bulkUpload.maxFilesPerBatch} files)
                            </p>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFileInputChange}
                                className="hidden"
                                id="file-input"
                            />
                            <label
                                htmlFor="file-input"
                                className="inline-block px-4 py-2 bg-pinterest text-white text-sm font-medium rounded hover:bg-red-700 cursor-pointer"
                            >
                                Browse Files
                            </label>
                        </div>
                    )}

                    {/* UPLOAD QUEUE LIST */}
                    {state.totalCount > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                                <span className="text-sm font-medium text-blue-900">
                                    {state.pendingCount > 0
                                        ? `Uploading: ${state.doneCount + (state.uploadingCount > 0 ? state.uploadingCount : 0)} of ${state.totalCount}`
                                        : `Completed: ${state.doneCount} of ${state.totalCount}`}
                                </span>
                                {state.errorCount > 0 && (
                                    <span className="text-sm font-medium text-red-600">{state.errorCount} failed</span>
                                )}
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {state.items.map((item) => (
                                    <UploadQueueItemCard
                                        key={item.uploadId}
                                        item={item}
                                        onRetry={() => retryFile(item.uploadId)}
                                        onCancel={() => cancelFile(item.uploadId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="border-t p-4 flex gap-3 justify-end">
                    {isQueueDone ? (
                        <button
                            onClick={handleConfirmClose}
                            className="px-4 py-2 bg-green-500 text-white font-medium rounded hover:bg-green-600"
                        >
                            Done & Close
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50"
                            >
                                {state.uploadingCount > 0 ? 'Stop & Close' : 'Close'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// PAGE: Dashboard with Bulk Upload Integration
// ============================================================================

export function DashboardPage() {
    const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
    const [selectedAlbumId, setSelectedAlbumId] = useState<number | undefined>();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [albumsLoading, setAlbumsLoading] = useState(false);

    const {
        items: galleryItems,
        loading: galleryLoading,
        error: galleryError,
        pagination,
        setPage,
        refetch,
        setAlbumId,
    } = useMediaGallery(selectedAlbumId);

    // ========================================================================
    // Fetch albums on mount
    // ========================================================================

    useEffect(() => {
        setAlbumsLoading(true);
        mediaAdapter
            .getAlbumList()
            .then(setAlbums)
            .catch((err) => console.error('Failed to load albums:', err))
            .finally(() => setAlbumsLoading(false));
    }, []);

    // ========================================================================
    // HANDLER: Upload Success (refresh gallery)
    // ========================================================================

    const handleBulkUploadSuccess = (imageIds: string[]) => {
        console.log(`Successfully uploaded ${imageIds.length} images`, imageIds);
        // Refresh gallery to show new images
        refetch();
        setBulkUploadModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* HEADER */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Media Gallery</h1>
                        <button
                            onClick={() => setBulkUploadModalOpen(true)}
                            className="px-4 py-2 bg-pinterest text-white font-medium rounded hover:bg-red-700"
                        >
                            Bulk Upload
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex gap-4">
                    <select
                        value={selectedAlbumId || ''}
                        onChange={(e) => {
                            const albumId = e.target.value ? parseInt(e.target.value) : undefined;
                            setSelectedAlbumId(albumId);
                            setAlbumId(albumId);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pinterest"
                        disabled={albumsLoading}
                    >
                        <option value="">-- All Albums --</option>
                        {albums.map((album) => (
                            <option key={album.id} value={album.id}>
                                {album.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* GALLERY */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {galleryError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                        {galleryError.message}
                    </div>
                )}

                {galleryLoading && <p className="text-gray-600">Loading...</p>}

                {!galleryLoading && galleryItems.length === 0 && (
                    <p className="text-gray-600 text-center py-8">No images yet.</p>
                )}

                {galleryItems.length > 0 && (
                    <>
                        {/* MASONRY GRID */}
                        <div className={MEDIA_CONFIG.masonry.gridClass}>
                            {galleryItems.map((item) => (
                                <div key={item.id} className="break-inside-avoid">
                                    <ImageCard item={item} />
                                </div>
                            ))}
                        </div>

                        {/* PAGINATION */}
                        <div className="flex gap-2 justify-center mt-8">
                            <button
                                onClick={() => setPage(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-2 border rounded disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-2">Page {pagination.currentPage}</span>
                            <button
                                onClick={() => setPage(pagination.currentPage + 1)}
                                disabled={!pagination.hasNext}
                                className="px-3 py-2 border rounded disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* BULK UPLOAD MODAL */}
            <BulkUploadModal
                isOpen={bulkUploadModalOpen}
                onClose={() => setBulkUploadModalOpen(false)}
                albums={albums}
                defaultAlbumId={selectedAlbumId}
                onUploadSuccess={handleBulkUploadSuccess}
            />
        </div>
    );
}

// ============================================================================
// COMPONENT: Image Card (extracted component)
// ============================================================================

function ImageCard({ item }: { item: MediaItem }) {
    const [imageLoadFailed, setImageLoadFailed] = useState(false);

    const aspectRatio = item.width && item.height ? item.width / item.height : 1;

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div
                className="relative bg-gray-200 overflow-hidden"
                style={{ aspectRatio }}
            >
                {!imageLoadFailed ? (
                    <img
                        src={item.minio_url}
                        alt={item.tags?.join(', ') || 'Image'}
                        className="w-full h-full object-cover"
                        onError={() => setImageLoadFailed(true)}
                        onLoad={() => setImageLoadFailed(false)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-red-50">
                        <p className="text-sm text-red-600">Failed to load image</p>
                    </div>
                )}

                {/* INDEX STATUS BADGE */}
                {item.index_status && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
                        {MEDIA_CONFIG.indexStatusLabels[
                            item.index_status as keyof typeof MEDIA_CONFIG.indexStatusLabels
                        ] || item.index_status}
                    </div>
                )}

                {/* PRIVACY ICON */}
                {item.privacy_level !== undefined && (
                    <div className="absolute bottom-2 left-2 text-lg">
                        {MEDIA_CONFIG.privacy.icons[
                            item.privacy_level as keyof typeof MEDIA_CONFIG.privacy.icons
                        ] || ''}
                    </div>
                )}
            </div>

            {/* METADATA */}
            <div className="p-3">
                {item.tags && item.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                        {item.tags.slice(0, 3).map((tag: string) => (
                            <span
                                key={tag}
                                className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
}

export default DashboardPage;