/**
 * @file eval_services.ts
 * @layer services
 * @description Service hooks for evaluation workflow.
 * @owner AG-04
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { evalAdapter } from '../adapters/eval_adapters'
import { EVAL_CONFIG } from '../configs/eval_configs'
import type {
    EvaluationMetrics,
    EvaluationResult,
    RunEvaluationRequest,
} from '../entities/eval_entities'

function toErrorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback
    const e = error as Record<string, unknown>
    if (typeof e.message === 'string' && e.message.trim()) return e.message
    return fallback
}

export function useRunEvaluation() {
    const [isRunning, setIsRunning] = useState(false)
    const [evalId, setEvalId] = useState<string | null>(null)
    const [result, setResult] = useState<EvaluationResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isTimedOut, setIsTimedOut] = useState(false)

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startedAtRef = useRef<number | null>(null)
    const pollingInFlightRef = useRef(false)

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        pollingInFlightRef.current = false
    }, [])

    const run = useCallback(
        async (payload?: RunEvaluationRequest) => {
            stopPolling()

            setIsRunning(true)
            setEvalId(null)
            setResult(null)
            setError(null)
            setIsTimedOut(false)

            try {
                const runResponse = await evalAdapter.runEvaluation(payload)
                setEvalId(runResponse.eval_id)
                startedAtRef.current = Date.now()

                intervalRef.current = setInterval(async () => {
                    if (pollingInFlightRef.current) return
                    pollingInFlightRef.current = true

                    try {
                        const startedAt = startedAtRef.current ?? Date.now()
                        const elapsed = Date.now() - startedAt

                        if (elapsed > EVAL_CONFIG.POLL.maxDurationMs) {
                            stopPolling()
                            setIsTimedOut(true)
                            setError('Evaluation is taking longer than expected')
                            setIsRunning(false)
                            return
                        }

                        const latest = await evalAdapter.getEvaluationResults(runResponse.eval_id)
                        const status = latest.status

                        if (status === 'completed' || status === 'failed') {
                            setResult(latest)
                            setIsRunning(false)
                            stopPolling()
                        }
                    } catch (pollError) {
                        stopPolling()
                        setError(toErrorMessage(pollError, 'Failed while polling evaluation result.'))
                        setIsRunning(false)
                    } finally {
                        pollingInFlightRef.current = false
                    }
                }, EVAL_CONFIG.POLL.intervalMs)
            } catch (runError) {
                setError(toErrorMessage(runError, 'Failed to start evaluation.'))
                setIsRunning(false)
            }
        },
        [stopPolling]
    )

    useEffect(() => {
        return () => {
            stopPolling()
        }
    }, [stopPolling])

    return {
        isRunning,
        evalId,
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