/**
 * @file media_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow media (Album/Media CRUD thuần túy —
 *              KHÔNG chứa upload): pagination Album/Media, polling trạng
 *              thái index sau upload.
 *              SỬA: đã xóa paths.uploadUrl — path này thuộc workflow
 *              upload, đã chuyển đúng chỗ sang UPLOAD_CONFIG.paths.presignedUrl
 *              ở upload_configs.ts. Giữ ở đây là field thừa, 2 nguồn cùng
 *              biết về 1 URL vi phạm nguyên tắc "1 nguồn duy nhất". Cũng
 *              đã xóa BULK_UPLOAD — thuộc workflow upload, đã chuyển thành
 *              UPLOAD_CONFIG.bulk.
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
} as const;

export type MediaConfigType = typeof MEDIA_CONFIG;