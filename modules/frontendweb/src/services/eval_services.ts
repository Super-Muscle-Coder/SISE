/**
 * @file eval_services.ts
 * @layer services
 * @description Service hooks for evaluation workflow.
 *              SỬA (Blocking): useRunEvaluation() trước đây thiết kế cho
 *              luồng BẤT ĐỒNG BỘ cũ (gọi POST /eval/run lấy eval_id →
 *              polling GET /eval/results/{id} tới khi completed). Sau khi
 *              AG-03 thiết kế lại ground truth (tag-class thay self-
 *              retrieval), POST /eval/run giờ CHẠY ĐỒNG BỘ và trả về ĐẦY
 *              ĐỦ kết quả (4 chỉ số cốt lõi + breakdown_by_class +
 *              cross_class_confusion_matrix + misclassified_queries)
 *              NGAY TRONG RESPONSE — không cần polling nữa. Giữ nguyên
 *              logic polling cũ sẽ KHÔNG BAO GIỜ nhận được breakdown/
 *              confusion matrix, vì GET /eval/results/{id} không có các
 *              field mở rộng đó (đã xác nhận qua response JSON thật).
 *              Bỏ hẳn polling, dùng thẳng response của runEvaluation().
 * @owner AG-04
 */

import { useCallback, useState } from 'react'
import { evalAdapter } from '../adapters/eval_adapters'
import type {
    EvaluationMetrics,
    RunEvaluationRequest,
    RunEvaluationResponse,
} from '../entities/eval_entities'

function toErrorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback
    const e = error as Record<string, unknown>
    if (typeof e.message === 'string' && e.message.trim()) return e.message
    return fallback
}

export function useRunEvaluation() {
    const [isRunning, setIsRunning] = useState(false)
    const [result, setResult] = useState<RunEvaluationResponse | null>(null)
    const [error, setError] = useState<string | null>(null)
    // SỬA: đổi ý nghĩa isTimedOut — trước đây là timeout của POLLING
    // (chờ job xong), giờ là timeout của CHÍNH REQUEST /eval/run (đọc
    // qua eval_adapters.ts: error.code === 'ERR_EVAL_TIMEOUT' khi
    // ECONNABORTED, đã xử lý sẵn message rõ ràng ở tầng adapter).
    const [isTimedOut, setIsTimedOut] = useState(false)

    const run = useCallback(async (payload?: RunEvaluationRequest) => {
        setIsRunning(true)
        setResult(null)
        setError(null)
        setIsTimedOut(false)

        try {
            // POST /eval/run giờ ĐỒNG BỘ — Promise chỉ resolve khi Backend
            // đã tính xong TOÀN BỘ benchmark (4 chỉ số + breakdown +
            // confusion matrix + misclassified_queries). Không cần
            // polling — response này LÀ kết quả cuối cùng.
            const response = await evalAdapter.runEvaluation(payload)
            setResult(response)
        } catch (runError) {
            const e = runError as { code?: string; message?: string }
            if (e?.code === 'ERR_EVAL_TIMEOUT') {
                setIsTimedOut(true)
            }
            setError(toErrorMessage(runError, 'Failed to run evaluation.'))
        } finally {
            setIsRunning(false)
        }
    }, [])

    return {
        isRunning,
        result,
        error,
        isTimedOut,
        run,
    }
}

export function useEvaluationMetrics() {
    const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchMetrics = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const data = await evalAdapter.getEvaluationMetrics()
            setMetrics(data)
        } catch (err) {
            setError(toErrorMessage(err, 'Failed to fetch evaluation metrics.'))
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        metrics,
        isLoading,
        error,
        fetchMetrics,
    }
}