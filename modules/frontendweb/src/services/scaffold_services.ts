import { useEffect, useState, useCallback } from 'react'
import { scaffoldAdapter } from '../adapters/scaffold_adapter_instance'
import type {
    HealthStatus,
    StandardError,
    ScaffoldContextState,
} from '../entities/scaffold_entities'
import {
    VECTOR_DIM_ERROR_CODE,
    DEFAULT_VECTOR_DIM,
} from '../entities/scaffold_entities'

export const useScaffoldService = (): ScaffoldContextState => {
    const [state, setState] = useState<ScaffoldContextState>({
        expectedVectorDim: null,
        healthStatus: null,
        isHealthy: false,
        lastHealthCheckAt: null,
        error: null,
    })

    const probeReadiness = useCallback(async () => {
        try {
            const { data: healthData, headers } =
                await scaffoldAdapter.getHealthReadiness()

            const vectorDimHeader = headers['x-expected-vector-dim']
            const expectedVectorDim =
                vectorDimHeader && !isNaN(Number(vectorDimHeader))
                    ? Number(vectorDimHeader)
                    : DEFAULT_VECTOR_DIM

            const healthStatus: HealthStatus = {
                status: 'ready',
                timestamp: new Date().toISOString(),
                dependencies: (healthData as Record<string, unknown>)
                    .dependencies as HealthStatus['dependencies'],
            }

            setState({
                expectedVectorDim,
                healthStatus,
                isHealthy: true,
                lastHealthCheckAt: Date.now(),
                error: null,
            })
        } catch (err) {
            const error = err as Record<string, unknown>
            let standardError: StandardError = {
                code: 'ERR_HEALTH_CHECK_FAILED',
                message: 'Failed to perform health check.',
                details: {},
            }

            if (
                error.response &&
                typeof error.response === 'object' &&
                'data' in error.response
            ) {
                const responseData = error.response.data as Record<string, unknown>
                if (responseData.code === VECTOR_DIM_ERROR_CODE) {
                    standardError = {
                        code: VECTOR_DIM_ERROR_CODE,
                        message: typeof responseData.message === 'string' 
                            ? responseData.message 
                            : 'Vector dimension mismatch detected.',
                        details: typeof responseData.details === 'object' && responseData.details !== null
                            ? (responseData.details as Record<string, unknown>)
                            : {},
                    }
                }
            }

            setState({
                expectedVectorDim: null,
                healthStatus: null,
                isHealthy: false,
                lastHealthCheckAt: Date.now(), 
                error: standardError,
            })
        }
    }, [])

    // Initial probe on mount
    useEffect(() => {
        probeReadiness()
    }, [probeReadiness])

    // Periodic health check
    useEffect(() => {
        const interval = setInterval(probeReadiness, 30000) // 30 seconds
        return () => clearInterval(interval)
    }, [probeReadiness])

    return state
}