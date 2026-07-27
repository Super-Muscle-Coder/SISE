/**
 * @file search_configs.ts
 * @layer configs
 * @description Cấu hình riêng workflow search: debounce, top_k mặc định,
 *              ngưỡng hiển thị confidence (UI-only), timeout request.
 * @owner AG-04
 * @reference frontend.env.local, openapi.yaml /search/image, /search/text
 * SỬA (phát hiện qua thực nghiệm thật — "modality gap"): TRƯỚC ĐÂY chỉ có
 * 1 bộ ngưỡng {high: 0.85, medium: 0.65} dùng chung cho cả text lẫn image
 * search — SAI về mặt khoa học. Text-to-image search và image-to-image
 * search KHÔNG cùng thang điểm cosine similarity, do hiện tượng đã được
 * literature ghi nhận chính thức là "modality gap" (Liang et al., 2022 —
 * text và image không chồng khít hoàn toàn lên nhau trong không gian
 * embedding CLIP, dù cấu trúc tương đối vẫn đúng). Dữ liệu thực nghiệm
 * thu thập trên hệ thống thật (Project Owner tự test nhiều lần, nhiều
 * cách gõ khác nhau): text search cho object ĐÚNG dao động ~25-40%, trong
 * khi image search cho cùng object ĐÚNG dao động ~75-100%. Dùng chung 1
 * ngưỡng cũ (0.85/0.65) khiến MỌI kết quả text search — dù đúng tuyệt
 * đối — luôn hiện màu "low" (xám), gây hiểu lầm nghiêm trọng cho người
 * dùng. Nay tách 2 bộ ngưỡng riêng theo mode.
 */

import { getEnvNumberWithDefault, getEnvFloatWithDefault } from '@/utils/env_helpers';

type ScoreLevel = 'high' | 'medium' | 'low';
type SearchMode = 'text' | 'image';

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
     */
    defaultTopK: getEnvNumberWithDefault('VITE_SEARCH_DEFAULT_TOP_K', 10),

    /**
     * [UI-ONLY] Ngưỡng hiển thị badge độ tin cậy trên UI kết quả search —
     * TÁCH RIÊNG theo mode (text vs image), đúng hiện tượng modality gap
     * đã xác nhận bằng thực nghiệm thật. KHÔNG tồn tại trong
     * SearchResultItem/SearchResponse schema — openapi.yaml chỉ trả về
     * "score: number" thô, mọi phân loại high/medium/low là diễn giải UI
     * thuần túy, có thể chỉnh tự do mà không cần đồng bộ Backend.
     */
    scoreThreshold: {
        text: {
            high: getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_TEXT_HIGH', 0.40),
            medium: getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_TEXT_MEDIUM', 0.25),
        } as const,
        image: {
            high: getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_IMAGE_HIGH', 0.80),
            medium: getEnvFloatWithDefault('VITE_SEARCH_SCORE_THRESHOLD_IMAGE_MEDIUM', 0.50),
        } as const,
        /**
         * classify: PHẢI truyền đúng mode ('text' | 'image') để dùng đúng
         * bộ ngưỡng — gọi thiếu mode là lỗi logic (không có default ngầm
         * định, buộc caller phải biết rõ đang phân loại kết quả của
         * search nào).
         */
        classify: (score: number, mode: SearchMode): ScoreLevel => {
            const high = getEnvFloatWithDefault(
                mode === 'text' ? 'VITE_SEARCH_SCORE_THRESHOLD_TEXT_HIGH' : 'VITE_SEARCH_SCORE_THRESHOLD_IMAGE_HIGH',
                mode === 'text' ? 0.40 : 0.80
            );
            const medium = getEnvFloatWithDefault(
                mode === 'text' ? 'VITE_SEARCH_SCORE_THRESHOLD_TEXT_MEDIUM' : 'VITE_SEARCH_SCORE_THRESHOLD_IMAGE_MEDIUM',
                mode === 'text' ? 0.25 : 0.50
            );
            if (score >= high) return 'high';
            if (score >= medium) return 'medium';
            return 'low';
        },
    } as const,

    /**
     * [UI-ONLY] Timeout riêng cho search request.
     */
    requestTimeoutMs: getEnvNumberWithDefault('VITE_SEARCH_REQUEST_TIMEOUT_MS', 30000),

    /**
     * [CONTRACT] Đồng bộ với SCAFFOLD_CONFIG.UPLOAD.maxFileSizeMb.
     */
    maxImageSizeMb: getEnvNumberWithDefault('VITE_SEARCH_MAX_IMAGE_SIZE_MB', 20),
} as const;

export type SearchConfigType = typeof SEARCH_CONFIG;