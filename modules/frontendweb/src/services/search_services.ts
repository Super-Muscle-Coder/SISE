/**
 * @file search_services.ts
 * @layer services
 * @description Service hook for unified search workflow.
 * @owner AG-04
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SEARCH_CONFIG } from '../configs/search_configs'
import { searchAdapter } from '../adapters/search_adapters'
import type { SearchResultItem } from '../entities/search_entities'

type SearchMode = 'text' | 'image' | null

interface UseSearchState {
    mode: SearchMode
    query: string
    imageFile: File | null
    results: SearchResultItem[]
    latencyMs: number | null
    isLoading: boolean
    error: string | null
}

function isAbortLikeError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false
    const e = error as Record<string, unknown>
    const code = typeof e.code === 'string' ? e.code : ''
    const name = typeof e.name === 'string' ? e.name : ''
    return code === 'ERR_CANCELED' || name === 'AbortError'
}

function extractErrorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') return fallback
    const e = error as Record<string, unknown>
    if (typeof e.message === 'string' && e.message.trim()) return e.message
    return fallback
}

export function useSearch() {
    const [state, setState] = useState<UseSearchState>({
        mode: null,
        query: '',
        imageFile: null,
        results: [],
        latencyMs: null,
        isLoading: false,
        error: null,
    })

    const abortControllerRef = useRef<AbortController | null>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const clearDebounceTimer = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = null
        }
    }, [])

    const abortInFlightRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }, [])

    const cancelPendingOperations = useCallback(() => {
        clearDebounceTimer()
        abortInFlightRequest()
    }, [clearDebounceTimer, abortInFlightRequest])

    const searchByText = useCallback(
        (text: string) => {
            cancelPendingOperations()

            const trimmed = text.trim()

            setState((prev) => ({
                ...prev,
                mode: 'text',
                query: text,
                imageFile: null,
                error: null,
                isLoading: trimmed.length > 0,
            }))

            if (!trimmed) {
                setState((prev) => ({
                    ...prev,
                    results: [],
                    latencyMs: null,
                    isLoading: false,
                    error: null,
                }))
                return
            }

            const controller = new AbortController()
            abortControllerRef.current = controller

            debounceTimerRef.current = setTimeout(async () => {
                try {
                    const response = await searchAdapter.searchByText(
                        { query_text: trimmed },
                        { signal: controller.signal }
                    )

                    setState((prev) => ({
                        ...prev,
                        results: response.results,
                        latencyMs: response.latency_ms,
                        isLoading: false,
                        error: null,
                    }))
                } catch (error) {
                    if (isAbortLikeError(error)) return

                    setState((prev) => ({
                        ...prev,
                        isLoading: false,
                        error: extractErrorMessage(error, 'Failed to search by text.'),
                    }))
                } finally {
                    if (abortControllerRef.current === controller) {
                        abortControllerRef.current = null
                    }
                }
            }, SEARCH_CONFIG.debounceMs)
        },
        [cancelPendingOperations]
    )

    const searchByImage = useCallback(
        async (file: File) => {
            cancelPendingOperations()

            const controller = new AbortController()
            abortControllerRef.current = controller

            setState((prev) => ({
                ...prev,
                mode: 'image',
                query: '',
                imageFile: file,
                isLoading: true,
                error: null,
            }))

            try {
                const response = await searchAdapter.searchByImage(
                    { file },
                    { signal: controller.signal }
                )

                setState((prev) => ({
                    ...prev,
                    results: response.results,
                    latencyMs: response.latency_ms,
                    isLoading: false,
                    error: null,
                }))
            } catch (error) {
                if (isAbortLikeError(error)) return

                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: extractErrorMessage(error, 'Failed to search by image.'),
                }))
            } finally {
                if (abortControllerRef.current === controller) {
                    abortControllerRef.current = null
                }
            }
        },
        [cancelPendingOperations]
    )

    const clearSearch = useCallback(() => {
        cancelPendingOperations()
        setState({
            mode: null,
            query: '',
            imageFile: null,
            results: [],
            latencyMs: null,
            isLoading: false,
            error: null,
        })
    }, [cancelPendingOperations])

    useEffect(() => {
        return () => {
            cancelPendingOperations()
        }
    }, [cancelPendingOperations])

    return {
        mode: state.mode,
        query: state.query,
        imageFile: state.imageFile,
        results: state.results,
        latencyMs: state.latencyMs,
        isLoading: state.isLoading,
        error: state.error,
        searchByText,
        searchByImage,
        clearSearch,
    }
}