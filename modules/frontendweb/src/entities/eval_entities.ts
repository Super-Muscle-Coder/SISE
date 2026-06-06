/**
 * Evaluation Domain Entities
 * 
 * Single source of truth for all evaluation-related data contracts.
 * Aligned with OpenAPI `/eval/run`, `/eval/results/{eval_id}`, `/eval/metrics`.
 */

// ============================================================================
// EVALUATION RUN REQUEST & RESPONSE
// ============================================================================

export interface EvaluationRunRequest {
    limit?: number;  // Limit evaluation to N random indexed images
    seed?: number;   // Random seed for reproducibility
}

export interface EvaluationRunResponse {
    eval_id: string;     // UUID to track the job
    status: 'running';   // Always 'running' immediately after POST
    timestamp?: string;  // ISO 8601 timestamp when job was created (optional for client compat)
}

// ============================================================================
// EVALUATION RESULTS (from GET /eval/results/{eval_id})
// ============================================================================

export interface EvaluationResult {
    eval_id: string;
    status: 'running' | 'completed' | 'failed';
    mrr?: number;              // Mean Reciprocal Rank: 0.0 to 1.0
    hit_rate?: number;         // Hit Rate: 0.0 to 1.0 (at least 1 correct in top K)
    precision?: number;        // Precision@10: 0.0 to 1.0
    recall?: number;           // Recall: 0.0 to 1.0
    query_count?: number;      // Number of queries executed in this evaluation
    completed_at?: string;     // ISO 8601 timestamp when completed
    error_message?: string;    // If status === 'failed', error details here
}

// ============================================================================
// EVALUATION METRICS HISTORY (from GET /eval/metrics)
// ============================================================================

export interface HistoricalMetrics {
    mrr: number;
    hit_rate: number;
    precision: number;    // Implicitly Precision@10
    recall: number;
}

// ============================================================================
// EVALUATION DISPLAY STATE (for UI layer)
// ============================================================================

export interface MetricCardData {
    label: string;        // e.g., "MRR", "Precision@10", "Hit Rate", "Recall"
    value: number;         // The metric value
    unit: '%' | 'score';   // Display unit: percentage or raw score [0,1]
    tooltip: string;       // Hover tooltip explaining the metric
}

export interface EvaluationUIState {
    runStatus: 'idle' | 'pending' | 'polling' | 'success' | 'failed' | 'timeout';
    evalId: string | null;
    metrics: MetricCardData[];
    errorMessage: string | null;
    elapsedMs: number;                    // Time spent polling so far
    lastFetchedAt: string | null;         // ISO timestamp of last successful fetch
}

// ============================================================================
// STANDARD ERROR (matches openapi.yaml Error schema)
// ============================================================================

export interface StandardError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}