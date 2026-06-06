/**
 * @file media_configs.ts
 * @layer configs
 * @description Media workflow configuration layer - env-to-config boundary.
 *              All values from environment variables (via env_helpers).
 * @owner AG-04
 * @reference data_schema.yaml, openapi.yaml
 */

import {
    getEnvVarWithDefault,
    getEnvNumberWithDefault,
    getEnvListWithDefault,
} from '@/utils/env_helpers';

// Helper to parse MIME types from comma-separated list
const parseAllowedMimeTypes = (): readonly ['image/jpeg', 'image/png'] => {
    const envValue = getEnvVarWithDefault('VITE_ALLOWED_CONTENT_TYPES', 'image/jpeg,image/png');
    const parsed = envValue.split(',').map((mt) => mt.trim());

    // Validate all types are in allowed literal set
    const allowedLiterals: readonly string[] = ['image/jpeg', 'image/png'];
    for (const mime of parsed) {
        if (!allowedLiterals.includes(mime)) {
            console.warn(
                `[media_configs] VITE_ALLOWED_CONTENT_TYPES contains unsupported MIME type: ${mime}`
            );
        }
    }

    // Return static literal array matching TypeScript type contract
    return ['image/jpeg', 'image/png'];
};

// ============================================================================
// MEDIA CONFIGURATION (ENV-DRIVEN)
// ============================================================================

export const MEDIA_CONFIG = {
    // ========================================================================
    // API GATEWAY
    // ========================================================================
    api: {
        baseUrl: getEnvVarWithDefault('VITE_API_BASE_URL', 'http://localhost:8000'),
        timeoutMs: getEnvNumberWithDefault('VITE_API_TIMEOUT_MS', 10000),
    },

    // ========================================================================
    // UPLOAD CONSTRAINTS (from data_schema.yaml global_configs)
    // ========================================================================
    upload: {
        maxFileSizeMb: getEnvNumberWithDefault('VITE_MAX_FILE_SIZE_MB', 20),
        allowedMimeTypes: parseAllowedMimeTypes(),
        presignedUrlExpirySec: getEnvNumberWithDefault('VITE_PRESIGNED_URL_EXPIRY_SEC', 3600),
    } as const,

    // ========================================================================
    // MEDIA POLLING STRATEGY (for index_status polling)
    // ========================================================================
    polling: {
        indexStatusPollIntervalMs: getEnvNumberWithDefault(
            'VITE_MEDIA_INDEX_STATUS_POLL_INTERVAL_MS',
            3000
        ),
        maxPollRetries: getEnvNumberWithDefault('VITE_MEDIA_MAX_POLL_RETRIES', 10),
    } as const,

    // ========================================================================
    // BULK UPLOAD CONCURRENCY
    // ========================================================================
    bulkUpload: {
        maxConcurrentUploads: getEnvNumberWithDefault(
            'VITE_MEDIA_BULK_MAX_CONCURRENT_UPLOADS',
            3
        ),
        maxRetries: getEnvNumberWithDefault('VITE_MEDIA_BULK_MAX_RETRIES', 2),
        maxFilesPerBatch: getEnvNumberWithDefault('VITE_MEDIA_BULK_MAX_FILES_PER_BATCH', 20),
        retryBackoffMs: getEnvNumberWithDefault('VITE_RETRY_BACKOFF_MS', 1000),
        retryBackoffFactor: getEnvNumberWithDefault('VITE_RETRY_BACKOFF_FACTOR', 2),
    } as const,

    // ========================================================================
    // UI LAYOUT (Masonry grid, Pinterest-style)
    // ========================================================================
    masonry: {
        gridClass:
            'columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 break-inside-avoid',
    } as const,

    // ========================================================================
    // API ENDPOINTS (must match openapi.yaml)
    // ========================================================================
    paths: {
        uploadUrl: '/media/upload-url',
        uploadConfirm: '/media/upload/confirm',
        mediaGet: '/media/{image_id}',
        mediaList: '/media',
        mediaDelete: '/media/{image_id}',
        mediaUpdate: '/media/{image_id}/update',
        albumList: '/albums',
        albumCreate: '/albums',
        albumGet: '/albums/{album_id}',
        albumUpdate: '/albums/{album_id}',
        albumDelete: '/albums/{album_id}',
    } as const,

    // ========================================================================
    // IMAGE CARD RENDERING
    // ========================================================================
    imageCard: {
        aspectRatioDynamic: true,
        placeholderBg: 'bg-zinc-200',
        errorBg: 'bg-red-50',
        skeletonPulse: true,
    } as const,

    // ========================================================================
    // PAGINATION DEFAULTS
    // ========================================================================
    pagination: {
        defaultPageSize: 20,
        minPageSize: 10,
        maxPageSize: 100,
    } as const,

    // ========================================================================
    // INDEX STATUS LABELS (for display)
    // ========================================================================
    indexStatusLabels: {
        pending: 'Processing…',
        processing: 'Processing…',
        ready: 'Ready',
        failed: 'Failed',
        timeout_retry: 'Retry',
    } as const,

    // ========================================================================
    // PRIVACY LEVEL LABELS & ICONS
    // ========================================================================
    privacy: {
        labels: {
            0: 'Private',
            1: 'Friends',
            2: 'Public',
        },
        icons: {
            0: '🔒',
            1: '👥',
            2: '🌐',
        },
    } as const,

    // ========================================================================
    // ERROR MESSAGES
    // ========================================================================
    messages: {
        uploadInitError: 'Failed to request upload URL. Please try again.',
        uploadPutError: 'Failed to upload file to storage. Please try again.',
        uploadConfirmError:
            'Failed to confirm upload. The file may have been uploaded but metadata registration failed.',
        pollTimeoutError: 'Image indexing took too long. Click to retry.',
        privacyDenied: 'You do not have permission to view this image.',
        imageNotFound: 'Image not found or has been deleted.',
        fileTooLarge: `File exceeds ${getEnvNumberWithDefault('VITE_MAX_FILE_SIZE_MB', 20)}MB limit.`,
        invalidFileType: `Invalid file type. Allowed: ${parseAllowedMimeTypes().join(', ')}`,
    } as const,
} as const;

export type MediaConfig = typeof MEDIA_CONFIG;