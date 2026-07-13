/**
 * @file eval_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow evaluation (admin only): limit chạy
 *              đánh giá, polling chờ job hoàn thành, label nút bấm.
 *              Bao gồm cả cấu hình workflow admin (/admin/reindex) vì 2
 *              workflow này dùng chung cơ chế admin_authorization và
 *              thường xuất hiện cùng 1 màn hình Admin trên UI.
 * @owner AG-04
 * @reference frontend.env.local, openapi.yaml /eval/run, /eval/results/{eval_id},
 *            /eval/metrics, /admin/reindex
 */

import { getEnvVarWithDefault, getEnvNumberWithDefault } from '@/utils/env_helpers';

export const EVAL_CONFIG = {
    /**
     * [CONTRACT] API paths — openapi.yaml Clause D, EvaluationService.
     */
    paths: {
        run: '/eval/run',
        results: (evalId: string) => `/eval/results/${evalId}`,
        metrics: '/eval/metrics',
    } as const,

    /**
     * [CONTRACT] openapi.yaml POST /eval/run request body: limit default 100.
     */
    runDefaultLimit: getEnvNumberWithDefault('VITE_EVAL_RUN_DEFAULT_LIMIT', 100),

    /**
     * [UI-ONLY] /eval/run trả 202 (bất đồng bộ, status "running"). Hợp đồng
     * KHÔNG định nghĩa cơ chế polling/webhook — Frontend BẮT BUỘC tự poll
     * GET /eval/results/{eval_id} theo chu kỳ tự chọn cho tới khi status =
     * "completed"/"failed". KHÔNG dùng SCAFFOLD_CONFIG.RETRY cho việc này —
     * đó là 2 khái niệm khác nhau (retry lỗi request vs chờ job xong).
     */
    POLL: {
        intervalMs: getEnvNumberWithDefault('VITE_EVAL_POLL_INTERVAL_MS', 3000),
        maxDurationMs: getEnvNumberWithDefault('VITE_EVAL_POLL_MAX_DURATION_MS', 120000),
    } as const,

    /**
     * [UI-ONLY] Label nút bấm — thuần UI text, đổi tự do/i18n sau này.
     */
    labels: {
        runButton: getEnvVarWithDefault('VITE_EVAL_RUN_BUTTON_LABEL', 'Run Evaluation'),
        resetButton: getEnvVarWithDefault('VITE_EVAL_RESET_BUTTON_LABEL', 'Reset'),
    } as const,
} as const;

/**
 * [CONTRACT] Admin — openapi.yaml POST /admin/reindex. Cùng cơ chế
 * admin_authorization như /eval/run (data_schema.yaml Clause D).
 */
export const ADMIN_CONFIG = {
    paths: {
        reindex: '/admin/reindex',
    } as const,

    /**
     * [CONTRACT] openapi.yaml POST /admin/reindex request body: batch_size
     * default 100.
     */
    reindexDefaultBatchSize: getEnvNumberWithDefault('VITE_ADMIN_REINDEX_DEFAULT_BATCH_SIZE', 100),
} as const;

export type EvalConfigType = typeof EVAL_CONFIG;
export type AdminConfigType = typeof ADMIN_CONFIG;