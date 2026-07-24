/**
 * @file eval_entities.ts
 * @layer entities
 * @description Type definitions cho workflow evaluation (admin only). Khớp
 *              1-1 openapi.yaml /eval/run, /eval/results/{eval_id},
 *              /eval/metrics (v1.2.3) CỘNG THÊM phần mở rộng thật từ
 *              AG-03 (ground truth theo tag-class, breakdown/confusion
 *              matrix) — CHỈ có trong response POST /eval/run, KHÔNG có
 *              trong GET /eval/results/{id} hay GET /eval/metrics (2
 *              endpoint đó vẫn chỉ trả 4 chỉ số cốt lõi cũ).
 * @owner AG-04
 * @reference openapi.yaml paths /eval/*; xác nhận qua response JSON thật
 *            sau khi AG-03 thiết kế lại ground truth theo album/tag-class
 *            (trước đây self-retrieval, giờ 1-tag-định-danh).
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
 * 4 chỉ số cốt lõi — dùng chung cho cả kết quả toàn cục lẫn từng class
 * trong breakdown_by_class. Công thức không đổi so với thiết kế gốc.
 */
export interface CoreEvaluationScores {
    mrr: number
    hit_rate: number
    precision: number
    recall: number
}

/**
 * BREAKDOWN PER CLASS — CHỈ có trong response POST /eval/run.
 * Key: tên class đã chuẩn hóa (lowercase) từ tag định danh, vd "lionel messi".
 */
export interface EvaluationClassBreakdown extends CoreEvaluationScores {
    query_count: number
    top1_cross_class_confusion_rate: number
}

/**
 * CONFUSION MATRIX — CHỈ có trong response POST /eval/run.
 * {[tên class thật]: {[tên class bị nhầm thành]: số lần}}
 * Ví dụ: {"lionel messi": {"christiano ronaldo": 2}}
 */
export type CrossClassConfusionMatrix = Record<string, Record<string, number>>

/**
 * 1 kết quả trong top-K của 1 query bị nhầm lẫn — CHỈ có trong
 * misclassified_queries (POST /eval/run).
 * SỬA: bổ sung `score` (cosine similarity, cùng ý nghĩa với
 * SearchResultItem.score ở workflow search) — trước đây thiếu, cần cho
 * biểu đồ phân bố score trên ResultPage. Dùng để minh họa khoảng cách
 * điểm số giữa ảnh đúng/sai trong top-K.
 */
export interface MisclassifiedTopKResult {
    rank: number
    image_id: string
    minio_url: string
    score: number
    is_relevant: boolean
}

/**
 * 1 case bị nhầm lẫn hoàn chỉnh — ảnh mẫu + toàn bộ top-K kết quả kèm
 * đánh dấu đúng/sai từng ảnh. CHỈ có trong response POST /eval/run.
 */
export interface MisclassifiedQuery {
    query_image_id: string
    query_tag_label: string
    query_minio_url: string
    confused_with_class: string
    top_k_results: MisclassifiedTopKResult[]
}

/**
 * RUN EVALUATION RESPONSE — ĐẦY ĐỦ, response thật của POST /eval/run.
 * Reference: openapi.yaml chỉ đặc tả {eval_id, status} (response 202 gốc,
 * bất đồng bộ) — NHƯNG thiết kế lại ground truth (AG-03) khiến endpoint
 * này giờ chạy ĐỒNG BỘ và trả về ĐẦY ĐỦ 4 chỉ số cốt lõi + phần mở rộng
 * ngay trong response, không cần polling GET /eval/results/{id} nữa (dù
 * endpoint đó vẫn tồn tại, dùng khi cần tra cứu lại 1 eval_id cụ thể sau
 * này). status ở đây LUÔN 'completed' khi Promise resolve thành công
 * (lỗi giữa chừng sẽ throw, không trả response với status khác).
 *
 * SỬA (phát hiện qua test thật): 5 field cấp gốc (mrr/hit_rate/precision/
 * recall/query_count) KHÔNG PHẢI LÚC NÀO CŨNG có trong response — quan
 * sát thực tế: 1 lần chạy có đủ, 1 lần chạy khác chỉ có breakdown_by_class
 * + confusion matrix + misclassified_queries, KHÔNG có bản tổng hợp toàn
 * cục ở cấp gốc. Đánh dấu optional để không gây crash UI
 * ("Cannot read properties of undefined") khi Backend không trả — pages/
 * (ResultPage.tsx) tự tính fallback từ breakdown_by_class khi cần.
 */
export interface RunEvaluationResponse {
    eval_id: string
    status: string
    mrr?: number
    hit_rate?: number
    precision?: number
    recall?: number
    query_count?: number
    breakdown_by_class: Record<string, EvaluationClassBreakdown>
    top1_cross_class_confusion_rate: number
    cross_class_confusion_matrix: CrossClassConfusionMatrix
    misclassified_queries: MisclassifiedQuery[]
}

/**
 * EVALUATION RESULT
 * Reference: openapi.yaml GET /eval/results/{eval_id} response 200
 * KHÔNG đổi — chỉ 4 chỉ số cốt lõi + metadata cơ bản, KHÔNG có breakdown/
 * confusion matrix (những field đó chỉ tồn tại trong response POST
 * /eval/run lúc chạy, không được lưu lại DB để tra cứu sau).
 */
export interface EvaluationResult {
    eval_id: string
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
 * KHÔNG đổi — 4 chỉ số cốt lõi của lần eval 'completed' gần nhất.
 */
export interface EvaluationMetrics {
    mrr: number
    hit_rate: number
    precision: number
    recall: number
}