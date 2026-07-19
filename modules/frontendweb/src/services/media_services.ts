// modules/frontendweb/src/services/media_services.ts
/**
 * @file media_services.ts
 * @layer services
 * @description React hooks cho workflow media thuần túy (gallery + album
 *              list + index status polling)
 *              SỬA: bổ sung createAlbum(title) vào useAlbumList() — trước
 *              đây UI cần tạo album mới phải gọi thẳng mediaAdapter từ
 *              pages/ (vi phạm ranh giới Nhóm C không gọi thẳng adapters/,
 *              phát hiện khi viết UploadPage.tsx). Cùng loại vấn đề với
 *              lần thiếu useAlbumList() đã phát hiện trước đó — mỗi khi
 *              UI cần 1 hành động mới, phải bổ sung đúng chỗ ở services/,
 *              không tự ý gọi tắt qua adapters/ từ pages/.
 * @owner AG-04
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { MEDIA_CONFIG } from '@/configs/media_configs'
import { mediaAdapter } from '@/adapters/media_adapters'
import type { Album, ImageMetadata } from '@/entities/media_entities'

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
    /**
     * Tạo album mới (POST /albums), rồi TỰ ĐỘNG refetch() danh sách —
     * caller không cần tự gọi refetch() sau khi tạo thành công.
     * Trả về Album vừa tạo nếu thành công, null nếu lỗi (lỗi nằm trong
     * createError).
     */
    createAlbum: (title: string, description?: string, isPublic?: boolean) => Promise<Album | null>
    isCreating: boolean
    createError: Error | null
}

/**
 * useAlbumList: Tải danh sách album của người dùng (GET /albums), tạo
 * album mới (POST /albums). Dùng cho selector chọn album (upload modal),
 * bộ lọc gallery (DashboardPage/UploadPage), và dialog tạo album mới —
 * tất cả nơi cần thao tác với album đều đi qua hook DUY NHẤT này, không
 * gọi thẳng mediaAdapter từ pages/.
 */
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
                // SỬA: mediaAdapter.createAlbum() nhận 3 tham số RỜI
                // (title, description?, isPublic?) — KHÔNG PHẢI 1 object
                // CreateAlbumRequest. Đã xác nhận qua đọc lại chính xác
                // media_adapters.ts (lỗi TS2345 trước đó là do gọi sai
                // chữ ký, bọc nhầm 3 tham số vào 1 object).
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