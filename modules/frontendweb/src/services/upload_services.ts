/**
 * @file upload_services.ts
 * @layer services
 * @description Unified upload queue service for workflow upload.
 *              Covers both single-file and bulk uploads via one hook: useUploadQueue().
 * @owner AG-04
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadAdapter, directMinIOUploadClient } from '../adapters/upload_adapters'
import { UPLOAD_CONFIG } from '../configs/upload_configs'
import type {
    UploadQueueItem,
    UploadPrivacyLevel,
    UploadResponse,
} from '../entities/upload_entities'

interface UploadQueueState {
    items: UploadQueueItem[]
    totalCount: number
    pendingCount: number
    activeCount: number
    doneCount: number
    errorCount: number
    cancelledCount: number
}

interface UseUploadQueueReturn {
    state: UploadQueueState
    queueItemsRef: React.MutableRefObject<Map<string, UploadQueueItem>>
    enqueueFiles: (
        files: File[],
        albumId: number,
        privacyLevel: UploadPrivacyLevel,
        tags?: string[]
    ) => Promise<string[]>
    cancelFile: (uploadId: string) => void
    retryFile: (uploadId: string) => void
    clearQueue: () => void
}

function generateUploadId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function debounce<T extends (...args: never[]) => void>(fn: T, wait: number): T {
    let timer: ReturnType<typeof setTimeout> | null = null
    return ((...args: Parameters<T>) => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => fn(...args), wait)
    }) as T
}

function isRetryableError(error: unknown): boolean {
    const e = error as {
        status?: number
        code?: string
        name?: string
        details?: { httpStatus?: number }
    }

    const httpStatus =
        (typeof e?.status === 'number' && e.status) ||
        (typeof e?.details?.httpStatus === 'number' ? e.details.httpStatus : undefined)

    if (!e) return false
    if (e.name === 'AbortError') return false
    if (e.code === 'ERR_UPLOAD_CANCELLED') return false
    if (e.code === 'ERR_UNAUTHORIZED' || e.code === 'ERR_FORBIDDEN') return false
    if (httpStatus === 401 || httpStatus === 403) return false
    if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) return false

    // NOTE: 409 không cần xét ở đây nữa.
    // 409 idempotency đã được upload_adapters.ts xử lý thành success (không throw).
    return true
}

function isAlbumIdValid(albumId: number): boolean {
    return Number.isInteger(albumId)
}

function createQueueItem(
    file: File,
    albumId: number,
    privacyLevel: UploadPrivacyLevel,
    tags?: string[]
): UploadQueueItem {
    return {
        uploadId: generateUploadId(),
        file,
        state: 'pending',
        progress: { loaded: 0, total: file.size },
        error: null,
        albumId,
        privacyLevel,
        tags,
        retryCount: 0,
        startedAt: Date.now(),
    }
}

export function useUploadQueue(): UseUploadQueueReturn {
    const queueItemsRef = useRef<Map<string, UploadQueueItem>>(new Map())
    const activeUploadsRef = useRef<Set<string>>(new Set())
    const workerLoopRef = useRef<boolean>(false)
    const [, forceRender] = useState(0)

    const debouncedRender = useCallback(
        debounce(() => forceRender((prev) => prev + 1), 300),
        []
    )

    const computeState = useCallback((): UploadQueueState => {
        const items = Array.from(queueItemsRef.current.values())
        return {
            items,
            totalCount: items.length,
            pendingCount: items.filter((i) => i.state === 'pending').length,
            activeCount: items.filter(
                (i) => i.state === 'presigning' || i.state === 'uploading' || i.state === 'confirming'
            ).length,
            doneCount: items.filter((i) => i.state === 'done').length,
            errorCount: items.filter((i) => i.state === 'error').length,
            cancelledCount: items.filter((i) => i.state === 'cancelled').length,
        }
    }, [])

    const presign = useCallback(async (item: UploadQueueItem): Promise<void> => {
        item.state = 'presigning'
        debouncedRender()

        const expectedSizeMb = Math.ceil(item.file.size / 1024 / 1024)
        const response = await uploadAdapter.requestPresignedUrl(
            item.file.name,
            item.file.type,
            expectedSizeMb
        )

        if (response.expires_in_sec < 60) {
            throw new Error(`Presigned URL expires too soon (${response.expires_in_sec}s).`)
        }

        item.presignedUrl = response.upload_url
        item.objectKey = response.object_key
        item.expiresInSec = response.expires_in_sec
    }, [debouncedRender])

    const uploadBinary = useCallback(async (item: UploadQueueItem): Promise<void> => {
        if (!item.presignedUrl) {
            throw new Error('No presigned URL available')
        }

        item.state = 'uploading'
        debouncedRender()

        const abortController = new AbortController()
        item.abortController = abortController

        await directMinIOUploadClient.uploadBinary(
            item.presignedUrl,
            item.file,
            (loaded, total) => {
                item.progress = { loaded, total }
                debouncedRender()
            },
            abortController.signal
        )
    }, [debouncedRender])

    const confirm = useCallback(async (item: UploadQueueItem): Promise<void> => {
        if (!item.objectKey) {
            throw new Error('Missing object key for confirmation')
        }

        item.state = 'confirming'
        debouncedRender()

        const result: UploadResponse = await uploadAdapter.confirmUpload(
            item.objectKey,
            item.albumId,
            item.privacyLevel,
            item.tags
        )

        item.uploadedImage = result
        item.state = 'done'
        item.completedAt = Date.now()
    }, [debouncedRender])

    const processSingle = useCallback(async (item: UploadQueueItem): Promise<void> => {
        activeUploadsRef.current.add(item.uploadId)

        try {
            for (let attempt = 0; attempt <= UPLOAD_CONFIG.bulk.maxRetries; attempt++) {
                try {
                    await presign(item)
                    await uploadBinary(item)
                    await confirm(item)
                    debouncedRender()
                    return
                } catch (error) {
                    const e = error as Error
                    if (e.name === 'AbortError') {
                        item.state = 'cancelled'
                        debouncedRender()
                        return
                    }

                    if (attempt < UPLOAD_CONFIG.bulk.maxRetries && isRetryableError(error)) {
                        item.retryCount = attempt + 1
                        const backoffMs =
                            UPLOAD_CONFIG.bulk.retryBackoffMs *
                            Math.pow(UPLOAD_CONFIG.bulk.retryBackoffFactor, attempt)
                        await new Promise((resolve) => setTimeout(resolve, backoffMs))
                        continue
                    }

                    item.state = 'error'
                    item.error = {
                        code: 'ERR_UPLOAD_PIPELINE_FAILED',
                        message: e?.message || 'Upload pipeline failed.',
                    }
                    debouncedRender()
                    return
                }
            }
        } finally {
            activeUploadsRef.current.delete(item.uploadId)
        }
    }, [confirm, presign, uploadBinary, debouncedRender])

    const runWorkerLoop = useCallback(async () => {
        if (workerLoopRef.current) return
        workerLoopRef.current = true

        try {
            while (true) {
                if (activeUploadsRef.current.size >= UPLOAD_CONFIG.bulk.maxConcurrentUploads) {
                    await new Promise((resolve) => setTimeout(resolve, 100))
                    continue
                }

                const next = Array.from(queueItemsRef.current.values()).find(
                    (i) => i.state === 'pending' && !activeUploadsRef.current.has(i.uploadId)
                )

                if (!next) {
                    if (activeUploadsRef.current.size === 0) break
                    await new Promise((resolve) => setTimeout(resolve, 100))
                    continue
                }

                processSingle(next).catch(() => {
                    // item-level state already handled in processSingle
                })
            }
        } finally {
            workerLoopRef.current = false
        }
    }, [processSingle])

    const enqueueFiles = useCallback(async (
        files: File[],
        albumId: number,
        privacyLevel: UploadPrivacyLevel,
        tags?: string[]
    ): Promise<string[]> => {
        if (!isAlbumIdValid(albumId)) {
            throw new Error('Album is required before upload')
        }

        if (!files.length) return []

        if (files.length > UPLOAD_CONFIG.bulk.maxFilesPerBatch) {
            throw new Error(
                `Maximum ${UPLOAD_CONFIG.bulk.maxFilesPerBatch} files per batch. Got ${files.length}.`
            )
        }

        const ids: string[] = []
        const maxSizeBytes = UPLOAD_CONFIG.fileConstraints.maxFileSizeMb * 1024 * 1024
        const allowedTypes = UPLOAD_CONFIG.fileConstraints.allowedContentTypes

        for (const file of files) {
            if (file.size > maxSizeBytes) {
                throw new Error(
                    `File "${file.name}" exceeds ${UPLOAD_CONFIG.fileConstraints.maxFileSizeMb}MB limit.`
                )
            }

            if (!allowedTypes.includes(file.type)) {
                throw new Error(
                    `File "${file.name}" has unsupported type "${file.type}". Allowed: ${allowedTypes.join(', ')}`
                )
            }

            const item = createQueueItem(file, albumId, privacyLevel, tags)
            queueItemsRef.current.set(item.uploadId, item)
            ids.push(item.uploadId)
        }

        runWorkerLoop()
        debouncedRender()
        return ids
    }, [runWorkerLoop, debouncedRender])

    const cancelFile = useCallback((uploadId: string) => {
        const item = queueItemsRef.current.get(uploadId)
        if (!item) return

        const ctrl = item.abortController
        if (ctrl) {
            ctrl.abort()
        } else {
            item.state = 'cancelled'
            debouncedRender()
        }
    }, [debouncedRender])

    const retryFile = useCallback((uploadId: string) => {
        const item = queueItemsRef.current.get(uploadId)
        if (!item || item.state !== 'error') return

        item.state = 'pending'
        item.error = null
        item.retryCount = 0
        item.progress = { loaded: 0, total: item.file.size }
        item.startedAt = Date.now()
        item.completedAt = undefined
        item.presignedUrl = undefined
        item.objectKey = undefined
        item.expiresInSec = undefined
        item.uploadedImage = undefined
        item.abortController = undefined

        runWorkerLoop()
        debouncedRender()
    }, [runWorkerLoop, debouncedRender])

    const clearQueue = useCallback(() => {
        queueItemsRef.current.forEach((item) => {
            const ctrl = item.abortController
            if (ctrl) ctrl.abort()
        })
        queueItemsRef.current.clear()
        activeUploadsRef.current.clear()
        debouncedRender()
    }, [debouncedRender])

    useEffect(() => {
        return () => {
            queueItemsRef.current.forEach((item) => {
                const ctrl = item.abortController
                if (ctrl) ctrl.abort()
            })
            queueItemsRef.current.clear()
            activeUploadsRef.current.clear()
            workerLoopRef.current = false
        }
    }, [])

    return {
        state: computeState(),
        queueItemsRef,
        enqueueFiles,
        cancelFile,
        retryFile,
        clearQueue,
    }
}