/**
 * @file eval_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow evaluation (admin only): limit chạy
 *              đánh giá, polling chờ job hoàn thành, label nút bấm.
 *              SỬA (phát hiện Blocking khi test benchmark thật):
 *              runEvaluation() dùng timeout mặc định của scaffoldAdapter
 *              (10s) — quá ngắn cho endpoint chạy ĐỒNG BỘ với limit lớn
 *              (500 ảnh). Thêm runTimeoutMs riêng (mặc định 5 phút), tách
 *              khỏi VITE_API_TIMEOUT_MS chung.
 * @owner AG-04
 * @reference frontend.env.local, openapi.yaml /eval/run,
 *            /eval/results/{eval_id}, /eval/metrics
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
     * [BENCHMARK-TUNED] Timeout RIÊNG cho POST /eval/run — endpoint chạy
     * ĐỒNG BỘ (data_schema.yaml xác nhận: tính toán trong chính request,
     * không dùng Celery), với runDefaultLimit lớn (vd 500), thời gian xử
     * lý thực tế có thể vượt xa VITE_API_TIMEOUT_MS chung (10s). Mặc định
     * 5 phút — đủ cho benchmark quy mô vài trăm ảnh trên máy phát triển
     * cục bộ. Request này CŨNG tắt retry (xem eval_adapters.ts
     * skipRetry: true) — không idempotent, mỗi lần gọi tạo 1 bản ghi
     * eval_id mới, retry tự động khi timeout có thể gây benchmark chạy
     * trùng lặp nhiều lần.
     */
    runTimeoutMs: getEnvNumberWithDefault('VITE_EVAL_RUN_TIMEOUT_MS', 600000),

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

export type EvalConfigType = typeof EVAL_CONFIG;