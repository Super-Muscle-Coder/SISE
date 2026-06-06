/**
 * @file media_adapters.ts
 * @layer adapters
 * @description Gateway API calls + Isolated MinIO direct PUT client (no auth, no interceptors)
 *              T004-03: Single-file upload orchestration with clean separation of concerns
 * @owner AG-04
 */

import axios, { AxiosError } from 'axios';
import {
    Album,
    MediaItem,
    PresignedUploadRequest,
    PresignedUploadResponse,
    UploadConfirmRequest,
    UploadResponse,
    ImageMetadata,
    MediaListResponse,
    StandardError,
    PrivacyLevel,
} from '@/entities/media_entities';
import { MEDIA_CONFIG } from '@/configs/media_configs';
import { scaffoldAdapter } from '@/adapters/scaffold_adapter_instance';

// ============================================================================
// GATEWAY ADAPTER (uses scaffoldAdapter for auth'd requests)
// ============================================================================

export class MediaAdapter {
    /**
     * Request presigned URL for direct MinIO upload
     * Step S1: Request → receive upload_url, object_key, expires_in_sec
     * Endpoint: POST /media/upload-url
     */
    async requestPresignedUrl(
        filename: string,
        contentType: string,
        expectedSizeMb?: number
    ): Promise<PresignedUploadResponse> {
        try {
            // Validate inputs
            if (!filename || !contentType) {
                throw new Error('filename and content_type are required');
            }

            const idempotencyKey = crypto.randomUUID(); // Q5: UUID v4 per upload stream
            const payload: PresignedUploadRequest = {
                filename,
                content_type: contentType,
                expected_size_mb: expectedSizeMb,
            };

            const response = await scaffoldAdapter.post<PresignedUploadResponse>(
                MEDIA_CONFIG.paths.uploadUrl,
                payload,
                {
                    headers: {
                        'Idempotency-Key': idempotencyKey,
                    },
                }
            );

            // Validate response schema
            this.validatePresignedResponse(response.data);
            return response.data;
        } catch (error) {
            throw this.parseMediaError(error, MEDIA_CONFIG.messages.uploadInitError);
        }
    }

    /**
     * Confirm upload completion and register metadata (Step S3)
     * Called after binary PUT succeeds
     * Endpoint: POST /media/upload/confirm
     */
    async confirmUpload(
        objectKey: string,
        albumId: number | null,
        privacyLevel: PrivacyLevel,
        tags?: string[]
    ): Promise<UploadResponse> {
        try {
            // Validate inputs
            if (!objectKey) {
                throw new Error('object_key is required');
            }

            const idempotencyKey = crypto.randomUUID();
            const payload: UploadConfirmRequest = {
                object_key: objectKey,
                album_id: albumId,
                privacy_level: privacyLevel,
                tags: tags || [],
            };

            const response = await scaffoldAdapter.post<UploadResponse>(
                MEDIA_CONFIG.paths.uploadConfirm,
                payload,
                {
                    headers: {
                        'Idempotency-Key': idempotencyKey,
                    },
                }
            );

            return response.data;
        } catch (error) {
            throw this.parseMediaError(error, MEDIA_CONFIG.messages.uploadConfirmError);
        }
    }

    /**
     * Fetch image metadata + presigned GET URL
     * Used for polling index_status and detail display
     * Endpoint: GET /media/{image_id}
     */
    async getImageMetadata(imageId: string): Promise<ImageMetadata> {
        try {
            if (!imageId) {
                throw new Error('imageId is required');
            }

            const url = MEDIA_CONFIG.paths.mediaGet.replace('{image_id}', imageId);
            const response = await scaffoldAdapter.get<ImageMetadata>(url);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 403) {
                    throw new Error(MEDIA_CONFIG.messages.privacyDenied);
                }
                if (error.response?.status === 404) {
                    throw new Error(MEDIA_CONFIG.messages.imageNotFound);
                }
            }
            throw this.parseMediaError(error, 'Failed to fetch image metadata');
        }
    }

    /**
     * Fetch paginated media list (optionally filtered by album_id)
     * Endpoint: GET /media?album_id=N&page=N&page_size=M
     */
    async getMediaList(
        albumId?: number,
        page: number = 1,
        pageSize: number = MEDIA_CONFIG.pagination.defaultPageSize
    ): Promise<MediaListResponse> {
        try {
            const params: Record<string, unknown> = { page, page_size: pageSize };
            if (albumId !== undefined) {
                params.album_id = albumId;
            }

            const response = await scaffoldAdapter.get<MediaListResponse>(
                MEDIA_CONFIG.paths.mediaList,
                { params }
            );

            return response.data;
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to fetch media list');
        }
    }

    /**
     * Get list of user's albums for dropdown/selector
     * Endpoint: GET /albums
     */
    async getAlbumList(): Promise<Album[]> {
        try {
            const response = await scaffoldAdapter.get<Album[]>(MEDIA_CONFIG.paths.albumList);
            return response.data;
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to fetch albums');
        }
    }

    /**
     * Create new album
     * Endpoint: POST /albums
     */
    async createAlbum(
        title: string,
        description?: string,
        isPublic?: boolean
    ): Promise<Album> {
        try {
            if (!title) {
                throw new Error('Album title is required');
            }

            const response = await scaffoldAdapter.post<Album>(MEDIA_CONFIG.paths.albumCreate, {
                title,
                description,
                is_public: isPublic ?? false,
            });

            return response.data;
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to create album');
        }
    }

    /**
     * Delete image by ID (soft delete server-side)
     * Endpoint: DELETE /media/{image_id}
     */
    async deleteImage(imageId: string): Promise<void> {
        try {
            if (!imageId) {
                throw new Error('imageId is required');
            }

            const url = MEDIA_CONFIG.paths.mediaDelete.replace('{image_id}', imageId);
            await scaffoldAdapter.delete(url);
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to delete image');
        }
    }

    /**
     * Update image metadata (tags, privacy_level, album_id)
     * Endpoint: PUT /media/{image_id}/update
     */
    async updateImageMetadata(
        imageId: string,
        updates: {
            tags?: string[];
            privacy_level?: PrivacyLevel;
            album_id?: number | null;
        }
    ): Promise<MediaItem> {
        try {
            if (!imageId) {
                throw new Error('imageId is required');
            }

            const url = MEDIA_CONFIG.paths.mediaUpdate.replace('{image_id}', imageId);
            const response = await scaffoldAdapter.put<MediaItem>(url, updates);
            return response.data;
        } catch (error) {
            throw this.parseMediaError(error, 'Failed to update image');
        }
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    /**
     * Validate presigned URL response schema
     */
    private validatePresignedResponse(response: PresignedUploadResponse): void {
        if (!response.upload_url || !response.object_key) {
            throw new Error('Invalid presigned response: missing upload_url or object_key');
        }

        if (response.expires_in_sec <= 0) {
            throw new Error('Invalid presigned response: expires_in_sec must be positive');
        }
    }

    /**
     * Parse backend error responses into user-friendly messages
     */
    private parseMediaError(error: unknown, defaultMessage: string): Error {
        if (axios.isAxiosError(error)) {
            const backendError = error.response?.data as StandardError | undefined;

            // Backend error with message
            if (backendError?.message) {
                return new Error(backendError.message);
            }

            // Status-specific handling
            if (error.response?.status === 409) {
                // Idempotency conflict — not an error, but inform user
                const conflictError = new Error(
                    'This file appears to already be uploading or has been uploaded. Check your gallery.'
                );
                (conflictError as any).statusCode = 409;
                return conflictError;
            }

            if (error.response?.status === 413) {
                return new Error(MEDIA_CONFIG.messages.fileTooLarge);
            }

            if (error.response?.status === 400) {
                return new Error(backendError?.message || 'Invalid request. Please check your input.');
            }

            if (error.response?.status === 401) {
                return new Error('Session expired. Please log in again.');
            }

            if (error.response?.status === 403) {
                return new Error(MEDIA_CONFIG.messages.privacyDenied);
            }

            if (error.response?.status === 404) {
                return new Error(MEDIA_CONFIG.messages.imageNotFound);
            }

            if (error.code === 'ECONNABORTED') {
                return new Error('Request timeout. Please check your connection.');
            }

            if (error.message) {
                return new Error(error.message);
            }
        }

        return new Error(defaultMessage);
    }
}

// ============================================================================
// ISOLATED MINION DIRECT PUT CLIENT (NO AUTH, NO INTERCEPTORS)
// ============================================================================
/**
 * Completely separate, clean HTTP client for direct binary PUT to MinIO.
 * Must have:
 *   - NO base URL
 *   - NO authorization headers
 *   - NO global interceptors
 *   - NO scaffoldAdapter references
 *
 * This ensures minimal overhead and clean separation from auth-protected API calls.
 */

export interface UploadProgressCallback {
    (loaded: number, total: number): void;
}

export class DirectMinIOUploadClient {
    private axiosInstance = axios.create({
        // NO baseURL — each upload_url is absolute
        timeout: MEDIA_CONFIG.api.timeoutMs * 3, // 30 seconds for file upload
    });

    /**
     * Upload binary file directly to presigned MinIO URL
     * Step S2: Client PUT binary blob → MinIO returns 200 + ETag
     *
     * @param presignedUrl - Full presigned PUT URL from Step S1
     * @param fileBlob - File data (Blob from input[type=file])
     * @param onProgress - Progress callback: (loaded, total) => void (optional)
     * @param signal - AbortSignal for cancellation
     * @returns ETag from MinIO response header
     */
    async uploadBinary(
        presignedUrl: string,
        fileBlob: Blob,
        onProgress?: UploadProgressCallback,
        signal?: AbortSignal
    ): Promise<string> {
        try {
            if (!presignedUrl) {
                throw new Error('Presigned URL is required');
            }

            if (!fileBlob) {
                throw new Error('File blob is required');
            }

            const config = {
                timeout: MEDIA_CONFIG.api.timeoutMs * 3,
                signal: signal, // Propagate abort signal to Axios
                onUploadProgress: (progressEvent: any) => {
                    if (onProgress && progressEvent.lengthComputable) {
                        onProgress(progressEvent.loaded, progressEvent.total);
                    }
                },
            };

            const response = await this.axiosInstance.put(presignedUrl, fileBlob, config);

            // Extract ETag from response (MinIO sets this header)
            const eTag = response.headers['etag'] || response.headers['x-amz-meta-etag'] || 'unknown';
            return eTag;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ERR_CANCELED') {
                    throw new Error('Upload canceled by user');
                }
                if (error.code === 'ECONNABORTED') {
                    throw new Error('Upload timeout: network disconnected or server unresponsive');
                }
                throw new Error(`Upload failed: ${error.message} (HTTP ${error.response?.status})`);
            }
            throw new Error('Upload failed: unknown error');
        }
    }
}

// ============================================================================
// SINGLETON EXPORTS
// ============================================================================

export const mediaAdapter = new MediaAdapter();
export const directMinIOUploadClient = new DirectMinIOUploadClient();

// Type imports for external use
export type { Album } from '@/entities/media_entities';