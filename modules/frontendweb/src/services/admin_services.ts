/**
 * @file admin_services.ts
 * @layer services
 * @description Service hook for admin reindex action (single synchronous call).
 * @owner AG-04
 */

import { useCallback, useState } from 'react'
import { adminAdapter } from '../adapters/admin_adapters'
import type {
    TriggerReindexRequest,
    TriggerReindexResponse,
} from '../entities/admin_entities'

function toErrorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback
    const e = error as Record<string, unknown>
    if (typeof e.message === 'string' && e.message.trim()) return e.message
    return fallback
}

export function useTriggerReindex() {
    const [isRunning, setIsRunning] = useState(false)
    const [result, setResult] = useState<TriggerReindexResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    const reindex = useCallback(async (payload?: TriggerReindexRequest) => {
        setIsRunning(true)
        setError(null)

        try {
            const response = await adminAdapter.triggerReindex(payload)
            setResult(response)
            return { success: true as const, data: response }
        } catch (err) {
            setError(toErrorMessage(err, 'Failed to trigger reindex.'))
            return { success: false as const }
        } finally {
            setIsRunning(false)
        }
    }, [])

    return {
        isRunning,
        result,
        error,
        reindex,
    }
}