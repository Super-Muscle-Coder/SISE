/**
 * Evaluation HTTP Adapter Layer
 * 
 * Interfaces with backend evaluation endpoints.
 * All methods accept AbortSignal for cancellation support.
 * Strictly uses the scaffold adapter wrapper (no direct axios).
 */

import { scaffoldAdapter } from './scaffold_adapter_instance';
import { getEvalConfig } from '../configs/eval_configs';
import {
    EvaluationRunRequest,
    EvaluationRunResponse,
    EvaluationResult,
    HistoricalMetrics,
    StandardError,
} from '../entities/eval_entities';

// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

/**
 * Trigger a new evaluation run on the backend.
 * Returns immediately with eval_id; evaluation runs asynchronously.
 * 
 * @param request - Optional configuration (limit, seed)
 * @param signal - AbortSignal to cancel the request
 * @returns Promise resolving to eval_id and initial status
 */
export async function runEvaluation(
    request?: EvaluationRunRequest,
    signal?: AbortSignal
): Promise<EvaluationRunResponse> {
    try {
        const config = getEvalConfig();
        const response = await scaffoldAdapter.post<EvaluationRunResponse>(
            config.endpoints.runEvaluation,
            request || {},
            { signal }
        );
        return response.data;
    } catch (error) {
        const stdError = parseEvaluationError(error);
        throw stdError;
    }
}

/**
 * Fetch the status and results of an ongoing or completed evaluation.
 * Called repeatedly by the polling service.
 * 
 * @param evalId - Evaluation UUID
 * @param signal - AbortSignal to cancel the request
 * @returns Promise resolving to current evaluation state
 */
export async function getEvaluationStatus(
    evalId: string,
    signal?: AbortSignal
): Promise<EvaluationResult> {
    try {
        const config = getEvalConfig();
        const response = await scaffoldAdapter.get<EvaluationResult>(
            config.endpoints.getResults(evalId),
            { signal }
        );
        return response.data;
    } catch (error) {
        const stdError = parseEvaluationError(error);
        throw stdError;
    }
}

/**
 * Fetch historical high-water-mark metrics.
 * Used to display context (e.g., "best MRR ever recorded").
 * 
 * @param signal - AbortSignal to cancel the request
 * @returns Promise resolving to historical metrics
 */
export async function getHistoricalMetrics(
    signal?: AbortSignal
): Promise<HistoricalMetrics> {
    try {
        const config = getEvalConfig();
        const response = await scaffoldAdapter.get<HistoricalMetrics>(
            config.endpoints.getMetrics,
            { signal }
        );
        return response.data;
    } catch (error) {
        const stdError = parseEvaluationError(error);
        throw stdError;
    }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Parse HTTP errors and convert to standard error format.
 * Handles axios error structure, AbortError, and generic errors.
 */
function parseEvaluationError(error: unknown): StandardError {
    // Handle AbortError (user or timeout-triggered cancellation)
    if (error instanceof DOMException && error.name === 'AbortError') {
        return {
            code: 'ERR_REQUEST_ABORTED',
            message: 'Evaluation request was cancelled.',
        };
    }

    // Handle axios response errors
    if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object'
    ) {
        const response = error.response as {
            status?: number;
            data?: unknown;
        };

        // Try to extract error code and message from response data
        if (response.data && typeof response.data === 'object') {
            const data = response.data as { code?: string; message?: string };
            return {
                code: data.code || `HTTP_${response.status}`,
                message: data.message || `HTTP error ${response.status}`,
            };
        }

        return {
            code: `HTTP_${response.status}`,
            message: `HTTP error ${response.status}`,
        };
    }

    // Fallback for generic errors
    if (error instanceof Error) {
        return {
            code: 'ERR_UNKNOWN',
            message: error.message,
        };
    }

    return {
        code: 'ERR_UNKNOWN',
        message: 'An unknown error occurred.',
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const evaluationAdapter = {
    runEvaluation,
    getEvaluationStatus,
    getHistoricalMetrics,
    parseEvaluationError,
};