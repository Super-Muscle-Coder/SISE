/**
 * @file eval_adapters.ts
 * @layer adapters
 * @description Adapter layer for evaluation workflow (admin only).
 *              SỬA (phát hiện Blocking khi test benchmark thật với
 *              limit=500): runEvaluation() trước đây KHÔNG truyền config
 *              riêng cho scaffoldAdapter.post(), nên dùng đúng
 *              SCAFFOLD_CONFIG.API.timeoutMs mặc định (10000ms = 10s) —
 *              nhưng POST /eval/run chạy ĐỒNG BỘ (data_schema.yaml xác
 *              nhận: benchmark tính toán trong chính request, không dùng
 *              Celery), và với limit=500 (tính embedding + so sánh cosine
 *              similarity cho 500 ảnh), thời gian xử lý thực tế VƯỢT XA
 *              10 giây — gây "Request timeout" ở tầng client dù Backend
 *              vẫn đang xử lý bình thường (không log lỗi nào ở
 *              Backend/AI/Storage, xác nhận qua Docker logs thật). Thêm
 *              timeout RIÊNG cho endpoint này, đọc từ config mới
 *              (EVAL_CONFIG.runTimeoutMs), tách khỏi timeout chung của
 *              scaffoldAdapter — giống pattern đã dùng cho
 *              searchByImage() (Nhóm 3) khi cần timeout khác mặc định.
 * @owner AG-04
 */

import axios from 'axios'
import { scaffoldAdapter } from './scaffold_adapters'
import { EVAL_CONFIG } from '../configs/eval_configs'
import { ERROR_CODES } from '../entities/scaffold_entities'
import type { StandardError } from '../entities/scaffold_entities'
import type {
    EvaluationMetrics,
    EvaluationResult,
    RunEvaluationRequest,
    RunEvaluationResponse,
} from '../entities/eval_entities'

function extractBackendMessage(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null
    const record = data as Record<string, unknown>

    if (typeof record.message === 'string' && record.message.trim()) {
        return record.message
    }

    if (typeof record.detail === 'string' && record.detail.trim()) {
        return record.detail
    }

    return null
}

function normalizeEvalError(error: unknown, fallbackMessage: string): StandardError {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status

        if (status === 403) {
            return {
                code: ERROR_CODES.FORBIDDEN_ADMIN_ONLY,
                message: 'This endpoint requires admin role',
                details: { httpStatus: 403 },
            }
        }

        // SỬA: phân biệt rõ timeout thật (request quá lâu) với network
        // error khác — trước đây cả 2 đều rơi vào cùng 1 message chung
        // chung, khó chẩn đoán khi debug thật (đã xác nhận qua case thật:
        // "Request timeout" hiển thị đúng nhưng dễ nhầm là network error).
        if (error.code === 'ECONNABORTED') {
            return {
                code: 'ERR_EVAL_TIMEOUT',
                message: `Evaluation is taking longer than ${EVAL_CONFIG.runTimeoutMs / 1000}s. It may still be running on the server — try "Refresh Metrics" again in a moment.`,
                details: { httpStatus: status },
            }
        }

        const backendData = error.response?.data as Record<string, unknown> | undefined
        const backendCode = typeof backendData?.code === 'string' ? backendData.code : null
        const backendMessage = extractBackendMessage(backendData)

        return {
            code: backendCode || (status ? `HTTP_${status}` : 'ERR_EVAL_REQUEST_FAILED'),
            message: backendMessage || error.message || fallbackMessage,
            details: { httpStatus: status },
        }
    }

    if (typeof error === 'object' && error !== null) {
        const e = error as Record<string, unknown>
        if (typeof e.code === 'string' && typeof e.message === 'string') {
            return {
                code: e.code,
                message: e.message,
                details:
                    typeof e.details === 'object' && e.details !== null
                        ? (e.details as Record<string, unknown>)
                        : undefined,
            }
        }
    }

    return {
        code: 'ERR_EVAL_REQUEST_FAILED',
        message: fallbackMessage,
    }
}

export class EvalAdapter {
    /**
     * POST /eval/run — SỬA: response giờ trả ĐẦY ĐỦ (4 chỉ số cốt lõi +
     * breakdown_by_class + cross_class_confusion_matrix +
     * misclassified_queries) sau khi AG-03 thiết kế lại ground truth theo
     * tag-class (trước đây self-retrieval). Kiểu trả về RunEvaluationResponse
     * đã mở rộng tương ứng trong eval_entities.ts — logic gọi API ở đây
     * KHÔNG đổi (timeout riêng + skipRetry vẫn giữ nguyên từ lần sửa
     * trước, vì endpoint vẫn chạy đồng bộ, thời gian xử lý không đổi).
     */
    async runEvaluation(payload?: RunEvaluationRequest): Promise<RunEvaluationResponse> {
        const body: RunEvaluationRequest = {
            limit: payload?.limit ?? EVAL_CONFIG.runDefaultLimit,
            ...(typeof payload?.seed === 'number' ? { seed: payload.seed } : {}),
        }

        try {
            // SỬA: truyền timeout RIÊNG (EVAL_CONFIG.runTimeoutMs, mặc định
            // 5 phút) VÀ tắt hẳn retry cho request này — POST /eval/run
            // KHÔNG idempotent theo thiết kế thông thường (mỗi lần gọi tạo
            // 1 bản ghi eval_id MỚI trong evaluation_runs, khác hẳn
            // /media/upload-url có Idempotency-Key dedupe thật). Nếu để
            // retry interceptor tự thử lại khi timeout, có thể kích hoạt
            // NHIỀU lần chạy benchmark trùng lặp trong Backend (tối đa 4
            // lần: 1 gốc + 3 retry, mỗi lần tới 5 phút = 20+ phút), làm
            // nhiễu dữ liệu benchmark dùng cho báo cáo. skipRetry đọc bởi
            // setupRetryInterceptor() (scaffold_adapters.ts) — request nào
            // đánh dấu cờ này sẽ bỏ qua toàn bộ logic retry, chỉ thử đúng 1
            // lần rồi báo lỗi ngay nếu thất bại.
            const response = await scaffoldAdapter.post<RunEvaluationResponse>(
                EVAL_CONFIG.paths.run,
                body,
                { timeout: EVAL_CONFIG.runTimeoutMs, skipRetry: true } as never
            )
            return response.data
        } catch (error) {
            throw normalizeEvalError(error, 'Failed to start evaluation.')
        }
    }

    async getEvaluationResults(evalId: string): Promise<EvaluationResult> {
        try {
            const response = await scaffoldAdapter.get<EvaluationResult>(
                EVAL_CONFIG.paths.results(evalId)
            )
            return response.data
        } catch (error) {
            throw normalizeEvalError(error, 'Failed to fetch evaluation results.')
        }
    }

    async getEvaluationMetrics(): Promise<EvaluationMetrics> {
        try {
            const response = await scaffoldAdapter.get<EvaluationMetrics>(
                EVAL_CONFIG.paths.metrics
            )
            return response.data
        } catch (error) {
            throw normalizeEvalError(error, 'Failed to fetch evaluation metrics.')
        }
    }
}

export const evalAdapter = new EvalAdapter()