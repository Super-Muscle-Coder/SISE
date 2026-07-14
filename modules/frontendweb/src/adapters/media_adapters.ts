// modules/frontendweb/src/adapters/media_adapters.ts
/**
 * @file media_adapters.ts
 * @layer adapters
 * @description Adapter cho workflow media (Album/Media CRUD thuần túy, không chứa upload)
 * @owner AG-04
 */

import axios from 'axios'
import { MEDIA_CONFIG } from '@/configs/media_configs'
import { scaffoldAdapter } from '@/adapters/scaffold_adapters'
import type { StandardError } from '@/entities/scaffold_entities'
import type {
    Album,
    AlbumListResponse,
    CreateAlbumRequest,
    ImageMetadata,
    MediaListResponse,
    PrivacyLevel,
    UpdateMediaRequest,
} from '@/entities/media_entities'

export class MediaAdapter {
    /**
     * GET /media/{image_id}
     */
    async getImageMetadata(imageId: string): Promise<ImageMetadata> {
        try {
            if (!imageId) {
                throw new Error('imageId is required')
            }

            const response = await scaffoldAdapter.get<ImageMetadata>(
                MEDIA_CONFIG.paths.mediaDetail(imageId)
            )
            return response.data
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to fetch image metadata')
        }
    }

    /**
     * GET /media?offset=&limit=&album_id=
     * Contract: response shape { items, total, offset, limit }
     */
    async getMediaList(
        albumId?: number,
        offset: number = MEDIA_CONFIG.LIST.defaultOffset,
        limit: number = MEDIA_CONFIG.LIST.defaultLimit
    ): Promise<MediaListResponse> {
        try {
            const params: Record<string, number> = { offset, limit }
            if (typeof albumId === 'number') {
                params.album_id = albumId
            }

            const response = await scaffoldAdapter.get<MediaListResponse>(
                MEDIA_CONFIG.paths.media,
                { params }
            )
            return response.data
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to fetch media list')
        }
    }

    /**
     * GET /albums?offset=&limit=
     * Contract: response shape { items, total, offset, limit }
     */
    async getAlbumList(
        offset: number = MEDIA_CONFIG.LIST.defaultOffset,
        limit: number = MEDIA_CONFIG.LIST.defaultLimit
    ): Promise<AlbumListResponse> {
        try {
            const response = await scaffoldAdapter.get<AlbumListResponse>(
                MEDIA_CONFIG.paths.albums,
                { params: { offset, limit } }
            )
            return response.data
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to fetch albums')
        }
    }

    /**
     * POST /albums
     */
    async createAlbum(
        title: string,
        description?: string,
        isPublic?: boolean
    ): Promise<Album> {
        try {
            if (!title?.trim()) {
                throw new Error('Album title is required')
            }

            const payload: CreateAlbumRequest = {
                title: title.trim(),
                description,
                is_public: isPublic ?? false,
            }

            const response = await scaffoldAdapter.post<Album>(
                MEDIA_CONFIG.paths.albums,
                payload
            )
            return response.data
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to create album')
        }
    }

    /**
     * DELETE /media/{image_id}/delete
     */
    async deleteImage(imageId: string): Promise<void> {
        try {
            if (!imageId) {
                throw new Error('imageId is required')
            }

            await scaffoldAdapter.delete(MEDIA_CONFIG.paths.mediaDelete(imageId))
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to delete image')
        }
    }

    /**
     * PUT /media/{image_id}/update
     */
    async updateImageMetadata(
        imageId: string,
        updates: {
            tags?: string[]
            privacy_level?: PrivacyLevel
            album_id?: number | null
        }
    ): Promise<ImageMetadata> {
        try {
            if (!imageId) {
                throw new Error('imageId is required')
            }

            const payload: UpdateMediaRequest & { album_id?: number | null } = {
                ...updates,
            }

            const response = await scaffoldAdapter.put<ImageMetadata>(
                MEDIA_CONFIG.paths.mediaUpdate(imageId),
                payload
            )
            return response.data
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to update image metadata')
        }
    }

    private parseMediaError(error: unknown, defaultMessage: string): Error {
        if (axios.isAxiosError(error)) {
            const backendError = error.response?.data as StandardError | undefined
            if (backendError?.message) {
                return new Error(backendError.message)
            }

            if (error.response?.status === 401) return new Error('Session expired. Please log in again.')
            if (error.response?.status === 403) return new Error('Access denied.')
            if (error.response?.status === 404) return new Error('Resource not found.')
            if (error.response?.status === 409) return new Error('Conflict detected. Please retry.')
            if (error.response?.status === 400) return new Error('Invalid request.')
            if (error.code === 'ECONNABORTED') return new Error('Request timeout.')

            return new Error(error.message || defaultMessage)
        }

        if (error instanceof Error) return error
        return new Error(defaultMessage)
    }
}

export const mediaAdapter = new MediaAdapter()