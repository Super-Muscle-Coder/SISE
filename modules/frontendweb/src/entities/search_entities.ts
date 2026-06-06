/**
 * search_entities.ts: Domain contracts for hybrid search workflow
 * Aligns with OpenAPI SearchResponse and SearchResultItem schemas
 * Per openapi.yaml and data_schema.yaml
 */

export type SearchQueryType = 'text' | 'image';

export interface SearchQuery {
    type: SearchQueryType;
    queryText?: string; // Present if type === 'text'
    imageFile?: File; // Present if type === 'image'
}

export interface SearchResultItem {
    image_id: string; // UUID
    score: number; // 0.0 to 1.0 (cosine similarity)
    minio_url: string; // Signed GET URL for image preview
    metadata: {
        image_id: string;
        user_id: number;
        album_id: number | null;
        privacy_level: PrivacyLevel;
        tags: string[];
        created_at: string; // ISO 8601 timestamp
        index_status: 'pending' | 'ready' | 'failed';
        width: number; // For aspect-ratio calculation (per openapi.yaml ImageMetadata)
        height: number; // For aspect-ratio calculation
        minio_url: string; // Signed GET URL (per openapi.yaml ImageMetadata)
    };
}

export interface SearchResponse {
    results: SearchResultItem[];
    latency_ms: number;
    top_k: number;
}

export type PrivacyLevel = 0 | 1 | 2; // 0=Private, 1=Friends, 2=Public

export interface SearchState {
    textQuery: string;
    selectedImageFile: File | null;
    results: SearchResultItem[];
    isLoading: boolean;
    error: string | null;
}