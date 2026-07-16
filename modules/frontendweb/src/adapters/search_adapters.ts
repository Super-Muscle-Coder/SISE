/**
 * @file search_adapters.ts
 * @layer adapters
 * @description Adapter layer for search workflow.
 * @owner AG-04
 */

import axios from 'axios'
import { scaffoldAdapter } from './scaffold_adapters'
import { SEARCH_CONFIG } from '../configs/search_configs'
import type { StandardError } from '../entities/scaffold_entities'
import type {
    MetricType,
    SearchByImageRequest,
    SearchByTextRequest,
    SearchResponse,
} from '../entities/search_entities'

interface RequestOptions {
    signal?: AbortSignal
}

const DEFAULT_METRIC: MetricType = 'COSINE'

function extractBackendMessage(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null
    const record = data as Record<string, unknown>

    if (typeof record.message === 'string' && record.message.trim()) {
        return record.message
    }

    if (typeof record.detail === 'string' && record.detail.trim()) {
        return record.detail
    }

    return null
}

function normalizeSearchError(error: unknown, fallbackMessage: string): StandardError {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const backendMessage = extractBackendMessage(error.response?.data)

        return {
            code:
                (typeof (error.response?.data as Record<string, unknown> | undefined)?.code === 'string'
                    ? ((error.response?.data as Record<string, unknown>).code as string)
                    : undefined) ||
                (status ? `HTTP_${status}` : 'ERR_SEARCH_REQUEST_FAILED'),
            message: backendMessage || error.message || fallbackMessage,
            details: {
                httpStatus: status,
            },
        }
    }

    if (typeof error === 'object' && error !== null) {
        const e = error as Record<string, unknown>
        if (typeof e.code === 'string' && typeof e.message === 'string') {
            return {
                code: e.code,
                message: e.message,
                details:
                    typeof e.details === 'object' && e.details !== null
                        ? (e.details as Record<string, unknown>)
                        : undefined,
            }
        }
    }

    return {
        code: 'ERR_SEARCH_REQUEST_FAILED',
        message: fallbackMessage,
    }
}

export class SearchAdapter {
    async searchByText(
        payload: SearchByTextRequest,
        options?: RequestOptions
    ): Promise<SearchResponse> {
        const body: SearchByTextRequest = {
            query_text: payload.query_text,
            top_k: payload.top_k ?? SEARCH_CONFIG.defaultTopK,
            metric: payload.metric ?? DEFAULT_METRIC,
            ...(typeof payload.album_id === 'number' ? { album_id: payload.album_id } : {}),
        }

        try {
            const response = await scaffoldAdapter.post<SearchResponse>(
                SEARCH_CONFIG.paths.searchByText,
                body,
                {
                    signal: options?.signal,
                    timeout: SEARCH_CONFIG.requestTimeoutMs,
                }
            )
            return response.data
        } catch (error) {
            throw normalizeSearchError(error, 'Failed to search by text.')
        }
    }

    async searchByImage(
        payload: SearchByImageRequest,
        options?: RequestOptions
    ): Promise<SearchResponse> {
        const maxSizeBytes = SEARCH_CONFIG.maxImageSizeMb * 1024 * 1024
        if (payload.file.size > maxSizeBytes) {
            throw {
                code: 'ERR_FILE_TOO_LARGE',
                message: `Image exceeds maximum size of ${SEARCH_CONFIG.maxImageSizeMb}MB.`,
                details: {
                    maxImageSizeMb: SEARCH_CONFIG.maxImageSizeMb,
                    actualSizeBytes: payload.file.size,
                },
            } as StandardError
        }

        const formData = new FormData()
        formData.append('file', payload.file)
        formData.append('top_k', String(payload.top_k ?? SEARCH_CONFIG.defaultTopK))
        formData.append('metric', payload.metric ?? DEFAULT_METRIC)

        if (typeof payload.album_id === 'number') {
            formData.append('album_id', String(payload.album_id))
        }

        try {
            const response = await scaffoldAdapter.post<SearchResponse>(
                SEARCH_CONFIG.paths.searchByImage,
                formData,
                {
                    signal: options?.signal,
                    timeout: SEARCH_CONFIG.requestTimeoutMs,
                }
            )
            return response.data
        } catch (error) {
            throw normalizeSearchError(error, 'Failed to search by image.')
        }
    }
}

export const searchAdapter = new SearchAdapter()