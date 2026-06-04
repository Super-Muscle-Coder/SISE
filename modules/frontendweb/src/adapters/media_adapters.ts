// src/adapters/media_adapters.ts
// Gateway API calls + Isolated MinIO direct PUT client (no auth, no interceptors)
// T004-03: Single-file upload orchestration with clean separation of concerns

import axios, { AxiosError } from 'axios';
import {
  MediaItem,
  Album,
  PresignedUploadResponse,
  UploadResponse,
  ImageMetadata,
  MediaListResponse,
  StandardError,
  PrivacyLevel,
  IndexStatus,
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
   */
  async requestPresignedUrl(
    filename: string,
    contentType: string,
    expectedSizeMb?: number,
  ): Promise<PresignedUploadResponse> {
    try {
      const idempotencyKey = crypto.randomUUID(); // Q5: UUID v4 per upload stream
      const response = await scaffoldAdapter.post<PresignedUploadResponse>(
        MEDIA_CONFIG.paths.uploadUrl,
        {
          filename,
          content_type: contentType,
          expected_size_mb: expectedSizeMb,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw this.parseMediaError(error, MEDIA_CONFIG.messages.uploadInitError);
    }
  }

  /**
   * Confirm upload completion and register metadata (Step S3)
   * Called after binary PUT succeeds
   */
  async confirmUpload(
    objectKey: string,
    albumId: number | null,
    privacyLevel: PrivacyLevel,
    tags?: string[],
  ): Promise<UploadResponse> {
    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await scaffoldAdapter.post<UploadResponse>(
        MEDIA_CONFIG.paths.uploadConfirm,
        {
          object_key: objectKey,
          album_id: albumId,
          privacy_level: privacyLevel,
          tags: tags || [],
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw this.parseMediaError(error, MEDIA_CONFIG.messages.uploadConfirmError);
    }
  }

  /**
   * Fetch image metadata + presigned GET URL
   * Used for polling index_status and detail display
   */
  async getImageMetadata(imageId: string): Promise<ImageMetadata> {
    try {
      const url = MEDIA_CONFIG.paths.mediaGet.replace('{image_id}', imageId);
      const response = await scaffoldAdapter.get<ImageMetadata>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new Error(MEDIA_CONFIG.messages.privacyDenied);
      }
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(MEDIA_CONFIG.messages.imageNotFound);
      }
      throw this.parseMediaError(error, 'Failed to fetch image metadata');
    }
  }

  /**
   * Fetch paginated media list (optionally filtered by album_id)
   */
  async getMediaList(
    albumId?: number,
    page: number = 1,
    pageSize: number = MEDIA_CONFIG.pagination.defaultPageSize,
  ): Promise<MediaListResponse> {
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (albumId !== undefined) {
        params.album_id = albumId;
      }
      const response = await scaffoldAdapter.get<MediaListResponse>(
        MEDIA_CONFIG.paths.mediaList,
        { params },
      );
      return response.data;
    } catch (error) {
      throw this.parseMediaError(error, 'Failed to fetch media list');
    }
  }

  /**
   * Get list of user's albums for dropdown/selector
   */
  async getAlbumList(): Promise<Album[]> {
    try {
      const response = await scaffoldAdapter.get<Album[]>(
        MEDIA_CONFIG.paths.albumList,
      );
      return response.data;
    } catch (error) {
      throw this.parseMediaError(error, 'Failed to fetch albums');
    }
  }

  /**
   * Create new album
   * Q7: Album CRUD minimal scope — simple endpoint for binding images
   */
  async createAlbum(
    title: string,
    description?: string,
    isPublic?: boolean,
  ): Promise<Album> {
    try {
      const response = await scaffoldAdapter.post<Album>(
        MEDIA_CONFIG.paths.albumCreate,
        {
          title,
          description,
          is_public: isPublic ?? false,
        },
      );
      return response.data;
    } catch (error) {
      throw this.parseMediaError(error, 'Failed to create album');
    }
  }

  /**
   * Delete image by ID (soft delete server-side)
   */
  async deleteImage(imageId: string): Promise<void> {
    try {
      const url = MEDIA_CONFIG.paths.mediaDelete.replace('{image_id}', imageId);
      await scaffoldAdapter.delete(url);
    } catch (error) {
      throw this.parseMediaError(error, 'Failed to delete image');
    }
  }

  /**
   * Update image metadata (tags, privacy_level, album_id)
   */
  async updateImageMetadata(
    imageId: string,
    updates: {
      tags?: string[];
      privacy_level?: PrivacyLevel;
      album_id?: number | null;
    },
  ): Promise<MediaItem> {
    try {
      const url = `${MEDIA_CONFIG.paths.mediaDelete.replace('{image_id}', imageId)}/update`;
      const response = await scaffoldAdapter.put<MediaItem>(url, updates);
      return response.data;
    } catch (error) {
      throw this.parseMediaError(error, 'Failed to update image');
    }
  }

  /**
   * Parse backend error responses into user-friendly messages
   */
  private parseMediaError(error: unknown, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const backendError = error.response?.data as StandardError | undefined;
      if (backendError?.message) {
        return new Error(backendError.message);
      }
      if (error.response?.status === 409) {
        const conflictError = new Error(
          'Duplicate upload request. Image may already exist. Check your gallery.'
        );
        (conflictError as any).statusCode = 409;
        return conflictError;
      }
      if (error.response?.status === 413) {
        return new Error(
          'File is too large. Maximum size is ' +
            MEDIA_CONFIG.upload.maxFileSizeMb +
            'MB.'
        );
      }
    }
    return new Error(defaultMessage);
  }
}

// ============================================================================
// ISOLATED MINION DIRECT PUT CLIENT (NO AUTH, NO INTERCEPTORS) [Q3 Decision]
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

export class DirectMinIOUploadClient {
  private axiosInstance = axios.create({
    // NO baseURL — each upload_url is absolute
    timeout: 60000, // 60 seconds for large file transfers
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
    onProgress?: (loaded: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    try {
      const config = {
        timeout: 60000,
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