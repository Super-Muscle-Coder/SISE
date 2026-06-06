/**
 * @file scaffold_services.ts
 * @layer services
 * @description Custom hooks and business logic for scaffolding (health checks, vector dimension validation).
 *              All configuration values imported from scaffold_configs.ts (no hardcoding).
 * @owner AG-04
 * @reference
 *   - SCAFFOLD_CONFIG (all thresholds, timeouts, error codes)
 *   - scaffold_adapters.ts (HTTP layer)
 *   - openapi.yaml /health/readiness contract
 * @note useScaffoldService hook must wrap app with ScaffoldContextProvider
 */

import { useEffect, useState, useCallback } from 'react'
import { scaffoldAdapter } from '../adapters/scaffold_adapter_instance'
import { SCAFFOLD_CONFIG } from '../configs/scaffold_configs'
import type {
    HealthStatus,
    StandardError,
    ScaffoldContextState,
} from '../entities/scaffold_entities'
import { isHealthStatus, ERROR_CODES } from '../entities/scaffold_entities'

/**
 * useScaffoldService Hook
 * Orchestrates health checks, vector dimension validation, and error handling.
 * Runs health probe on mount and periodically thereafter.
 *
 * @returns ScaffoldContextState with health status and vector dimension
 */
export const useScaffoldService = (): ScaffoldContextState => {
    const [state, setState] = useState<ScaffoldContextState>({
        expectedVectorDim: null,
        healthStatus: null,
        isHealthy: false,
        lastHealthCheckAt: null,
        error: null,
    })

    /**
     * Probe Backend Readiness
     * Calls GET /health/readiness and extracts X-Expected-Vector-Dim header
     * Reference: openapi.yaml /health/readiness response headers
     */
    const probeReadiness = useCallback(async (signal?: AbortSignal) => {
        try {
            SCAFFOLD_CONFIG.DEBUG.log('debug', 'Starting health readiness probe...')

            const { data: healthData, headers } = await scaffoldAdapter.getHealthReadiness({
                signal,
            })

            // ================================================================
            // 1. Extract Vector Dimension from Header (per openapi.yaml)
            // ================================================================
            const vectorDimHeader = headers['x-expected-vector-dim']
            let expectedVectorDim = SCAFFOLD_CONFIG.VECTOR.defaultDim

            if (vectorDimHeader && !isNaN(Number(vectorDimHeader))) {
                const headerDim = Number(vectorDimHeader)
                // Validate that header dimension is supported
                const validation = SCAFFOLD_CONFIG.VECTOR.validateDimension(headerDim)
                if (validation.isValid) {
                    expectedVectorDim = headerDim
                } else {
                    SCAFFOLD_CONFIG.DEBUG.log('warn', `Invalid vector dimension from header: ${headerDim}`)
                }
            }

            // ================================================================
            // 2. Build HealthStatus Object (per openapi.yaml schema)
            // ================================================================
            let healthStatus: HealthStatus | null = null
            if (isHealthStatus(healthData)) {
                healthStatus = healthData as HealthStatus
            } else {
                // Fallback construction if response doesn't strictly match schema
                healthStatus = {
                    status: 'ready',
                    timestamp: new Date().toISOString(),
                    dependencies: (healthData as Record<string, unknown>)?.dependencies as HealthStatus['dependencies'],
                }
            }

            // ================================================================
            // 3. Update State (Success Path)
            // ================================================================
            setState({
                expectedVectorDim,
                healthStatus,
                isHealthy: healthStatus.status === 'ready',
                lastHealthCheckAt: Date.now(),
                error: null,
            })

            SCAFFOLD_CONFIG.DEBUG.log('info', 'Health readiness probe succeeded', {
                status: healthStatus.status,
                vectorDim: expectedVectorDim,
            })
        } catch (error) {
            // ================================================================
            // ERROR HANDLING PATH
            // ================================================================
            SCAFFOLD_CONFIG.DEBUG.log('error', 'Health readiness probe failed', error)

            let standardError: StandardError = {
                code: ERROR_CODES.HEALTH_CHECK_FAILED,
                message: 'Failed to perform health check. Backend may be unavailable.',
                details: {},
            }

            // Check if error response contains StandardError contract
            if (error instanceof Error && 'response' in error) {
                const axiosError = error as Record<string, unknown>
                if (axiosError.response && typeof axiosError.response === 'object') {
                    const responseData = (axiosError.response as Record<string, unknown>).data as Record<string, unknown>

                    // If backend returned StandardError, use it
                    if (responseData?.code === ERROR_CODES.VECTOR_DIM_MISMATCH) {
                        standardError = {
                            code: ERROR_CODES.VECTOR_DIM_MISMATCH,
                            message: String(responseData.message || 'Vector dimension mismatch'),
                            details: (responseData.details as Record<string, unknown>) || {},
                        }
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

    /**
     * Initial Probe on Component Mount
     */
    useEffect(() => {
        const abortController = new AbortController()
        probeReadiness(abortController.signal)

        return () => {
            abortController.abort()
        }
    }, [probeReadiness])

    /**
     * Periodic Health Check
     * Interval configured via VITE_HEALTH_CHECK_INTERVAL_MS (per SCAFFOLD_CONFIG.HEALTH.checkIntervalMs)
     * Reference: data_schema.yaml observability.health_probes
     */
    useEffect(() => {
        // ================================================================
        // Use Config Value Instead of Hardcoded 30000 ms
        // ================================================================
        const interval = setInterval(() => {
            SCAFFOLD_CONFIG.DEBUG.log('debug', 'Periodic health check running...')
            probeReadiness()
        }, SCAFFOLD_CONFIG.HEALTH.checkIntervalMs)

        return () => {
            clearInterval(interval)
            SCAFFOLD_CONFIG.DEBUG.log('debug', 'Health check interval cleared')
        }
    }, [probeReadiness])

    return state
}

/**
 * Validation Helper: Ensure vector dimension matches expected
 * Called by services before submitting vectors to backend
 * @param vectorLength Actual length of vector array
 * @param expectedDim Expected dimension (from health probe or config)
 * @returns { isValid: boolean, error?: string }
 */
export const validateVectorDimension = (
    vectorLength: number,
    expectedDim: number | null
): { isValid: boolean; error?: string } => {
    if (!expectedDim) {
        return {
            isValid: false,
            error: 'Expected vector dimension not determined. Run health check first.',
        }
    }

    if (vectorLength !== expectedDim) {
        return {
            isValid: false,
            error: `Vector dimension mismatch: expected ${expectedDim}, got ${vectorLength}`,
        }
    }

    return { isValid: true }
}

/**
 * Validation Helper: Ensure file size is within limits
 * Called before upload attempts
 * @param file File object to validate
 * @returns { isValid: boolean, error?: string }
 */
export const validateUploadFile = (file: File): { isValid: boolean; error?: string } => {
    return SCAFFOLD_CONFIG.UPLOAD.validateFile(file)
}

/**
 * Helper: Check if app is in healthy state
 * Useful for deciding whether to allow user interactions
 * @param state ScaffoldContextState from useScaffoldService
 * @returns true if backend is reachable and configured correctly
 */
export const isAppReady = (state: ScaffoldContextState): boolean => {
    return state.isHealthy && state.expectedVectorDim !== null && state.error === null
}