/**
 * @file eval_configs.ts
 * @layer configs
 * @description Evaluation workflow configuration - env-to-config boundary.
 *              All values from environment variables (via env_helpers).
 * @owner AG-04
 * @reference data_schema.yaml, openapi.yaml
 */

import {
    getEnvVarWithDefault,
    getEnvNumberWithDefault,
} from '@/utils/env_helpers';

// ============================================================================
// EVALUATION CONFIGURATION (ENV-DRIVEN)
// ============================================================================

export const getEvalConfig = () => ({
    // ========================================================================
    // POLLING STRATEGY
    // ========================================================================
    polling: {
        intervalMs: getEnvNumberWithDefault('VITE_EVAL_POLLING_INTERVAL_MS', 3000),
        maxTimeoutMs: getEnvNumberWithDefault('VITE_EVAL_MAX_TIMEOUT_MS', 120000),
        maxRetries: getEnvNumberWithDefault('VITE_EVAL_MAX_RETRIES', 3),
        backoffMs: getEnvNumberWithDefault('VITE_EVAL_BACKOFF_MS', 500),
    } as const,

    // ========================================================================
    // UI LABELS & MESSAGING
    // ========================================================================
    labels: {
        runButton: getEnvVarWithDefault('VITE_EVAL_RUN_BUTTON_LABEL', 'Run Evaluation'),
        stopButton: getEnvVarWithDefault('VITE_EVAL_STOP_BUTTON_LABEL', 'Stop'),
        resetButton: getEnvVarWithDefault('VITE_EVAL_RESET_BUTTON_LABEL', 'Reset'),
        status: {
            idle: 'Ready to run',
            pending: 'Initializing evaluation...',
            polling: 'Evaluation in progress...',
            success: 'Evaluation complete',
            failed: 'Evaluation failed',
            timeout: `Evaluation timeout (${getEnvNumberWithDefault('VITE_EVAL_MAX_TIMEOUT_MS', 120000) / 1000}s exceeded)`,
        },
    } as const,

    // ========================================================================
    // METRIC DISPLAY CONFIGURATION
    // ========================================================================
    metrics: {
        mrr: {
            label: 'MRR',
            unit: 'score' as const,
            tooltip: 'Mean Reciprocal Rank. Measures how high the first relevant result appears. Higher is better (max 1.0).',
            decimals: 3,
        },
        precision: {
            label: 'Precision@10',
            unit: '%' as const,
            tooltip:
                'Precision at top 10 results. Percentage of returned results that are relevant. Higher is better.',
            decimals: 1,
        },
        hitRate: {
            label: 'Hit Rate',
            unit: '%' as const,
            tooltip:
                'Hit Rate. Percentage of queries that found at least 1 relevant result in top 10. Higher is better.',
            decimals: 1,
        },
        recall: {
            label: 'Recall',
            unit: '%' as const,
            tooltip:
                'Recall. Percentage of all relevant images that appear in top 10 results. Higher is better.',
            decimals: 1,
        },
    } as const,

    // ========================================================================
    // API ENDPOINTS (must match openapi.yaml)
    // ========================================================================
    endpoints: {
        runEvaluation: '/eval/run',
        getResults: (evalId: string) => `/eval/results/${evalId}`,
        getMetrics: '/eval/metrics',
    } as const,
} as const);

export type EvalConfig = ReturnType<typeof getEvalConfig>;