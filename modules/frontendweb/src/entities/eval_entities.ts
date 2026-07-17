/**
 * @file eval_entities.ts
 * @layer entities
 * @description Type definitions cho workflow evaluation (admin only). Khớp
 *              1-1 openapi.yaml /eval/run, /eval/results/{eval_id},
 *              /eval/metrics (v1.2.3).
 *              SỬA: TriggerReindexRequest/Response đã tách hẳn sang
 *              admin_entities.ts — cùng lý do tách workflow như
 *              eval_configs.ts.
 * @owner AG-04
 * @reference openapi.yaml paths /eval/*
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
 * LƯU Ý: cả 4 field đều KHÔNG optional (khác EvaluationResult) — hợp đồng
 * không đánh dấu optional cho object này.
 */
export interface EvaluationMetrics {
    mrr: number
    hit_rate: number
    precision: number
    recall: number
}