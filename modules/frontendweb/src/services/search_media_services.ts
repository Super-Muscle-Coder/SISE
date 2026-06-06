/**
 * search_media_services.ts: React hooks for hybrid search workflow
 * Manages text + image queries with debounce, AbortController, and zero-copy handling
 * All config loaded from SEARCH_CONFIG (env-driven)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { searchAdapter } from '@/adapters/search_adapters';
import { SEARCH_CONFIG } from '@/configs/search_configs';
import type {
    SearchQuery,
    SearchResultItem,
    SearchState,
} from '@/entities/search_entities';

/**
 * useHybridSearch: Unified search hook managing text + image queries
 * with configurable debounce, AbortController cascading, and zero-copy binary handling.
 *
 * Key behaviors:
 * - Text input debounces for SEARCH_CONFIG.textDebounceMs before firing request
 * - Image selection immediately fires (no debounce)
 * - Switching modality (text → image or vice versa) aborts prior in-flight request
 * - Binary file passed as FormData (zero-copy) to adapter
 * - Config values sourced from environment (no hardcoding)
 */
export const useHybridSearch = () => {
    // State: text query, image file, results, loading, error
    const [textQuery, setTextQuery] = useState<string>('');
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Abort & debounce controllers
    const searchAbortRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * cancelPriorSearch: Safely abort any in-flight request and clear debounce timer
     */
    const cancelPriorSearch = useCallback(() => {
        if (searchAbortRef.current) {
            searchAbortRef.current.abort();
            searchAbortRef.current = null;
        }
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, []);

    /**
     * executeSearch: Internal function to fire the actual search request
     * Called after debounce delay for text queries, immediately for image queries
     */
    const executeSearch = useCallback(
        async (query: SearchQuery) => {
            try {
                setIsLoading(true);
                setError(null);

                // Create fresh AbortController for this search
                searchAbortRef.current = new AbortController();

                let searchResults: SearchResultItem[];

                if (query.type === 'text') {
                    if (!query.queryText) {
                        throw new Error('Query text is required for text search');
                    }
                    searchResults = await searchAdapter.searchByText(
                        query.queryText,
                        SEARCH_CONFIG.defaultTopK, // From env via config
                        { signal: searchAbortRef.current.signal }
                    );
                } else if (query.type === 'image') {
                    if (!query.imageFile) {
                        throw new Error('Image file is required for image search');
                    }
                    searchResults = await searchAdapter.searchByImage(
                        query.imageFile,
                        SEARCH_CONFIG.defaultTopK, // From env via config
                        { signal: searchAbortRef.current.signal }
                    );
                } else {
                    throw new Error('Invalid query type');
                }

                setResults(searchResults);
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    // Request was cancelled; silence the error
                    return;
                }
                const errorMessage = err instanceof Error ? err.message : 'Search failed';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    /**
     * handleTextQueryChange: Text input handler with debounce
     * If text is empty, clear search state
     * If text provided, debounce for SEARCH_CONFIG.textDebounceMs before executing search
     */
    const handleTextQueryChange = useCallback(
        (text: string) => {
            setTextQuery(text);

            // Clear image selection when typing in text box
            if (selectedImageFile) {
                setSelectedImageFile(null);
            }

            // Cancel prior debounce/search
            cancelPriorSearch();
            setResults([]);
            setError(null);

            if (!text.trim()) {
                return; // Empty text: do not fire search
            }

            // Schedule debounced search using config value (from env)
            debounceTimerRef.current = setTimeout(() => {
                executeSearch({
                    type: 'text',
                    queryText: text.trim(),
                });
            }, SEARCH_CONFIG.textDebounceMs); // From env via config
        },
        [selectedImageFile, cancelPriorSearch, executeSearch]
    );

    /**
     * handleImageFileSelected: Image selection handler (file picker or drag-drop)
     * Immediately fires search (no debounce), clears text query
     */
    const handleImageFileSelected = useCallback(
        (file: File) => {
            // Clear text input when selecting image
            setTextQuery('');

            // Cancel any prior search/debounce
            cancelPriorSearch();

            setSelectedImageFile(file);
            setResults([]);
            setError(null);

            // Fire search immediately (no debounce for images)
            executeSearch({
                type: 'image',
                imageFile: file,
            });
        },
        [cancelPriorSearch, executeSearch]
    );

    /**
     * clearSelectedImage: Reset image selection and results
     */
    const clearSelectedImage = useCallback(() => {
        setSelectedImageFile(null);
        setTextQuery('');
        cancelPriorSearch();
        setResults([]);
        setError(null);
    }, [cancelPriorSearch]);

    /**
     * clearTextQuery: Reset text query and results
     */
    const clearTextQuery = useCallback(() => {
        setTextQuery('');
        cancelPriorSearch();
        setResults([]);
        setError(null);
    }, [cancelPriorSearch]);

    /**
     * Cleanup: abort on-flight requests and clear timers on unmount
     */
    useEffect(() => {
        return () => {
            cancelPriorSearch();
        };
    }, [cancelPriorSearch]);

    return {
        // State
        textQuery,
        selectedImageFile,
        results,
        isLoading,
        error,

        // Handlers
        handleTextQueryChange,
        handleImageFileSelected,
        clearSelectedImage,
        clearTextQuery,
    };
};

/**
 * getConfidenceBadge: Compute confidence level and styling based on score
 * Score range: 0.0 to 1.0 (backend returns normalized cosine similarity)
 * Thresholds sourced from SEARCH_CONFIG (env-driven)
 */
export const getConfidenceBadge = (
    score: number
): { label: string; colorClass: string } => {
    if (score >= SEARCH_CONFIG.scoreThresholds.high) {
        return {
            label: 'High Match',
            colorClass: 'bg-green-500 text-white',
        };
    }
    if (score >= SEARCH_CONFIG.scoreThresholds.medium) {
        return {
            label: 'Medium Match',
            colorClass: 'bg-amber-500 text-white',
        };
    }
    return {
        label: 'Low Match',
        colorClass: 'bg-gray-400 text-white',
    };
};