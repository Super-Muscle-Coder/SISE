/**
 * @file search_entities.ts
 * @layer entities
 * @description Type definitions cho workflow search. Khớp 1-1 openapi.yaml
 *              SearchResultItem, SearchResponse, MetricType (v1.2.3).
 * @owner AG-04
 * @reference openapi.yaml components.schemas.SearchResultItem/SearchResponse/
 *            MetricType, paths /search/image, /search/text
 */

import type { ImageMetadata } from './media_entities'

/**
 * METRIC TYPE
 * Reference: openapi.yaml components.schemas.MetricType
 * [FIX Medium#7, v1.2.0] Thu hẹp từ [L2, IP, COSINE] còn DUY NHẤT COSINE.
 * data_schema.yaml Clause B chỉ có 1 index HNSW dùng vector_cosine_ops.
 * KHÔNG mở rộng type này trước khi Clause B bổ sung index mới.
 */
export type MetricType = 'COSINE'

/**
 * SEARCH RESULT ITEM
 * Reference: openapi.yaml components.schemas.SearchResultItem
 */
export interface SearchResultItem {
    image_id: string // UUID
    score: number // Cosine similarity, không có ràng buộc range tường minh trong hợp đồng
    minio_url: string
    metadata: ImageMetadata
}

/**
 * SEARCH RESPONSE
 * Reference: openapi.yaml components.schemas.SearchResponse
 * LƯU Ý: schema này KHÔNG có field score_threshold/confidence — mọi phân
 * loại high/medium/low là diễn giải UI thuần túy (xem search_configs.ts
 * SEARCH_CONFIG.scoreThreshold), không phải giá trị Backend trả về.
 */
export interface SearchResponse {
    results: SearchResultItem[]
    latency_ms: number
    top_k: number
}

/**
 * SEARCH BY IMAGE REQUEST
 * Reference: openapi.yaml POST /search/image (multipart/form-data)
 * required: [file]
 */
export interface SearchByImageRequest {
    file: File
    top_k?: number // default: 10
    metric?: MetricType
    album_id?: number // Optional: filter results to specific album
}

/**
 * SEARCH BY TEXT REQUEST
 * Reference: openapi.yaml POST /search/text (application/json)
 * required: [query_text]
 */
export interface SearchByTextRequest {
    query_text: string
    top_k?: number // default: 10
    metric?: MetricType
    album_id?: number // Optional: filter results to specific album
}