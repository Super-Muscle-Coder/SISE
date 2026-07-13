/**
 * @file search_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow search: debounce, top_k mặc định,
 *              ngưỡng hiển thị confidence (UI-only), timeout request.
 * @owner AG-04
 * @reference frontend.env.local, openapi.yaml /search/image, /search/text
 */

import { getEnvNumberWithDefault, getEnvFloatWithDefault } from '@/utils/env_helpers';

export const SEARCH_CONFIG = {
    /**
     * [CONTRACT] API paths — openapi.yaml Clause D, Search.
     */
    paths: {
        searchByImage: '/search/image',
        searchByText: '/search/text',
    } as const,

    /**
     * [UI-ONLY] Debounce gõ phím trước khi gọi search-by-text.
     */
    debounceMs: getEnvNumberWithDefault('VITE_SEARCH_DEBOUNCE_MS', 500),

    /**
     * [CONTRACT] openapi.yaml /search/image, /search/text: top_k default 10.
     * SỬA v1.2.3: giá trị cũ (20) không khớp hợp đồng, đã xác nhận qua audit
     * và đọc lại openapi.yaml trực tiếp — default thật là 10.
     */
    defaultTopK: getEnvNumberWithDefault('VITE_SEARCH_DEFAULT_TOP_K', 10),

    /**
     * [UI-ONLY] Ngưỡng hiển thị badge độ tin cậy trên UI kết quả search.
     * KHÔNG tồn tại trong SearchResultItem/SearchResponse schema — openapi.yaml
     * chỉ trả về "score: number" thô, không phân loại high/medium/low. Đây
     * là diễn giải UI thuần túy, có thể chỉnh tự do mà không cần đồng bộ
     * Backend.
     */
    scoreThreshold: {
        high: getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_HIGH', 0.85),
        medium: getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_MEDIUM', 0.65),
        classify: (score: number): 'high' | 'medium' | 'low' => {
            const high = getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_HIGH', 0.85);
            const medium = getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_MEDIUM', 0.65);
            if (score >= high) return 'high';
            if (score >= medium) return 'medium';
            return 'low';
        },
    } as const,

    /**
     * [UI-ONLY] Timeout riêng cho search request — không có trong hợp đồng,
     * dài hơn VITE_API_TIMEOUT_MS mặc định vì search-by-image dùng
     * multipart upload.
     */
    requestTimeoutMs: getEnvNumberWithDefault('VITE_SEARCH_REQUEST_TIMEOUT_MS', 30000),

    /**
     * [CONTRACT] Đồng bộ với SCAFFOLD_CONFIG.UPLOAD.maxFileSizeMb —
     * search-by-image dùng multipart/form-data với cùng ràng buộc size như
     * upload (openapi.yaml).
     */
    maxImageSizeMb: getEnvNumberWithDefault('VITE_SEARCH_MAX_IMAGE_SIZE_MB', 20),
} as const;

export type SearchConfigType = typeof SEARCH_CONFIG;