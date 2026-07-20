/**
 * @file DetailImagePage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description Trang xem chi tiết 1 ảnh, kiểu Pinterest: ảnh full-size
 *              (không crop) ở góc trên-trái, phần còn lại hiển thị "ảnh
 *              tương tự" — thực chất là kết quả search bị động, dùng
 *              chính ảnh đang xem làm input.
 *              KHÔNG có endpoint "similar images" riêng trong hợp đồng —
 *              tái sử dụng nguyên vẹn workflow search đã có
 *              (useSearchController). Chiến lược 2 tầng: ưu tiên
 *              searchByText() với tags của ảnh (nhẹ hơn); nếu ảnh không
 *              có tags, fallback searchByImage() với chính file ảnh (tải
 *              lại từ minio_url thành Blob/File).
 *              Gọi useImageMetadataController() (media_routers.ts) để lấy
 *              metadata ảnh đang xem — ĐÂY LÀ NƠI DUY NHẤT gọi các hook
 *              này, đúng vai trò Nhóm C.
 * @owner AG-04
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { useImageMetadataController } from '@/routers/media_routers'
import { useSearchController } from '@/routers/search_routers'
import { ImageCard } from '@/components/media'
import type { ImageMetadata } from '@/entities/media_entities'

/**
 * Tải lại ảnh từ URL thành File — dùng khi ảnh không có tags, cần
 * fallback search-by-image. minio_url là presigned GET URL (đã audit
 * đúng schema ImageMetadata), fetch trực tiếp được vì cùng-origin hoặc
 * CORS đã cấu hình đúng ở MinIO.
 */
async function urlToFile(url: string, filename: string): Promise<File> {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type || 'image/jpeg' })
}

export function DetailImagePage(): React.ReactElement {
    const { imageId } = useParams<{ imageId: string }>()
    const { image, loading, error } = useImageMetadataController(imageId)
    const search = useSearchController()

    const hasTriggeredSimilarSearch = React.useRef<string | null>(null)

    // Khi ảnh đã tải xong, tự động tìm "ảnh tương tự" — CHỈ chạy 1 lần
    // cho mỗi imageId (tránh gọi lại API mỗi khi component re-render vì
    // lý do khác không liên quan).
    React.useEffect(() => {
        if (!image || hasTriggeredSimilarSearch.current === image.image_id) return
        hasTriggeredSimilarSearch.current = image.image_id

        const findSimilar = async () => {
            if (image.tags && image.tags.length > 0) {
                // Tầng 1: ưu tiên tags — nhẹ hơn, không cần tải lại ảnh.
                await search.searchByText(image.tags.join(' '))
            } else {
                // Tầng 2: fallback — ảnh không có tags, tìm bằng chính ảnh.
                try {
                    const file = await urlToFile(image.minio_url, `${image.image_id}.jpg`)
                    await search.searchByImage(file)
                } catch (err) {
                    console.warn('Failed to load image for similarity search:', err)
                }
            }
        }

        findSimilar()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image])

    if (loading) {
        return <p style={{ color: 'var(--color-text-secondary)' }}>Loading image...</p>
    }

    if (error || !image) {
        return (
            <p style={{ color: 'var(--color-semantic-error)' }}>
                {error?.message ?? 'Image not found.'}
            </p>
        )
    }

    // Kết quả search bị động — loại bỏ chính ảnh đang xem khỏi danh sách
    // "tương tự" (nếu nó tự khớp chính nó với score cao nhất).
    const similarImages: ImageMetadata[] = search.results
        .filter((r) => r.image_id !== image.image_id)
        .map((r) => r.metadata)

    return (
        <div style={{ display: 'flex', gap: 'var(--spacing-xl)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Ảnh chính — góc trên-trái, full size không crop */}
            <div style={{ flex: '0 0 360px', maxWidth: '100%' }}>
                <img
                    src={image.minio_url}
                    alt={`Image ${image.image_id}`}
                    style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-md)',
                        display: 'block',
                    }}
                />

                {image.tags && image.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-base)' }}>
                        {image.tags.map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    backgroundColor: 'var(--color-bg-tertiary)',
                                    color: 'var(--color-text-secondary)',
                                    borderRadius: 'var(--radius-full)',
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    fontSize: 'var(--text-body-xs-size)',
                                }}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Ảnh tương tự — masonry, phần không gian còn lại */}
            <div style={{ flex: 1, minWidth: '280px' }}>
                <h3
                    style={{
                        margin: '0 0 var(--spacing-base) 0',
                        fontSize: 'var(--text-heading-h4-size)',
                        fontWeight: 'var(--text-heading-h4-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Similar images
                </h3>

                {search.isLoading ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Finding similar images...</p>
                ) : similarImages.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>No similar images found.</p>
                ) : (
                    <div className="masonry-3">
                        {similarImages.map((item) => (
                            <div key={item.image_id} className="masonry-item">
                                <ImageCard item={item} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}