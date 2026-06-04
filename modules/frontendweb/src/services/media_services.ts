// src/services/media_services.ts
// React hooks for media gallery, image upload orchestration, and polling
// T004-03: Single-file upload with 3-step pipeline, gallery with local polling per card

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  MediaItem,
  Album,
  ImageMetadata,
  MediaListResponse,
  PrivacyLevel,
  IndexStatus,
} from '@/entities/media_entities';
import { MEDIA_CONFIG } from '@/configs/media_configs';
import { mediaAdapter, directMinIOUploadClient } from '@/adapters/media_adapters';

// ============================================================================
// useMediaGallery: Fetch and display paginated media list
// ============================================================================

interface UseMediaGalleryState {
  items: MediaItem[];
  loading: boolean;
  error: Error | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    hasNext: boolean;
  };
}

interface UseMediaGalleryActions {
  items: MediaItem[];
  loading: boolean;
  error: Error | null;
  pagination: UseMediaGalleryState['pagination'];
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
  setAlbumId: (albumId?: number) => void;
}

export function useMediaGallery(initialAlbumId?: number): UseMediaGalleryActions {
  const [state, setState] = useState<UseMediaGalleryState>({
    items: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      pageSize: MEDIA_CONFIG.pagination.defaultPageSize,
      totalItems: 0,
      hasNext: false,
    },
  });

  const [albumId, setAlbumIdState] = useState<number | undefined>(initialAlbumId);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchMedia = useCallback(
    async (page: number = 1, album: number | undefined = albumId) => {
      // Cancel previous request if in-flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Q4: Trust backend for privacy filtering; we display whatever is returned
        const response = await mediaAdapter.getMediaList(album, page);

        setState({
          items: response.items,
          loading: false,
          error: null,
          pagination: {
            currentPage: response.meta.current_page,
            pageSize: response.meta.page_size,
            totalItems: response.meta.total_items,
            hasNext: response.meta.has_next,
          },
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Unknown error'),
        }));
      }
    },
    [albumId],
  );

  // Fetch on mount and when albumId changes
  useEffect(() => {
    fetchMedia(1, albumId);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [albumId, fetchMedia]);

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    setPage: (page: number) => fetchMedia(page, albumId),
    refetch: () => fetchMedia(state.pagination.currentPage, albumId),
    setAlbumId: (newAlbumId?: number) => setAlbumIdState(newAlbumId),
  };
}

// ============================================================================
// useMediaUpload: Single-file 3-step upload pipeline orchestrator
// ============================================================================

interface UseMediaUploadState {
  currentFile: File | null;
  uploadProgress: number; // 0-100
  uploadError: Error | null;
  imageIdRegistered: string | null; // Set after S3 (confirmation)
  indexStatus: IndexStatus | null; // Polled status
  isUploading: boolean;
  pollRetries: number;
}

export interface UseMediaUploadActions {
  uploadFile: (file: File, albumId: number | null, privacyLevel: PrivacyLevel) => Promise<string>; // Returns image_id
  uploadProgress: number;
  currentFile: File | null;
  uploadError: Error | null;
  imageIdRegistered: string | null;
  indexStatus: IndexStatus | null;
  isUploading: boolean;
  cancel: () => void;
  resetState: () => void;
}

export function useMediaUpload(): UseMediaUploadActions {
  const [state, setState] = useState<UseMediaUploadState>({
    currentFile: null,
    uploadProgress: 0,
    uploadError: null,
    imageIdRegistered: null,
    indexStatus: null,
    isUploading: false,
    pollRetries: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadFile = useCallback(
    async (file: File, albumId: number | null, privacyLevel: PrivacyLevel): Promise<string> => {
      // Reset AbortController for each new upload
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Validate file
      if (!(MEDIA_CONFIG.upload.allowedMimeTypes as readonly string[]).includes(file.type)) {
        const err = new Error(
          `Invalid file type: ${file.type}. Allowed: ${MEDIA_CONFIG.upload.allowedMimeTypes.join(', ')}`,
        );
        setState((prev) => ({ ...prev, uploadError: err }));
        throw err;
      }

      if (file.size > MEDIA_CONFIG.upload.maxFileSizeMb * 1024 * 1024) {
        const err = new Error(
          `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: ${MEDIA_CONFIG.upload.maxFileSizeMb}MB`,
        );
        setState((prev) => ({ ...prev, uploadError: err }));
        throw err;
      }

      setState({
        currentFile: file,
        uploadProgress: 0,
        uploadError: null,
        imageIdRegistered: null,
        indexStatus: null,
        isUploading: true,
        pollRetries: 0,
      });

      try {
        // ===== STEP S1: Request Presigned URL =====
        setState((prev) => ({ ...prev, uploadProgress: 10 }));
        const presignedResponse = await mediaAdapter.requestPresignedUrl(
          file.name,
          file.type,
          Math.ceil(file.size / 1024 / 1024),
        );

        // ===== STEP S2: Direct Binary PUT to MinIO =====
        setState((prev) => ({ ...prev, uploadProgress: 20 }));
        const uploadUrl = presignedResponse.upload_url;
        const objectKey = presignedResponse.object_key;

        try {
          // Pass signal for hard network abort
          await directMinIOUploadClient.uploadBinary(uploadUrl, file, (loaded, total) => {
            // Map MinIO progress to 20-80% range
            const progress = 20 + Math.floor((loaded / total) * 60);
            setState((prev) => ({ ...prev, uploadProgress: progress }));
          }, signal);
        } catch (putError) {
          // Q3: Network failure → abort gracefully, force re-select
          setState((prev) => ({
            ...prev,
            isUploading: false,
            uploadError: putError instanceof Error ? putError : new Error(String(putError)),
          }));
          throw putError;
        }

        // ===== STEP S3: Confirm Upload & Register Metadata =====
        setState((prev) => ({ ...prev, uploadProgress: 85 }));
        const confirmResponse = await mediaAdapter.confirmUpload(
          objectKey,
          albumId,
          privacyLevel,
        );

        setState((prev) => ({
          ...prev,
          imageIdRegistered: confirmResponse.image_id,
          indexStatus: IndexStatus.PENDING,
          uploadProgress: 90,
        }));

        setState((prev) => ({ ...prev, uploadProgress: 100, isUploading: false }));
        return confirmResponse.image_id;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          uploadError: err instanceof Error ? err : new Error(String(err)),
        }));
        throw err;
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    // Immediately abort network request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState((prev) => ({
      ...prev,
      isUploading: false,
      uploadProgress: 0,
    }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      currentFile: null,
      uploadProgress: 0,
      uploadError: null,
      imageIdRegistered: null,
      indexStatus: null,
      isUploading: false,
      pollRetries: 0,
    });
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    uploadFile,
    uploadProgress: state.uploadProgress,
    currentFile: state.currentFile,
    uploadError: state.uploadError,
    imageIdRegistered: state.imageIdRegistered,
    indexStatus: state.indexStatus,
    isUploading: state.isUploading,
    cancel,
    resetState,
  };
}

// ============================================================================
// useImageStatusPolling: Poll index_status inside individual ImageCard
// ============================================================================

interface UseImageStatusPollingState {
  imageMetadata: ImageMetadata | null;
  loading: boolean;
  error: Error | null;
  pollRetries: number;
}

export interface UseImageStatusPollingActions {
  imageMetadata: ImageMetadata | null;
  loading: boolean;
  error: Error | null;
  isFinalized: boolean; // true if READY or FAILED
  pollRetries: number;
  manualRefresh: () => Promise<void>;
}

export function useImageStatusPolling(imageId: string): UseImageStatusPollingActions {
  const [state, setState] = useState<UseImageStatusPollingState>({
    imageMetadata: null,
    loading: false,
    error: null,
    pollRetries: 0,
  });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Separate poll function created with stable dependencies
  const poll = useCallback(async () => {
    // Cancel previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const metadata = await mediaAdapter.getImageMetadata(imageId);
      setState((prev) => ({
        ...prev,
        imageMetadata: metadata,
        loading: false,
        error: null,
      }));

      // Stop polling if finalized (Q2: max 10 retries = 30 seconds)
      if (
        metadata.index_status === IndexStatus.READY ||
        metadata.index_status === IndexStatus.FAILED
      ) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      // Ignore abort errors (expected on unmount)
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      setState((prev) => {
        const newRetries = prev.pollRetries + 1;
        const maxRetriesExceeded =
          newRetries >= MEDIA_CONFIG.polling.maxPollRetries;

        // Stop polling on max retries
        if (maxRetriesExceeded) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }

        return {
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
          pollRetries: newRetries,
          imageMetadata: maxRetriesExceeded
            ? prev.imageMetadata
              ? {
                  ...prev.imageMetadata,
                  index_status: IndexStatus.TIMEOUT_RETRY,
                }
              : null
            : prev.imageMetadata,
        };
      });
    }
  }, [imageId]);

  // Start polling on mount; properly clean up on unmount or imageId change
  useEffect(() => {
    poll(); // Initial fetch

    pollIntervalRef.current = setInterval(
      poll,
      MEDIA_CONFIG.polling.indexStatusPollIntervalMs
    );

    return () => {
      // Clean up interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      // Abort in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [imageId, poll]);

  const manualRefresh = useCallback(async () => {
    setState((prev) => ({ ...prev, pollRetries: 0 })); // Reset counter
    await poll();
  }, [poll]);

  return {
    imageMetadata: state.imageMetadata,
    loading: state.loading,
    error: state.error,
    isFinalized:
      state.imageMetadata?.index_status === IndexStatus.READY ||
      state.imageMetadata?.index_status === IndexStatus.FAILED ||
      state.imageMetadata?.index_status === IndexStatus.TIMEOUT_RETRY,
    pollRetries: state.pollRetries,
    manualRefresh,
  };
}