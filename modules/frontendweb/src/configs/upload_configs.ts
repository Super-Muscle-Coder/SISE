/**
 * @file upload_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow upload: path S1/S3, giới hạn file,
 *              polling status, bulk upload concurrency/retry.
 *              Trùng lặp có chủ đích maxFileSizeMb/allowedContentTypes với
 *              SCAFFOLD_CONFIG.UPLOAD — KHÔNG, thực ra đây LÀ cùng 1 giá trị
 *              dùng chung toàn app (presigned upload constraint áp dụng cả
 *              upload và search-by-image) nên ĐỌC LẠI SCAFFOLD_CONFIG.UPLOAD
 *              thay vì tự định nghĩa trùng — khác với PrivacyLevel/IndexStatus
 *              (những type thuần domain, không phải giá trị cấu hình môi
 *              trường dùng chung).
 * @owner AG-04
 * @reference frontend.env.local, openapi.yaml POST /media/upload-url,
 *            POST /media/upload/confirm
 */

import { getEnvNumberWithDefault } from '@/utils/env_helpers';
import { SCAFFOLD_CONFIG } from '../configs/scaffold_configs';

export const UPLOAD_CONFIG = {
    /**
     * [CONTRACT] API paths — openapi.yaml Clause D, upload_pipeline.
     */
    paths: {
        presignedUrl: '/media/upload-url', // S1
        confirm: '/media/upload/confirm', // S3
    } as const,

    /**
     * [CONTRACT] Giới hạn file — dùng LẠI SCAFFOLD_CONFIG.UPLOAD (nguồn duy
     * nhất, đã định nghĩa từ data_schema.yaml global_configs). KHÔNG tự
     * định nghĩa lại giá trị này ở đây.
     */
    fileConstraints: {
        maxFileSizeMb: SCAFFOLD_CONFIG.UPLOAD.maxFileSizeMb,
        allowedContentTypes: SCAFFOLD_CONFIG.UPLOAD.allowedContentTypes,
        expirySeconds: SCAFFOLD_CONFIG.UPLOAD.expirySeconds,
    } as const,

    /**
     * [UI-ONLY] Bulk upload — KHÔNG có trong hợp đồng (hợp đồng chỉ định
     * nghĩa 1 request S1 tại 1 thời điểm). Giới hạn hiệu năng phía client.
     */
    bulk: {
        maxConcurrentUploads: getEnvNumberWithDefault('VITE_MEDIA_BULK_MAX_CONCURRENT_UPLOADS', 3),
        maxRetries: getEnvNumberWithDefault('VITE_MEDIA_BULK_MAX_RETRIES', 2),
        maxFilesPerBatch: getEnvNumberWithDefault('VITE_MEDIA_BULK_MAX_FILES_PER_BATCH', 20),
        retryBackoffMs: getEnvNumberWithDefault('VITE_RETRY_BACKOFF_MS', 1000),
        retryBackoffFactor: getEnvNumberWithDefault('VITE_RETRY_BACKOFF_FACTOR', 2),
    } as const,

    /**
     * [UI-ONLY] Timeout riêng cho upload binary — dài hơn timeout API
     * thường vì file có thể lớn. KHÔNG có trong hợp đồng.
     */
    binaryUploadTimeoutMs: getEnvNumberWithDefault('VITE_API_TIMEOUT_MS', 10000) * 3,
} as const;

export type UploadConfigType = typeof UPLOAD_CONFIG;