/**
 * @file upload_routers.ts
 * @layer routers
 * @description Upload router layer (0% JSX): thin wrapper for upload services.
 *              No RouteObject here because upload is embedded feature (modal),
 *              not a standalone URL route.
 * @owner AG-04
 */

import { useUploadQueue } from '../services/upload_services'

/**
 * Type guard: validate album selection before enqueueFiles is called at page layer.
 * Rule: hợp lệ khi là integer.
 */
export function validateAlbumSelected(
    albumId: number | undefined | null
): albumId is number {
    return typeof albumId === 'number' && Number.isInteger(albumId)
}

/**
 * Thin controller wrapper for upload workflow.
 * Returns exact shape from useUploadQueue() without modification.
 */
export function useUploadController() {
    return useUploadQueue()
}