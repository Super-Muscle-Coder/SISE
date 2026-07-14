/**
 * @file upload_adapters.ts
 * @layer adapters
 * @description Upload workflow adapters:
 *              - S1 request presigned URL (gateway via scaffoldAdapter)
 *              - S2 direct binary PUT to MinIO (isolated axios client)
 *              - S3 confirm upload metadata (gateway via scaffoldAdapter)
 * @owner AG-04
 */

import axios, { AxiosError } from 'axios'
import { scaffoldAdapter } from './scaffold_adapters'
import { UPLOAD_CONFIG } from '../configs/upload_configs'
import type {
    PresignedUploadRequest,
    PresignedUploadResponse,
    UploadConfirmRequest,
    UploadResponse,
    UploadPrivacyLevel,
} from '../entities/upload_entities'
import type { StandardError } from '../entities/scaffold_entities'

export interface UploadProgressCallback {
    (loaded: number, total: number): void
}

function isAxiosConflictWithData<T>(error: unknown): error is AxiosError<T> {
    if (!axios.isAxiosError(error)) return false
    return error.response?.status === 409 && error.response.data !== undefined
}

function normalizeUploadError(error: unknown, fallbackMessage: string): StandardError {
    const e = error as Record<string, unknown>

    const code =
        (typeof e?.code === 'string' && e.code) ||
        ((e?.response as { status?: number } | undefined)?.status
            ? `HTTP_${String((e.response as { status: number }).status)}`
            : 'ERR_UPLOAD_FAILED')

    const message =
        (typeof e?.message === 'string' && e.message) ||
        fallbackMessage

    return {
        code,
        message,
        details: {
            raw: e,
        },
    }
}

export class UploadAdapter {
    /**
     * S1: Request presigned upload URL
     * 409 idempotency response is treated as success (returns same schema as success).
     */
    async requestPresignedUrl(
        filename: string,
        contentType: string,
        expectedSizeMb?: number
    ): Promise<PresignedUploadResponse> {
        if (!filename || !contentType) {
            throw {
                code: 'ERR_INVALID_REQUEST',
                message: 'filename and content_type are required',
            } as StandardError
        }

        const payload: PresignedUploadRequest = {
            filename,
            content_type: contentType,
            expected_size_mb: expectedSizeMb,
        }

        try {
            const response = await scaffoldAdapter.post<PresignedUploadResponse>(
                UPLOAD_CONFIG.paths.presignedUrl,
                payload
            )

            this.validatePresignedResponse(response.data)
            return response.data
        } catch (error) {
            if (isAxiosConflictWithData<PresignedUploadResponse>(error)) {
                this.validatePresignedResponse(error.response!.data)
                return error.response!.data
            }

            throw normalizeUploadError(
                error,
                'Failed to request presigned upload URL.'
            )
        }
    }

    /**
     * S3: Confirm uploaded object
     * 409 idempotency response is treated as success (returns same schema as success).
     */
    async confirmUpload(
        objectKey: string,
        albumId: number,
        privacyLevel: UploadPrivacyLevel,
        tags?: string[]
    ): Promise<UploadResponse> {
        if (!objectKey) {
            throw {
                code: 'ERR_INVALID_REQUEST',
                message: 'object_key is required',
            } as StandardError
        }

        const payload: UploadConfirmRequest = {
            object_key: objectKey,
            album_id: albumId,
            privacy_level: privacyLevel,
            tags: tags ?? [],
        }

        try {
            const response = await scaffoldAdapter.post<UploadResponse>(
                UPLOAD_CONFIG.paths.confirm,
                payload
            )
            return response.data
        } catch (error) {
            if (isAxiosConflictWithData<UploadResponse>(error)) {
                return error.response!.data
            }

            throw normalizeUploadError(
                error,
                'Failed to confirm uploaded file.'
            )
        }
    }

    private validatePresignedResponse(response: PresignedUploadResponse): void {
        if (!response.upload_url || !response.upload_url.trim()) {
            throw {
                code: 'ERR_INVALID_RESPONSE',
                message: 'Invalid presigned response: missing upload_url.',
            } as StandardError
        }

        if (!response.object_key || !response.object_key.trim()) {
            throw {
                code: 'ERR_INVALID_RESPONSE',
                message: 'Invalid presigned response: missing object_key.',
            } as StandardError
        }

        if (typeof response.expires_in_sec !== 'number' || response.expires_in_sec <= 0) {
            throw {
                code: 'ERR_INVALID_RESPONSE',
                message: 'Invalid presigned response: expires_in_sec must be positive.',
            } as StandardError
        }
    }
}

/**
 * Isolated direct PUT client for MinIO presigned URL upload (S2).
 * Intentionally does NOT use scaffoldAdapter.
 */
export class DirectMinIOUploadClient {
    private readonly axiosInstance = axios.create({
        timeout: UPLOAD_CONFIG.binaryUploadTimeoutMs,
    })

    async uploadBinary(
        presignedUrl: string,
        fileBlob: Blob,
        onProgress?: UploadProgressCallback,
        signal?: AbortSignal
    ): Promise<string> {
        if (!presignedUrl) {
            throw {
                code: 'ERR_INVALID_REQUEST',
                message: 'Presigned URL is required.',
            } as StandardError
        }

        if (!fileBlob) {
            throw {
                code: 'ERR_INVALID_REQUEST',
                message: 'File blob is required.',
            } as StandardError
        }

        try {
            const response = await this.axiosInstance.put(presignedUrl, fileBlob, {
                timeout: UPLOAD_CONFIG.binaryUploadTimeoutMs,
                signal,
                onUploadProgress: (event) => {
                    if (onProgress && event.total) {
                        onProgress(event.loaded, event.total)
                    }
                },
            })

            return response.headers['etag'] || response.headers['x-amz-meta-etag'] || 'unknown'
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ERR_CANCELED') {
                    throw {
                        code: 'ERR_UPLOAD_CANCELLED',
                        message: 'Upload canceled by user.',
                    } as StandardError
                }

                if (error.code === 'ECONNABORTED') {
                    throw {
                        code: 'ERR_UPLOAD_TIMEOUT',
                        message: 'Upload timeout: network disconnected or server unresponsive.',
                    } as StandardError
                }

                throw {
                    code: 'ERR_UPLOAD_BINARY_FAILED',
                    message: `Upload failed: ${error.message}`,
                    details: { status: error.response?.status },
                } as StandardError
            }

            throw normalizeUploadError(error, 'Upload failed: unknown error.')
        }
    }
}

export const uploadAdapter = new UploadAdapter()
export const directMinIOUploadClient = new DirectMinIOUploadClient()