/**
 * @file eval_entities.ts
 * @layer entities
 * @description Type definitions cho workflow evaluation (admin only) và
 *              admin/reindex (gộp chung file — xem eval_configs.ts). Khớp
 *              1-1 openapi.yaml /eval/run, /eval/results/{eval_id},
 *              /eval/metrics, /admin/reindex (v1.2.3).
 * @owner AG-04
 * @reference openapi.yaml paths /eval/*, /admin/reindex
 */

/**
 * RUN EVALUATION REQUEST
 * Reference: openapi.yaml POST /eval/run request body (không required)
 */
export interface RunEvaluationRequest {
    limit?: number // default: 100, giới hạn eval N ảnh đã index ngẫu nhiên
    seed?: number // Random seed cho khả năng tái lập kết quả
}

/**
 * RUN EVALUATION RESPONSE
 * Reference: openapi.yaml POST /eval/run response 202 (bất đồng bộ)
 */
export interface RunEvaluationResponse {
    eval_id: string // UUID
    status: string // example: "running"
}

/**
 * EVALUATION RESULT
 * Reference: openapi.yaml GET /eval/results/{eval_id} response 200
 * Field mrr/hit_rate/precision/recall/query_count/completed_at chỉ có giá
 * trị khi status = "completed" — hợp đồng không đánh dấu required nên để
 * optional.
 */
export interface EvaluationResult {
    eval_id: string // UUID
    status: string // example: "completed" — quan sát thực tế còn "running"/"failed"
    mrr?: number
    hit_rate?: number
    precision?: number
    recall?: number
    query_count?: number
    completed_at?: string // ISO 8601
}

/**
 * EVALUATION METRICS
 * Reference: openapi.yaml GET /eval/metrics response 200
 * Report tổng hợp (không gắn với 1 eval_id cụ thể — khác EvaluationResult).
 */
export interface EvaluationMetrics {
    mrr: number
    hit_rate: number
    precision: number
    recall: number
}

/**
 * TRIGGER REINDEX REQUEST
 * Reference: openapi.yaml POST /admin/reindex request body (không required)
 */
export interface TriggerReindexRequest {
    batch_size?: number // default: 100
    resume_from?: string
}

/**
 * TRIGGER REINDEX RESPONSE
 * Reference: openapi.yaml POST /admin/reindex response 202
 */
export interface TriggerReindexResponse {
    job_id: string
}