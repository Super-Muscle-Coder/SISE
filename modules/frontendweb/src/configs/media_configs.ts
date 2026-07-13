/**
 * @file media_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow media: pagination Album/Media,
 *              polling trạng thái index sau upload, bulk upload concurrency.
 * @owner AG-04
 * @reference frontend.env.local, openapi.yaml /albums, /media/*
 */

import { getEnvNumberWithDefault } from '@/utils/env_helpers';

export const MEDIA_CONFIG = {
    /**
     * [CONTRACT] openapi.yaml GET /albums, GET /media — offset/limit default
     * tường minh trong request query params.
     */
    LIST: {
        defaultLimit: getEnvNumberWithDefault('VITE_MEDIA_LIST_DEFAULT_LIMIT', 20),
        defaultOffset: getEnvNumberWithDefault('VITE_MEDIA_LIST_DEFAULT_OFFSET', 0),
    } as const,

    /**
     * [CONTRACT] API paths — openapi.yaml Clause D, Albums & Media.
     */
    paths: {
        albums: '/albums',
        albumDetail: (albumId: number) => `/albums/${albumId}`,
        media: '/media',
        mediaDetail: (imageId: string) => `/media/${imageId}`,
        mediaUpdate: (imageId: string) => `/media/${imageId}/update`,
        mediaDelete: (imageId: string) => `/media/${imageId}/delete`,
        // [CONTRACT] S1_Presigned — data_schema.yaml transaction_semantics.upload_pipeline
        uploadUrl: '/media/upload-url',
    } as const,

    /**
     * [UI-ONLY] Polling trạng thái index_status sau khi upload. Hợp đồng
     * KHÔNG định nghĩa endpoint tra cứu job riêng cho việc index 1 ảnh —
     * Frontend tự poll lại GET /media/{image_id} hoặc GET /media để thấy
     * index_status chuyển từ "pending" sang "ready"/"failed".
     */
    INDEX_POLL: {
        intervalMs: getEnvNumberWithDefault('VITE_MEDIA_INDEX_STATUS_POLL_INTERVAL_MS', 3000),
        maxRetries: getEnvNumberWithDefault('VITE_MEDIA_MAX_POLL_RETRIES', 10),
    } as const,

    /**
     * [UI-ONLY] Bulk upload — KHÔNG có trong hợp đồng (hợp đồng chỉ định
     * nghĩa 1 request S1_Presigned tại 1 thời điểm). Giới hạn số upload
     * đồng thời là quyết định hiệu năng phía client thuần túy.
     */
    BULK_UPLOAD: {
        maxConcurrentUploads: getEnvNumberWithDefault('VITE_MEDIA_BULK_MAX_CONCURRENT_UPLOADS', 3),
        maxRetries: getEnvNumberWithDefault('VITE_MEDIA_BULK_MAX_RETRIES', 2),
        maxFilesPerBatch: getEnvNumberWithDefault('VITE_MEDIA_BULK_MAX_FILES_PER_BATCH', 20),
    } as const,
} as const;

export type MediaConfigType = typeof MEDIA_CONFIG;