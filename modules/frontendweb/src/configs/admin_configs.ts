/**
 * @file admin_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow admin (admin only): trigger reindex.
 *              Tách từ eval_configs.ts — admin và evaluation là 2 workflow
 *              ĐỘC LẬP (Tasks.yaml T003-07 vs T003-08), chỉ dùng CHUNG cơ
 *              chế phân quyền admin_authorization (data_schema.yaml), áp
 *              dụng nhất quán "1 workflow 1 file" như upload tách khỏi media.
 * @owner AG-04
 * @reference frontend.env.local, openapi.yaml POST /admin/reindex,
 *            data_schema.yaml admin_authorization
 */

import { getEnvNumberWithDefault } from '@/utils/env_helpers';

export const ADMIN_CONFIG = {
    /**
     * [CONTRACT] API paths — openapi.yaml Clause D, Admin.
     */
    paths: {
        reindex: '/admin/reindex',
    } as const,

    /**
     * [CONTRACT] openapi.yaml POST /admin/reindex request body: batch_size
     * default 100.
     */
    reindexDefaultBatchSize: getEnvNumberWithDefault('VITE_ADMIN_REINDEX_DEFAULT_BATCH_SIZE', 100),
} as const;

export type AdminConfigType = typeof ADMIN_CONFIG;