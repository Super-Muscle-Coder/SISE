// modules/frontendweb/src/services/media_services.ts
/**
 * @file media_services.ts
 * @layer services
 * @description React hooks cho workflow media thuần túy (gallery + album
 *              list + index status polling + single image metadata +
 *              update/delete).
 *              SỬA: bổ sung useImageMetadata(imageId) (GET /media/{id}),
 *              useUpdateImage() (PUT /media/{id}/update), useDeleteImage()
 *              (DELETE /media/{id}/delete) — cần cho DetailImagePage +
 *              menu Edit/Delete trên ImageCard. mediaAdapter đã có sẵn 3
 *              hàm này từ Nhóm 2 (getImageMetadata/updateImageMetadata/
 *              deleteImage), chỉ thiếu hook wrapper đúng kiến trúc.
 * @owner AG-04
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { MEDIA_CONFIG } from '@/configs/media_configs'
import { mediaAdapter } from '@/adapters/media_adapters'
import type { Album, ImageMetadata, PrivacyLevel } from '@/entities/media_entities'

interface MediaGalleryPagination {
    offset: number
    limit: number
    total: number
}

interface UseMediaGalleryState {
    items: ImageMetadata[]
    loading: boolean
    error: Error | null
    pagination: MediaGalleryPagination
    albumId?: number
}

export interface UseMediaGalleryActions {
    items: ImageMetadata[]
    loading: boolean
    error: Error | null
    pagination: MediaGalleryPagination
    setOffset: (newOffset: number) => void
    setLimit: (newLimit: number) => void
    setAlbumId: (albumId?: number) => void
    refetch: () => Promise<void>
}

export function useMediaGallery(initialAlbumId?: number): UseMediaGalleryActions {
    const [state, setState] = useState<UseMediaGalleryState>({
        items: [],
        loading: false,
        error: null,
        pagination: {
            offset: MEDIA_CONFIG.LIST.defaultOffset,
            limit: MEDIA_CONFIG.LIST.defaultLimit,
            total: 0,
        },
        albumId: initialAlbumId,
    })

    const fetchMedia = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        try {
            const response = await mediaAdapter.getMediaList(
                state.albumId,
                state.pagination.offset,
                state.pagination.limit
            )

            setState((prev) => ({
                ...prev,
                items: response.items,
                loading: false,
                error: null,
                pagination: {
                    offset: response.offset,
                    limit: response.limit,
                    total: response.total,
                },
            }))
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err : new Error('Unknown error'),
            }))
        }
    }, [state.albumId, state.pagination.offset, state.pagination.limit])

    useEffect(() => {
        fetchMedia()
    }, [fetchMedia])

    const setOffset = useCallback((newOffset: number) => {
        setState((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                offset: Math.max(0, Math.floor(newOffset)),
            },
        }))
    }, [])

    const setLimit = useCallback((newLimit: number) => {
        const normalized = Math.max(1, Math.floor(newLimit))
        setState((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                limit: normalized,
                offset: MEDIA_CONFIG.LIST.defaultOffset,
            },
        }))
    }, [])

    const setAlbumId = useCallback((albumId?: number) => {
        setState((prev) => ({
            ...prev,
            albumId,
            pagination: {
                ...prev.pagination,
                offset: MEDIA_CONFIG.LIST.defaultOffset,
            },
        }))
    }, [])

    return {
        items: state.items,
        loading: state.loading,
        error: state.error,
        pagination: state.pagination,
        setOffset,
        setLimit,
        setAlbumId,
        refetch: fetchMedia,
    }
}

interface AlbumListPagination {
    offset: number
    limit: number
    total: number
}

interface UseAlbumListState {
    items: Album[]
    loading: boolean
    error: Error | null
    pagination: AlbumListPagination
    isCreating: boolean
    createError: Error | null
}

export interface UseAlbumListActions {
    items: Album[]
    loading: boolean
    error: Error | null
    pagination: AlbumListPagination
    setOffset: (newOffset: number) => void
    setLimit: (newLimit: number) => void
    refetch: () => Promise<void>
    createAlbum: (title: string, description?: string, isPublic?: boolean) => Promise<Album | null>
    isCreating: boolean
    createError: Error | null
}

export function useAlbumList(): UseAlbumListActions {
    const [state, setState] = useState<UseAlbumListState>({
        items: [],
        loading: false,
        error: null,
        pagination: {
            offset: MEDIA_CONFIG.LIST.defaultOffset,
            limit: MEDIA_CONFIG.LIST.defaultLimit,
            total: 0,
        },
        isCreating: false,
        createError: null,
    })

    const fetchAlbums = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        try {
            const response = await mediaAdapter.getAlbumList(
                state.pagination.offset,
                state.pagination.limit
            )

            setState((prev) => ({
                ...prev,
                items: response.items,
                loading: false,
                error: null,
                pagination: {
                    offset: response.offset,
                    limit: response.limit,
                    total: response.total,
                },
            }))
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err : new Error('Failed to load albums'),
            }))
        }
    }, [state.pagination.offset, state.pagination.limit])

    useEffect(() => {
        fetchAlbums()
    }, [fetchAlbums])

    const setOffset = useCallback((newOffset: number) => {
        setState((prev) => ({
            ...prev,
            pagination: { ...prev.pagination, offset: Math.max(0, Math.floor(newOffset)) },
        }))
    }, [])

    const setLimit = useCallback((newLimit: number) => {
        const normalized = Math.max(1, Math.floor(newLimit))
        setState((prev) => ({
            ...prev,
            pagination: {
                ...prev.pagination,
                limit: normalized,
                offset: MEDIA_CONFIG.LIST.defaultOffset,
            },
        }))
    }, [])

    const createAlbum = useCallback(
        async (title: string, description?: string, isPublic?: boolean): Promise<Album | null> => {
            setState((prev) => ({ ...prev, isCreating: true, createError: null }))

            try {
                const album = await mediaAdapter.createAlbum(title, description, isPublic)

                setState((prev) => ({ ...prev, isCreating: false, createError: null }))
                await fetchAlbums()
                return album
            } catch (err) {
                setState((prev) => ({
                    ...prev,
                    isCreating: false,
                    createError: err instanceof Error ? err : new Error('Failed to create album'),
                }))
                return null
            }
        },
        [fetchAlbums]
    )

    return {
        items: state.items,
        loading: state.loading,
        error: state.error,
        pagination: state.pagination,
        setOffset,
        setLimit,
        refetch: fetchAlbums,
        createAlbum,
        isCreating: state.isCreating,
        createError: state.createError,
    }
}

interface UseImageStatusPollingState {
    imageMetadata: ImageMetadata | null
    loading: boolean
    error: Error | null
    pollRetries: number
}

export interface UseImageStatusPollingActions {
    imageMetadata: ImageMetadata | null
    loading: boolean
    error: Error | null
    pollRetries: number
    isFinalized: boolean
    manualRefresh: () => Promise<void>
}

export function useImageStatusPolling(imageId: string): UseImageStatusPollingActions {
    const [state, setState] = useState<UseImageStatusPollingState>({
        imageMetadata: null,
        loading: false,
        error: null,
        pollRetries: 0,
    })

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const pollOnce = useCallback(async () => {
        if (!imageId) return

        setState((prev) => ({ ...prev, loading: true, error: null }))

        try {
            const metadata = await mediaAdapter.getImageMetadata(imageId)
            const finalized =
                metadata.index_status === 'ready' || metadata.index_status === 'failed'

            setState((prev) => ({
                ...prev,
                imageMetadata: metadata,
                loading: false,
                error: null,
                pollRetries: finalized ? prev.pollRetries : 0,
            }))

            if (finalized) {
                stopPolling()
            }
        } catch (err) {
            setState((prev) => {
                const nextRetries = prev.pollRetries + 1
                if (nextRetries >= MEDIA_CONFIG.INDEX_POLL.maxRetries) {
                    stopPolling()
                }

                return {
                    ...prev,
                    loading: false,
                    error: err instanceof Error ? err : new Error('Failed to poll image status'),
                    pollRetries: nextRetries,
                }
            })
        }
    }, [imageId, stopPolling])

    useEffect(() => {
        if (!imageId) return

        pollOnce()

        intervalRef.current = setInterval(() => {
            pollOnce()
        }, MEDIA_CONFIG.INDEX_POLL.intervalMs)

        return () => {
            stopPolling()
        }
    }, [imageId, pollOnce, stopPolling])

    const isFinalized =
        state.imageMetadata?.index_status === 'ready' ||
        state.imageMetadata?.index_status === 'failed'

    return {
        imageMetadata: state.imageMetadata,
        loading: state.loading,
        error: state.error,
        pollRetries: state.pollRetries,
        isFinalized: Boolean(isFinalized),
        manualRefresh: pollOnce,
    }
}

interface UseImageMetadataState {
    image: ImageMetadata | null
    loading: boolean
    error: Error | null
}

export interface UseImageMetadataActions {
    image: ImageMetadata | null
    loading: boolean
    error: Error | null
    refetch: () => Promise<void>
}

/**
 * useImageMetadata: Tải metadata của 1 ảnh cụ thể (GET /media/{image_id}).
 * Dùng bởi DetailImagePage — tự fetch khi mount hoặc khi imageId đổi.
 */
export function useImageMetadata(imageId: string | undefined): UseImageMetadataActions {
    const [state, setState] = useState<UseImageMetadataState>({
        image: null,
        loading: false,
        error: null,
    })

    const fetchImage = useCallback(async () => {
        if (!imageId) return

        setState((prev) => ({ ...prev, loading: true, error: null }))

        try {
            const image = await mediaAdapter.getImageMetadata(imageId)
            setState({ image, loading: false, error: null })
        } catch (err) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err : new Error('Failed to load image'),
            }))
        }
    }, [imageId])

    useEffect(() => {
        fetchImage()
    }, [fetchImage])

    return {
        image: state.image,
        loading: state.loading,
        error: state.error,
        refetch: fetchImage,
    }
}

export interface UseUpdateImageActions {
    isUpdating: boolean
    updateError: Error | null
    updateImage: (
        imageId: string,
        updates: { album_id?: number; privacy_level?: PrivacyLevel; tags?: string[] }
    ) => Promise<ImageMetadata | null>
}

/**
 * useUpdateImage: Cập nhật metadata 1 ảnh (PUT /media/{image_id}/update) —
 * album_id, privacy_level, tags. Dùng bởi EditImageDialog (menu 3 chấm
 * trên ImageCard).
 */
export function useUpdateImage(): UseUpdateImageActions {
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateError, setUpdateError] = useState<Error | null>(null)

    const updateImage = useCallback(
        async (
            imageId: string,
            updates: { album_id?: number; privacy_level?: PrivacyLevel; tags?: string[] }
        ): Promise<ImageMetadata | null> => {
            setIsUpdating(true)
            setUpdateError(null)

            try {
                const image = await mediaAdapter.updateImageMetadata(imageId, updates)
                setIsUpdating(false)
                return image
            } catch (err) {
                setIsUpdating(false)
                setUpdateError(err instanceof Error ? err : new Error('Failed to update image'))
                return null
            }
        },
        []
    )

    return { isUpdating, updateError, updateImage }
}

export interface UseDeleteImageActions {
    isDeleting: boolean
    deleteError: Error | null
    deleteImage: (imageId: string) => Promise<boolean>
}

/**
 * useDeleteImage: Xóa mềm 1 ảnh (DELETE /media/{image_id}/delete). Dùng
 * bởi DeleteImageConfirmDialog (menu 3 chấm trên ImageCard).
 */
export function useDeleteImage(): UseDeleteImageActions {
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<Error | null>(null)

    const deleteImage = useCallback(async (imageId: string): Promise<boolean> => {
        setIsDeleting(true)
        setDeleteError(null)

        try {
            await mediaAdapter.deleteImage(imageId)
            setIsDeleting(false)
            return true
        } catch (err) {
            setIsDeleting(false)
            setDeleteError(err instanceof Error ? err : new Error('Failed to delete image'))
            return false
        }
    }, [])

    return { isDeleting, deleteError, deleteImage }
}