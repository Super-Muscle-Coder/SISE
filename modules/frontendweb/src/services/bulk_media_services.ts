/**
 * @file bulk_media_services.ts
 * @layer services
 * @description React hook for bulk (drag-drop) upload orchestration
 *              T004-04: Ref-based queue, debounced re-renders, chunked concurrency
 *              Uses T004-03 hardened adapters: directMinIOUploadClient + mediaAdapter
 * @owner AG-04
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { mediaAdapter, directMinIOUploadClient } from '@/adapters/media_adapters';
import { MEDIA_CONFIG } from '@/configs/media_configs';
import { PrivacyLevel, UploadResponse } from '@/entities/media_entities';

// ============================================================================
// TYPE DEFINITIONS (5-Layer: Entities)
// ============================================================================

export interface BulkUploadQueueItem {
    uploadId: string; // UUID v4, unique per file in this session
    file: File;
    state:
    | 'pending'
    | 'presigning'
    | 'uploading'
    | 'confirming'
    | 'done'
    | 'error'
    | 'cancelled';
    progress: {
        loaded: number; // bytes uploaded to MinIO
        total: number; // total file size
    };
    error: Error | null;
    errorCode?: string; // e.g., 'FILE_TOO_LARGE', 'NETWORK_TIMEOUT', 'BACKEND_409'
    presignedUrl?: string;
    objectKey?: string;
    expiresInSec?: number;
    idempotencyKey?: string; // UUID, stable across retries for same file
    albumId?: number;
    privacyLevel?: PrivacyLevel;
    uploadedImage?: UploadResponse; // Populated after successful confirm
    abortController: AbortController;
    retryCount: number;
    startedAt: number; // timestamp
    completedAt?: number; // timestamp
}

export interface BulkUploadQueueState {
    items: BulkUploadQueueItem[];
    totalCount: number;
    pendingCount: number;
    uploadingCount: number;
    doneCount: number;
    errorCount: number;
    cancelledCount: number;
}

// ============================================================================
// UTILITY: UUID v4 Generator (minimal, no external deps)
// ============================================================================

function generateUUIDv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ============================================================================
// UTILITY: Debounce with immediate trailing call
// ============================================================================

function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let lastCallTime = 0;

    return function (...args: Parameters<T>) {
        const now = Date.now();
        lastCallTime = now;

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            if (Date.now() - lastCallTime >= wait) {
                func(...args);
            }
        }, wait);
    };
}

// ============================================================================
// UTILITY: Build initial queue item
// ============================================================================

function createQueueItem(file: File): BulkUploadQueueItem {
    return {
        uploadId: generateUUIDv4(),
        file,
        state: 'pending',
        progress: { loaded: 0, total: file.size },
        error: null,
        abortController: new AbortController(),
        retryCount: 0,
        startedAt: Date.now(),
    };
}

// ============================================================================
// UTILITY: Check if error is retryable
// ============================================================================

function isRetryableError(error: any): boolean {
    // Network timeouts, 5xx, 503 are retryable
    // 4xx (except 409), 401, 403 are not
    if (!error) return false;
    if (error.name === 'AbortError') return false; // User cancelled, don't retry
    if (error.status === 409) return false; // Idempotency cache, not a failure
    if (error.status === 401 || error.status === 403) return false; // Auth fail
    if (error.status && error.status >= 400 && error.status < 500) return false; // 4xx
    return true; // Assume retryable: timeout, 5xx, network error
}

// ============================================================================
// MAIN HOOK: useBulkUploadQueue
// ============================================================================

export interface UseBulkUploadQueueOptions {
    defaultAlbumId?: number;
    defaultPrivacyLevel?: PrivacyLevel;
    maxConcurrency?: number;
    maxRetries?: number;
    maxFiles?: number;
}

export interface UseBulkUploadQueueReturn {
    state: BulkUploadQueueState;
    queueItemsRef: React.MutableRefObject<Map<string, BulkUploadQueueItem>>;
    enqueueFiles: (
        files: File[],
        albumId: number,
        privacyLevel: PrivacyLevel
    ) => Promise<string[] | null>; // Returns array of uploadIds, or null if batch rejected
    cancelFile: (uploadId: string) => void;
    retryFile: (uploadId: string) => void;
    clearQueue: () => void;
}

export function useBulkUploadQueue(
    options: UseBulkUploadQueueOptions = {}
): UseBulkUploadQueueReturn {
    const {
        maxConcurrency = MEDIA_CONFIG.bulkUpload.maxConcurrentUploads,
        maxRetries = MEDIA_CONFIG.bulkUpload.maxRetries,
        maxFiles = MEDIA_CONFIG.bulkUpload.maxFilesPerBatch,
    } = options;

    // ========================================================================
    // STATE: Use ref for queue, state for render trigger
    // ========================================================================

    const queueItemsRef = useRef<Map<string, BulkUploadQueueItem>>(new Map());
    const activeUploadsRef = useRef<Set<string>>(new Set()); // Tracks which files are currently in-flight
    const workerLoopRef = useRef<boolean>(false); // Prevent multiple worker loops
    const [, forceRender] = useState(0);

    // Debounced re-render: max 2 per second
    const debouncedRender = useCallback(
        debounce(() => {
            forceRender((prev) => prev + 1);
        }, 500),
        []
    );

    // ========================================================================
    // UTILITY: Compute aggregate state
    // ========================================================================

    const computeQueueState = useCallback((): BulkUploadQueueState => {
        const items = Array.from(queueItemsRef.current.values());
        return {
            items,
            totalCount: items.length,
            pendingCount: items.filter((i) => i.state === 'pending').length,
            uploadingCount: items.filter(
                (i) => i.state === 'uploading' || i.state === 'presigning' || i.state === 'confirming'
            ).length,
            doneCount: items.filter((i) => i.state === 'done').length,
            errorCount: items.filter((i) => i.state === 'error').length,
            cancelledCount: items.filter((i) => i.state === 'cancelled').length,
        };
    }, []);

    // ========================================================================
    // STEP 1: Request Presigned URL
    // ========================================================================

    const presignFile = async (item: BulkUploadQueueItem): Promise<void> => {
        if (!item.idempotencyKey) {
            item.idempotencyKey = generateUUIDv4();
        }

        try {
            item.state = 'presigning';
            debouncedRender();

            const presignResult = await mediaAdapter.requestPresignedUrl(
                item.file.name,
                item.file.type,
                item.file.size / (1024 * 1024) // Convert bytes to MB
            );

            // Check if URL will expire soon
            if (presignResult.expires_in_sec < 300) {
                throw new Error(
                    `Presigned URL expires too soon (${presignResult.expires_in_sec}s). File may not upload in time.`
                );
            }

            item.presignedUrl = presignResult.upload_url;
            item.objectKey = presignResult.object_key;
            item.expiresInSec = presignResult.expires_in_sec;
        } catch (error: any) {
            item.state = 'error';
            item.error = error instanceof Error ? error : new Error(String(error));
            item.errorCode = 'PRESIGN_FAILED';
            debouncedRender();
            throw error;
        }
    };

    // ========================================================================
    // STEP 2: Upload Binary to MinIO
    // ========================================================================

    const uploadFileToMinIO = async (item: BulkUploadQueueItem): Promise<void> => {
        if (!item.presignedUrl) {
            throw new Error('No presigned URL available');
        }

        try {
            item.state = 'uploading';
            debouncedRender();

            const onProgress = (loaded: number, total: number) => {
                item.progress = { loaded, total };
                debouncedRender();
            };

            await directMinIOUploadClient.uploadBinary(
                item.presignedUrl,
                item.file,
                onProgress,
                item.abortController.signal // Pass abort signal
            );
        } catch (error: any) {
            if (error.name === 'AbortError') {
                item.state = 'cancelled';
            } else {
                item.state = 'error';
                item.error = error instanceof Error ? error : new Error(String(error));
                item.errorCode = 'UPLOAD_FAILED';
            }
            debouncedRender();
            throw error;
        }
    };

    // ========================================================================
    // STEP 3: Confirm Upload (commit metadata, queue async indexing)
    // ========================================================================

    const confirmFileUpload = async (item: BulkUploadQueueItem): Promise<void> => {
        // FIX: Corrected to only check objectKey (which is mandatory from S1).
        // albumId is ALLOWED to be null/undefined (user can upload without album).
        // albumId === 0 is a VALID album ID and should not be rejected.
        if (!item.objectKey) {
            throw new Error('Missing object key for confirmation');
        }

        try {
            item.state = 'confirming';
            debouncedRender();

            const confirmResult = await mediaAdapter.confirmUpload(
                item.objectKey,
                item.albumId || null,
                item.privacyLevel || PrivacyLevel.PRIVATE,
                undefined // tags - optional parameter
            );

            // Both 200 and 409 arrive here as success (adapter handles 409)
            // confirmResult is UploadResponse with image_id field
            item.uploadedImage = confirmResult;
            item.state = 'done';
            item.completedAt = Date.now();
        } catch (error: any) {
            item.state = 'error';
            item.error = error instanceof Error ? error : new Error(String(error));

            // Distinguish error types
            if (error.status === 409) {
                item.errorCode = 'IDEMPOTENCY_CONFLICT'; // Should not happen if adapter handles it
            } else if (error.status === 400) {
                item.errorCode = 'INVALID_METADATA';
            } else {
                item.errorCode = 'CONFIRM_FAILED';
            }

            debouncedRender();
            throw error;
        }

        debouncedRender();
    };

    // ========================================================================
    // STEP F: Full Pipeline for Single File (with retry)
    // ========================================================================

    const processSingleFile = async (item: BulkUploadQueueItem): Promise<void> => {
        activeUploadsRef.current.add(item.uploadId);

        try {
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    await presignFile(item);
                    await uploadFileToMinIO(item);
                    await confirmFileUpload(item);
                    return; // Success
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        return; // User cancelled, don't retry
                    }

                    if (attempt < maxRetries && isRetryableError(error)) {
                        item.retryCount = attempt + 1;
                        // Exponential backoff: 1s, 2s
                        await new Promise((resolve) =>
                            setTimeout(resolve, MEDIA_CONFIG.bulkUpload.retryBackoffMs * Math.pow(
                                MEDIA_CONFIG.bulkUpload.retryBackoffFactor,
                                attempt
                            ))
                        );
                        // Loop will retry
                    } else {
                        // Final error or not retryable
                        if (item.state !== 'error') {
                            item.state = 'error';
                            item.error = error instanceof Error ? error : new Error(String(error));
                            item.errorCode = item.errorCode || 'UNKNOWN_ERROR';
                        }
                        debouncedRender();
                        return;
                    }
                }
            }
        } finally {
            activeUploadsRef.current.delete(item.uploadId);
        }
    };

    // ========================================================================
    // WORKER LOOP: Manage Concurrency (max 3 in-flight)
    // ========================================================================

    const runWorkerLoop = useCallback(async () => {
        if (workerLoopRef.current) return; // Prevent multiple loops
        workerLoopRef.current = true;

        try {
            while (true) {
                // Find next pending file
                let nextItem: BulkUploadQueueItem | null = null;
                for (const item of queueItemsRef.current.values()) {
                    if (item.state === 'pending' && !activeUploadsRef.current.has(item.uploadId)) {
                        nextItem = item;
                        break;
                    }
                }

                if (!nextItem) {
                    // No more pending files
                    if (activeUploadsRef.current.size === 0) {
                        // Queue is completely done
                        break;
                    }
                    // Wait for active uploads to finish
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    continue;
                }

                // Check concurrency limit
                if (activeUploadsRef.current.size >= maxConcurrency) {
                    // Wait before trying again
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    continue;
                }

                // Start this file's pipeline in background
                processSingleFile(nextItem).catch(() => {
                    // Error already handled in processSingleFile
                });
            }
        } finally {
            workerLoopRef.current = false;
        }
    }, [maxConcurrency, maxRetries]);

    // ========================================================================
    // PUBLIC: Enqueue Files
    // ========================================================================

    const enqueueFiles = useCallback(
        async (
            files: File[],
            albumId: number,
            privacyLevel: PrivacyLevel
        ): Promise<string[] | null> => {
            // Validate batch size
            if (files.length > maxFiles) {
                throw new Error(`Maximum ${maxFiles} files per batch. Got ${files.length}.`);
            }

            // Validate individual file sizes
            const uploadIds: string[] = [];
            for (const file of files) {
                if (file.size > MEDIA_CONFIG.upload.maxFileSizeMb * 1024 * 1024) {
                    throw new Error(
                        `File "${file.name}" exceeds ${MEDIA_CONFIG.upload.maxFileSizeMb}MB limit.`
                    );
                }

                // Check MIME type
                const mimeType = file.type as string;
                if (!MEDIA_CONFIG.upload.allowedMimeTypes.includes(mimeType as any)) {
                    throw new Error(
                        `File "${file.name}" has unsupported type "${file.type}". Allowed: ${MEDIA_CONFIG.upload.allowedMimeTypes.join(
                            ', '
                        )}`
                    );
                }

                const item = createQueueItem(file);
                item.albumId = albumId;
                item.privacyLevel = privacyLevel;
                queueItemsRef.current.set(item.uploadId, item);
                uploadIds.push(item.uploadId);
            }

            // Trigger worker loop
            runWorkerLoop();
            debouncedRender();

            return uploadIds;
        },
        [maxFiles, runWorkerLoop]
    );

    // ========================================================================
    // PUBLIC: Cancel Single File
    // ========================================================================

    const cancelFile = useCallback((uploadId: string) => {
        const item = queueItemsRef.current.get(uploadId);
        if (!item) return;

        item.abortController.abort();
        // State will be set to 'cancelled' in processSingleFile catch block
    }, []);

    // ========================================================================
    // PUBLIC: Retry Single File
    // ========================================================================

    const retryFile = useCallback(
        (uploadId: string) => {
            const item = queueItemsRef.current.get(uploadId);
            if (!item || item.state !== 'error') return;

            item.state = 'pending';
            item.error = null;
            item.errorCode = undefined;
            item.retryCount = 0;
            item.progress = { loaded: 0, total: item.file.size };
            item.abortController = new AbortController(); // Fresh controller

            runWorkerLoop();
            debouncedRender();
        },
        [runWorkerLoop]
    );

    // ========================================================================
    // PUBLIC: Clear Queue
    // ========================================================================

    const clearQueue = useCallback(() => {
        queueItemsRef.current.forEach((item) => {
            item.abortController.abort();
        });
        queueItemsRef.current.clear();
        activeUploadsRef.current.clear();
        debouncedRender();
    }, []);

    // ========================================================================
    // CLEANUP: Abort all on unmount
    // ========================================================================

    useEffect(() => {
        return () => {
            queueItemsRef.current.forEach((item) => {
                item.abortController.abort();
            });
            queueItemsRef.current.clear();
            activeUploadsRef.current.clear();
            workerLoopRef.current = false;
        };
    }, []);

    // ========================================================================
    // RETURN HOOK INTERFACE
    // ========================================================================

    return {
        state: computeQueueState(),
        queueItemsRef,
        enqueueFiles,
        cancelFile,
        retryFile,
        clearQueue,
    };
}