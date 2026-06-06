/**
 * @file search_configs.ts
 * @layer configs
 * @description Search workflow configuration - env-to-config boundary.
 *              All values from environment variables (via env_helpers).
 * @owner AG-04
 * @reference data_schema.yaml, openapi.yaml
 */

import {
    getEnvVarWithDefault,
    getEnvNumberWithDefault,
    getEnvFloatWithDefault,
    getEnvListWithDefault,
} from '@/utils/env_helpers';

// ============================================================================
// SEARCH CONFIGURATION (ENV-DRIVEN)
// ============================================================================

export const SEARCH_CONFIG = {
    // ========================================================================
    // DEBOUNCE & PERFORMANCE
    // ========================================================================
    textDebounceMs: getEnvNumberWithDefault('VITE_SEARCH_DEBOUNCE_MS', 500),
    defaultTopK: getEnvNumberWithDefault('VITE_SEARCH_DEFAULT_TOP_K', 20),
    requestTimeoutMs: getEnvNumberWithDefault('VITE_SEARCH_REQUEST_TIMEOUT_MS', 30000),

    // ========================================================================
    // SCORING THRESHOLDS (for confidence badges)
    // ========================================================================
    scoreThresholds: {
        high: getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_HIGH', 0.85),
        medium: getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_MEDIUM', 0.65),
    } as const,

    // ========================================================================
    // FILE UPLOAD CONSTRAINTS
    // ========================================================================
    maxImageSizeMb: getEnvNumberWithDefault('VITE_SEARCH_MAX_IMAGE_SIZE_MB', 20),
    allowedImageMimes: getEnvListWithDefault(
        'VITE_ALLOWED_CONTENT_TYPES',
        ['image/jpeg', 'image/png']
    ),
    imageAcceptTypes: getEnvVarWithDefault('VITE_ALLOWED_CONTENT_TYPES', 'image/jpeg,image/png'),

    // ========================================================================
    // UI MESSAGES & LABELS
    // ========================================================================
    messages: {
        emptyStateTitle: 'No matches found',
        emptyStateDescription:
            'Try adjusting your search query or upload a different image',
        noImageSelected: 'Select or drag an image to begin search',
        searchPlaceholder: 'Describe what you are looking for...',
        dropzonePrompt: 'Drop an image here or click to select',
        uploadingIndicator: 'Searching...',
        resultsInfo: (count: number) => `Found ${count} result${count !== 1 ? 's' : ''}`,
    } as const,

    // ========================================================================
    // PRIVACY LEVEL LABELS
    // ========================================================================
    privacyLabels: {
        0: 'Private',
        1: 'Friends',
        2: 'Public',
    } as const,

    privacyIcons: {
        0: '🔒',
        1: '👥',
        2: '🌍',
    } as const,
} as const;

export type SearchConfig = typeof SEARCH_CONFIG;