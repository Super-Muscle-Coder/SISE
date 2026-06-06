/**
 * search_adapters.ts: HTTP adapter layer for search endpoints
 * Handles text and image search requests with zero-copy FormData streaming
 * Integrates AbortSignal for cancellation
 */

import { scaffoldAdapter } from '@/adapters/scaffold_adapter_instance';
import { SEARCH_CONFIG } from '@/configs/search_configs';
import type { SearchResultItem, SearchResponse } from '@/entities/search_entities';

interface RequestOptions {
    signal?: AbortSignal;
}

export const searchAdapter = {
    /**
     * searchByText: Query search API with text prompt
     * Request: POST /search/text with { query_text, top_k }
     * Response: SearchResponse with result array
     */
    searchByText: async (
        queryText: string,
        topK: number,
        options?: RequestOptions
    ): Promise<SearchResultItem[]> => {
        const response = await scaffoldAdapter.post<SearchResponse>(
            '/search/text',
            {
                query_text: queryText,
                top_k: topK,
                metric: 'COSINE', // Fixed metric for CLIP embeddings (per openapi.yaml)
            },
            { signal: options?.signal }
        );
        return response.data.results;
    },

    /**
     * searchByImage: Query search API with binary image file
     * Request: POST /search/image with multipart/form-data containing binary file
     * Zero-copy pattern: File object passed directly to FormData (no base64 encoding)
     * Response: SearchResponse with result array
     */
    searchByImage: async (
        imageFile: File,
        topK: number,
        options?: RequestOptions
    ): Promise<SearchResultItem[]> => {
        // Validate file type against config (no hardcoding)
        const allowedMimes = SEARCH_CONFIG.allowedImageMimes;
        if (!allowedMimes.includes(imageFile.type)) {
            throw new Error(
                `Invalid image type: ${imageFile.type}. Allowed: ${allowedMimes.join(', ')}`
            );
        }

        // Validate file size against config
        const maxSizeBytes = SEARCH_CONFIG.maxImageSizeMb * 1024 * 1024;
        if (imageFile.size > maxSizeBytes) {
            throw new Error(
                `File exceeds ${SEARCH_CONFIG.maxImageSizeMb}MB limit`
            );
        }

        // Zero-copy FormData: file object passed by reference, not encoded
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('top_k', topK.toString());
        formData.append('metric', 'COSINE');

        const response = await scaffoldAdapter.post<SearchResponse>(
            '/search/image',
            formData,
            { signal: options?.signal }
        );
        return response.data.results;
    },
};