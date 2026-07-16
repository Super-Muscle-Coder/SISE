/**
 * @file media_routers.ts
 * @layer routers
 * @description Media router layer (0% JSX): thin wrappers for media services.
 *              No RouteObject here because media uses shared "/dashboard" route
 *              managed by scaffold router layer.
 *              SỬA: bổ sung useAlbumListController() — trước đây thiếu,
 *              không có cách nào đúng kiến trúc để pages/ lấy danh sách
 *              album mà không gọi thẳng adapters/ (vi phạm ranh giới
 *              Nhóm C). Phát hiện qua đối chiếu chéo với UI cũ
 *              (DashboardPage gọi thẳng mediaAdapter.getAlbumList()).
 * @owner AG-04
 */

import {
    useMediaGallery,
    useAlbumList,
    useImageStatusPolling,
} from '../services/media_services'

/**
 * Thin controller wrapper for media gallery workflow.
 * Returns exact shape from useMediaGallery() without modification.
 */
export function useMediaGalleryController(initialAlbumId?: number) {
    return useMediaGallery(initialAlbumId)
}

/**
 * Thin controller wrapper for album list workflow.
 * Returns exact shape from useAlbumList() without modification.
 * Dùng bởi pages/DashboardPage.tsx và components/upload/BulkUploadModal.tsx
 * (album selector) — tránh gọi thẳng mediaAdapter từ Nhóm C/B.
 */
export function useAlbumListController() {
    return useAlbumList()
}

/**
 * Thin controller wrapper for image status polling workflow.
 * Returns exact shape from useImageStatusPolling() without modification.
 */
export function useImageStatusController(imageId: string) {
    return useImageStatusPolling(imageId)
}