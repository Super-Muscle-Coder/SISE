// src/routers/media_routers.tsx
// React components for T004-03: Dashboard, ImageCard with status polling, UploadModal, DetailModal
// Strict TypeScript, zero utils, responsive Tailwind masonry

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  MediaItem,
  Album,
  PrivacyLevel,
  IndexStatus,
  ImageMetadata,
} from '@/entities/media_entities';
import { MEDIA_CONFIG } from '@/configs/media_configs';
import {
  useMediaGallery,
  useMediaUpload,
  useImageStatusPolling,
} from '@/services/media_services';
import { mediaAdapter } from '@/adapters/media_adapters';

// ============================================================================
// IMAGE CARD COMPONENT with embedded local polling (Q2 Decision)
// ============================================================================

interface ImageCardProps {
  item: MediaItem;
  onDelete: (imageId: string) => void;
  onMetadataUpdate: (imageId: string) => void;
  onShowDetail: (imageId: string) => void;
}

function ImageCard({
  item,
  onDelete,
  onMetadataUpdate,
  onShowDetail,
}: ImageCardProps): React.ReactElement {
  const { imageMetadata, loading, error, isFinalized, pollRetries, manualRefresh } =
    useImageStatusPolling(item.id);

  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Q1: Dynamic aspect-ratio with fallback to 4:3 for corrupted metadata
  const aspectRatio = useMemo(() => {
    if (item.width && item.height && item.width > 0 && item.height > 0) {
      return item.width / item.height;
    }
    // Fallback: 4:3 aspect ratio (common photo standard)
    return 4 / 3;
  }, [item.width, item.height]);

  const aspectStyle: React.CSSProperties = {
    aspectRatio: aspectRatio,
  };

  // Determine status badge display logic (Q6)
  const getStatusContent = (): React.ReactNode => {
    const status = imageMetadata?.index_status || item.index_status;

    if (status === IndexStatus.PENDING || status === IndexStatus.PROCESSING) {
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-gray-700">
          <div className="animate-spin w-3 h-3 border-2 border-gray-300 border-t-gray-700 rounded-full" />
          {MEDIA_CONFIG.indexStatusLabels.processing}
        </div>
      );
    }

    if (status === IndexStatus.FAILED) {
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-red-700">
          <span>❌</span>
          {MEDIA_CONFIG.indexStatusLabels.failed}
        </div>
      );
    }

    if (status === IndexStatus.TIMEOUT_RETRY) {
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-amber-700">
          <span>⏱️</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              manualRefresh();
            }}
            className="underline hover:no-underline"
          >
            {MEDIA_CONFIG.indexStatusLabels.timeout_retry}
          </button>
        </div>
      );
    }

    // READY status: show nothing (badge fades, image fully visible)
    return null;
  };

  // Render card
  return (
    <div
      onClick={() => onShowDetail(item.id)}
      className="cursor-pointer break-inside-avoid rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onShowDetail(item.id);
        }
      }}
    >
      {/* Image Container with Aspect Ratio */}
      <div
        style={aspectStyle}
        className="relative bg-gray-200 overflow-hidden flex items-center justify-center"
      >
        {loading && !imageMetadata ? (
          // Skeleton Loader
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        ) : error || !item.minio_url || imageLoadFailed ? (
          // Error State with user-facing message
          <div
            className={`absolute inset-0 ${MEDIA_CONFIG.imageCard.errorBg} flex flex-col items-center justify-center gap-1`}
          >
            <span className="text-2xl">⚠️</span>
            <span className="text-xs text-gray-600 text-center px-2">
              {imageLoadFailed ? 'Image failed to load' : 'Unable to fetch image'}
            </span>
          </div>
        ) : (
          // Image Load with error handling
          <img
            src={item.minio_url}
            alt={`Media item ${item.id}`}
            className="w-full h-full object-cover"
            onError={() => {
              // Mark as failed and preserve space via aspect-ratio
              setImageLoadFailed(true);
            }}
            onLoad={() => {
              // Only clear error state on successful load
              setImageLoadFailed(false);
            }}
          />
        )}

        {/* Status Badge Overlay (Q6) */}
        {getStatusContent() && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            {getStatusContent()}
          </div>
        )}

        {/* Privacy Badge (Top-Right) */}
        <div className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
          {MEDIA_CONFIG.privacyIcons[item.privacy_level as keyof typeof MEDIA_CONFIG.privacyIcons] || '❓'}
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="p-2 bg-white text-xs text-gray-600">
        <div className="font-semibold text-gray-800 truncate">
          {item.album_id ? `Album #${item.album_id}` : 'No Album'}
        </div>
        <div className="text-gray-500 truncate">
          {new Date(item.created_at).toLocaleDateString()}
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                {tag}
              </span>
            ))}
            {item.tags.length > 2 && <span className="text-gray-500 text-xs">+{item.tags.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UPLOAD MODAL COMPONENT
// ============================================================================

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (imageId: string) => void;
  albums: Album[];
}

function UploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  albums,
}: UploadModalProps): React.ReactElement | null {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadFile,
    uploadProgress,
    currentFile,
    uploadError,
    imageIdRegistered,
    indexStatus,
    isUploading,
    cancel,
    resetState,
  } = useMediaUpload();

  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(
    albums.length > 0 ? albums[0].id : null,
  );
  const [selectedPrivacy, setSelectedPrivacy] = useState<PrivacyLevel>(PrivacyLevel.PRIVATE);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFilePicked = useCallback(
    async (file: File) => {
      try {
        const imageId = await uploadFile(file, selectedAlbumId, selectedPrivacy);
        onUploadSuccess(imageId);
        resetState();
        onClose();
      } catch (err) {
        // Error already in state.uploadError
      }
    },
    [uploadFile, selectedAlbumId, selectedPrivacy, onUploadSuccess, resetState, onClose],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragActive(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFilePicked(files[0]);
      }
    },
    [handleFilePicked],
  );

  const handleCancel = useCallback(() => {
    cancel();
    resetState();
    onClose();
  }, [cancel, resetState, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Image</h2>

        {!currentFile ? (
          // File Selection UI
          <>
            <div
              onDragOver={() => setIsDragActive(true)}
              onDragLeave={() => setIsDragActive(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={MEDIA_CONFIG.upload.allowedMimeTypes.join(',')}
                className="hidden"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) handleFilePicked(file);
                }}
              />
              <span className="text-4xl">📤</span>
              <p className="text-gray-600 text-sm mt-2">
                Drag & drop or click to select image
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Max {MEDIA_CONFIG.upload.maxFileSizeMb}MB • JPEG/PNG only
              </p>
            </div>

            {/* Album & Privacy Selection */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Album</label>
                <select
                  value={selectedAlbumId || ''}
                  onChange={(e) => setSelectedAlbumId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Album</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Level</label>
                <select
                  value={selectedPrivacy}
                  onChange={(e) => setSelectedPrivacy(parseInt(e.target.value, 10) as PrivacyLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={PrivacyLevel.PRIVATE}>
                    🔒 {MEDIA_CONFIG.privacyLabels[PrivacyLevel.PRIVATE]}
                  </option>
                  <option value={PrivacyLevel.FRIENDS}>
                    👥 {MEDIA_CONFIG.privacyLabels[PrivacyLevel.FRIENDS]}
                  </option>
                  <option value={PrivacyLevel.PUBLIC}>
                    🌐 {MEDIA_CONFIG.privacyLabels[PrivacyLevel.PUBLIC]}
                  </option>
                </select>
              </div>
            </div>
          </>
        ) : (
          // Upload Progress UI
          <>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">{currentFile.name}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>

              {indexStatus && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  Status: {MEDIA_CONFIG.indexStatusLabels[indexStatus] || indexStatus}
                </div>
              )}

              {uploadError && (
                <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
                  {uploadError.message}
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={handleCancel}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Cancel'}
          </button>
          {currentFile && isUploading && (
            <button
              onClick={() => cancel()}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// IMAGE DETAIL MODAL COMPONENT
// ============================================================================

interface ImageDetailModalProps {
  imageId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (imageId: string) => void;
  onRefresh: () => void;
}

function ImageDetailModal({
  imageId,
  isOpen,
  onClose,
  onDelete,
  onRefresh,
}: ImageDetailModalProps): React.ReactElement | null {
  const [metadata, setMetadata] = React.useState<ImageMetadata | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!isOpen || !imageId) return;

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await mediaAdapter.getImageMetadata(imageId);
        setMetadata(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [isOpen, imageId]);

  if (!isOpen || !imageId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Image Details</h2>

        {loading ? (
          <div className="text-center text-gray-500">Loading…</div>
        ) : error ? (
          <div className="p-3 bg-red-50 rounded text-red-700 text-sm">{error.message}</div>
        ) : metadata ? (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Image ID:</span>
              <code className="text-gray-600 font-mono text-xs break-all">{metadata.id}</code>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Privacy:</span>
              <span>
                {MEDIA_CONFIG.privacyIcons[metadata.privacy_level]} {MEDIA_CONFIG.privacyLabels[metadata.privacy_level]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Album:</span>
              <span>{metadata.album_id ? `#${metadata.album_id}` : 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Status:</span>
              <span>{MEDIA_CONFIG.indexStatusLabels[metadata.index_status]}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Created:</span>
              <span>{new Date(metadata.created_at).toLocaleString()}</span>
            </div>
            {metadata.tags.length > 0 && (
              <div className="py-2 border-t border-gray-200">
                <span className="font-medium text-gray-700 block mb-1">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {metadata.tags.map((tag) => (
                    <span key={tag} className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => {
              onDelete(imageId);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD PAGE COMPONENT (Main Entry Point)
// ============================================================================

export function DashboardPage(): React.ReactElement {
  const { items, loading, error, pagination, setPage, setAlbumId } = useMediaGallery();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalImageId, setDetailModalImageId] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<number | undefined>();

  // Fetch albums on mount (Q7: minimal album selection)
  React.useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const data = await mediaAdapter.getAlbumList();
        setAlbums(data);
      } catch (err) {
        console.error('Failed to fetch albums:', err);
      }
    };
    fetchAlbums();
  }, []);

  const handleUploadSuccess = useCallback(
    (imageId: string) => {
      // Refresh gallery to show newly uploaded item
      setPage(1);
    },
    [setPage],
  );

  const handleDeleteImage = useCallback(
    async (imageId: string) => {
      try {
        await mediaAdapter.deleteImage(imageId);
        setPage(1); // Refresh
      } catch (err) {
        console.error('Delete failed:', err);
      }
    },
    [setPage],
  );

  const handleAlbumFilterChange = useCallback(
    (albumId: number | undefined) => {
      setSelectedAlbumFilter(albumId);
      setAlbumId(albumId);
      setPage(1);
    },
    [setAlbumId, setPage],
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Gallery</h1>
        <p className="text-gray-600 text-sm mt-1">
          Manage and organize your images
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Album Filter */}
        <select
          value={selectedAlbumFilter || ''}
          onChange={(e) => handleAlbumFilterChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Albums</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>

        {/* Upload Button */}
        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
        >
          + Upload Image
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error.message}
        </div>
      )}

      {/* Loading State */}
      {loading && items.length === 0 ? (
        <div className="text-center text-gray-500 py-12">Loading gallery…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No images yet. Upload one to get started!
        </div>
      ) : (
        <>
          {/* Masonry Grid (Q1: Vanilla CSS Columns via Tailwind) */}
          <div className={MEDIA_CONFIG.masonry.gridClass}>
            {items.map((item) => (
              <ImageCard
                key={item.id}
                item={item}
                onDelete={handleDeleteImage}
                onMetadataUpdate={() => setPage(pagination.currentPage)}
                onShowDetail={setDetailModalImageId}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {Math.ceil(pagination.totalItems / pagination.pageSize)}
            </span>
            <button
              onClick={() => setPage(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        albums={albums}
      />

      {/* Image Detail Modal */}
      <ImageDetailModal
        imageId={detailModalImageId}
        isOpen={detailModalImageId !== null}
        onClose={() => setDetailModalImageId(null)}
        onDelete={handleDeleteImage}
        onRefresh={() => setPage(pagination.currentPage)}
      />
    </div>
  );
}

export default DashboardPage;