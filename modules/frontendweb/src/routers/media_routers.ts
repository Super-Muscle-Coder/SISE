/**
 * @file media_routers.ts
 * @layer routers
 * @description Media router layer (0% JSX): thin wrappers for media services.
 *              No RouteObject here because media uses shared "/dashboard" route
 *              managed by scaffold router layer.
 * @owner AG-04
 */

import {
    useMediaGallery,
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
 * Thin controller wrapper for image status polling workflow.
 * Returns exact shape from useImageStatusPolling() without modification.
 */
export function useImageStatusController(imageId: string) {
    return useImageStatusPolling(imageId)
}