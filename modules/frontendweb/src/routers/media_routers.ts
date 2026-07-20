/**
 * @file media_routers.ts
 * @layer routers
 * @description Media router layer (0% JSX): thin wrappers for media services.
 *              No RouteObject here because media uses shared "/dashboard" route
 *              managed by scaffold router layer.
 *              SỬA: bổ sung useImageMetadataController(), useUpdateImageController(),
 *              useDeleteImageController() — cần cho DetailImagePage + menu
 *              Edit/Delete trên ImageCard.
 * @owner AG-04
 */

import {
    useMediaGallery,
    useAlbumList,
    useImageStatusPolling,
    useImageMetadata,
    useUpdateImage,
    useDeleteImage,
} from '../services/media_services'

export function useMediaGalleryController(initialAlbumId?: number) {
    return useMediaGallery(initialAlbumId)
}

export function useAlbumListController() {
    return useAlbumList()
}

export function useImageStatusController(imageId: string) {
    return useImageStatusPolling(imageId)
}

/**
 * Thin controller wrapper for single image metadata.
 * Dùng bởi pages/DetailImagePage.tsx.
 */
export function useImageMetadataController(imageId: string | undefined) {
    return useImageMetadata(imageId)
}

/**
 * Thin controller wrapper for update image metadata.
 * Dùng bởi components/media/EditImageDialog.tsx.
 */
export function useUpdateImageController() {
    return useUpdateImage()
}

/**
 * Thin controller wrapper for delete image.
 * Dùng bởi components/media/DeleteImageConfirmDialog.tsx.
 */
export function useDeleteImageController() {
    return useDeleteImage()
}