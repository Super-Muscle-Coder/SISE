/**
 * Evaluation Service Hook
 * 
 * Orchestrates the evaluation state machine:
 *   IDLE → PENDING → POLLING → SUCCESS/FAILED/TIMEOUT
 * 
 * Handles polling loop with AbortController cleanup for memory safety.
 * Implements exponential backoff retry logic.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { evaluationAdapter } from '../adapters/eval_adapters';
import { getEvalConfig } from '../configs/eval_configs';
import {
    EvaluationUIState,
    EvaluationResult,
    MetricCardData,
    StandardError,
} from '../entities/eval_entities';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type RunStatus = 'idle' | 'pending' | 'polling' | 'success' | 'failed' | 'timeout';

interface UseEvaluationPollingState {
    runStatus: RunStatus;
    evalId: string | null;
    metrics: MetricCardData[];
    errorMessage: string | null;
    elapsedMs: number;
    lastFetchedAt: string | null;
}

interface UseEvaluationPollingControls {
    startEvaluation: () => Promise<void>;
    stopEvaluation: () => void;
    resetEvaluation: () => void;
}

// ============================================================================
// HOOK: useEvaluationPolling
// ============================================================================

/**
 * Main evaluation polling hook.
 * Manages the complete lifecycle: trigger, poll, display results, cleanup.
 * 
 * @returns Object containing current state and control functions
 */
export function useEvaluationPolling(): UseEvaluationPollingState & UseEvaluationPollingControls {
    // ========================================================================
    // STATE
    // ========================================================================

    const [state, setState] = useState<UseEvaluationPollingState>({
        runStatus: 'idle',
        evalId: null,
        metrics: [],
        errorMessage: null,
        elapsedMs: 0,
        lastFetchedAt: null,
    });

    // Store abort controller and interval handle in refs
    const abortControllerRef = useRef<AbortController | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);
    const retryCountRef = useRef<number>(0);

    // Get config (fresh on each render, but cached within hook execution)
    const configRef = useRef(getEvalConfig());

    // ========================================================================
    // CLEANUP FUNCTION
    // ========================================================================

    const cleanup = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        retryCountRef.current = 0;
    }, []);

    // ========================================================================
    // POLLING LOGIC
    // ========================================================================

    /**
     * Poll the backend for evaluation results.
     * Implements exponential backoff and timeout logic.
     */
    const pollEvaluationStatus = useCallback(
        async (evalId: string) => {
            if (!abortControllerRef.current) return;

            const config = configRef.current;

            try {
                const result = await evaluationAdapter.getEvaluationStatus(
                    evalId,
                    abortControllerRef.current.signal
                );

                // Reset retry count on successful fetch
                retryCountRef.current = 0;

                // Update elapsed time
                const elapsedMs = Date.now() - startTimeRef.current;

                // Check timeout
                if (elapsedMs > config.polling.maxTimeoutMs) {
                    setState((prev) => ({
                        ...prev,
                        runStatus: 'timeout',
                        errorMessage: `Evaluation did not complete within ${config.polling.maxTimeoutMs / 1000} seconds.`,
                    }));
                    cleanup();
                    return;
                }

                // Update last fetched timestamp
                const lastFetchedAt = new Date().toISOString();

                if (result.status === 'completed') {
                    // Evaluation complete — transform results and stop polling
                    const metrics = transformResultsToMetrics(result);
                    setState((prev) => ({
                        ...prev,
                        runStatus: 'success',
                        metrics,
                        elapsedMs,
                        lastFetchedAt,
                        errorMessage: null,
                    }));
                    cleanup();
                } else if (result.status === 'failed') {
                    // Evaluation failed on backend
                    setState((prev) => ({
                        ...prev,
                        runStatus: 'failed',
                        errorMessage: result.error_message || 'Evaluation failed on the backend.',
                        elapsedMs,
                        lastFetchedAt,
                    }));
                    cleanup();
                } else {
                    // Still running — update UI and continue polling
                    setState((prev) => ({
                        ...prev,
                        elapsedMs,
                        lastFetchedAt,
                    }));
                }
            } catch (error) {
                // Check if this is an abort error (expected on cleanup)
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return; // Silently exit — user or timeout triggered abort
                }

                // Implement exponential backoff retry on network errors
                if (retryCountRef.current < config.polling.maxRetries) {
                    retryCountRef.current += 1;
                    const backoffMs =
                        config.polling.backoffMs * Math.pow(2, retryCountRef.current - 1);
                    console.warn(
                        `Polling failed (attempt ${retryCountRef.current}). Retrying in ${backoffMs}ms...`
                    );
                    // Backoff will naturally happen as next interval iteration
                } else {
                    // Max retries exceeded
                    const err = error instanceof Error ? error.message : 'Unknown error';
                    setState((prev) => ({
                        ...prev,
                        runStatus: 'failed',
                        errorMessage: `Polling failed after ${config.polling.maxRetries} retries: ${err}`,
                    }));
                    cleanup();
                }
            }
        },
        [cleanup]
    );

    // ========================================================================
    // CONTROL FUNCTIONS
    // ========================================================================

    const startEvaluation = useCallback(async () => {
        const config = configRef.current;

        setState((prev) => ({
            ...prev,
            runStatus: 'pending',
            metrics: [],
            errorMessage: null,
            elapsedMs: 0,
            lastFetchedAt: null,
        }));

        // Create fresh abort controller for this evaluation run
        abortControllerRef.current = new AbortController();
        startTimeRef.current = Date.now();
        retryCountRef.current = 0;

        try {
            // Trigger evaluation
            const response = await evaluationAdapter.runEvaluation(
                { limit: 100 }, // Default config
                abortControllerRef.current.signal
            );

            setState((prev) => ({
                ...prev,
                runStatus: 'polling',
                evalId: response.eval_id,
            }));

            // Start polling interval
            pollIntervalRef.current = setInterval(() => {
                pollEvaluationStatus(response.eval_id);
            }, config.polling.intervalMs);

            // Perform first poll immediately
            await pollEvaluationStatus(response.eval_id);
        } catch (error) {
            const err = error instanceof Error ? error.message : 'Unknown error';
            setState((prev) => ({
                ...prev,
                runStatus: 'failed',
                errorMessage: `Failed to start evaluation: ${err}`,
            }));
            cleanup();
        }
    }, [pollEvaluationStatus, cleanup]);

    const stopEvaluation = useCallback(() => {
        cleanup();
        setState((prev) => ({
            ...prev,
            runStatus: 'idle',
            evalId: null,
            metrics: [],
            errorMessage: null,
        }));
    }, [cleanup]);

    const resetEvaluation = useCallback(() => {
        cleanup();
        setState({
            runStatus: 'idle',
            evalId: null,
            metrics: [],
            errorMessage: null,
            elapsedMs: 0,
            lastFetchedAt: null,
        });
    }, [cleanup]);

    // ========================================================================
    // EFFECT: CLEANUP ON UNMOUNT
    // ========================================================================

    useEffect(() => {
        return () => {
            // Guarantee cleanup when component unmounts
            cleanup();
        };
    }, [cleanup]);

    // ========================================================================
    // RETURN STATE & CONTROLS
    // ========================================================================

    return {
        ...state,
        startEvaluation,
        stopEvaluation,
        resetEvaluation,
    };
}

// ============================================================================
// HELPER: TRANSFORM API RESPONSE TO UI METRICS
// ============================================================================

/**
 * Convert EvaluationResult to MetricCardData[] for display.
 * Handles unit conversion (decimals, percentages, etc.).
 */
function transformResultsToMetrics(result: EvaluationResult): MetricCardData[] {
    const config = getEvalConfig();
    const metrics: MetricCardData[] = [];

    if (result.mrr !== undefined) {
        metrics.push({
            label: config.metrics.mrr.label,
            value: result.mrr,
            unit: config.metrics.mrr.unit,
            tooltip: config.metrics.mrr.tooltip,
        });
    }

    if (result.precision !== undefined) {
        metrics.push({
            label: config.metrics.precision.label,
            value: result.precision * 100, // Convert to percentage
            unit: config.metrics.precision.unit,
            tooltip: config.metrics.precision.tooltip,
        });
    }

    if (result.hit_rate !== undefined) {
        metrics.push({
            label: config.metrics.hitRate.label,
            value: result.hit_rate * 100, // Convert to percentage
            unit: config.metrics.hitRate.unit,
            tooltip: config.metrics.hitRate.tooltip,
        });
    }

    if (result.recall !== undefined) {
        metrics.push({
            label: config.metrics.recall.label,
            value: result.recall * 100, // Convert to percentage
            unit: config.metrics.recall.unit,
            tooltip: config.metrics.recall.tooltip,
        });
    }

    return metrics;
}