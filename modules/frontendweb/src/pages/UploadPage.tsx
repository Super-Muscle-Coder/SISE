/**
 * @file UploadPage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description Trang Upload — 2 vùng cố định:
 *              1. AlbumStrip (trên, scroll ngang): nút tạo album + list
 *                 album. Bấm 1 album để lọc + hiện nút Upload; bấm lại
 *                 cùng album để bỏ chọn, quay về xem TẤT CẢ ảnh.
 *              2. Gallery (dưới, scroll dọc, masonry): ảnh mới→cũ. Nút
 *                 Upload CHỈ hiện đầu hàng khi đã chọn 1 album cụ thể.
 *              Gọi useAlbumListController() (media_routers.ts) để lấy
 *              danh sách album + tạo album mới (createAlbum, mới bổ sung
 *              vào media_services.ts); useMediaGalleryController()
 *              (media_routers.ts) để lấy/lọc ảnh theo album;
 *              useUploadController() (upload_routers.ts) để upload —
 *              ĐÂY LÀ NƠI DUY NHẤT gọi 3 hook này, đúng vai trò Nhóm C.
 *              KHÔNG gọi thẳng adapters/ ở bất kỳ đâu trong file này.
 *              selectedAlbumId là STATE RIÊNG của UploadPage (không phải
 *              field của albumController) — đúng quyết định đã chốt.
 * @owner AG-04
 */

import React from 'react';
import { Upload as UploadIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAlbumListController, useMediaGalleryController, useUpdateImageController, useDeleteImageController } from '@/routers/media_routers';
import { useUploadController, validateAlbumSelected } from '@/routers/upload_routers';
import { AlbumStrip } from '@/components/album-strip';
import { CreateAlbumDialog } from '@/components/create-album-dialog';
import { ImageCard, EditImageDialog, DeleteImageConfirmDialog } from '@/components/media';
import { BulkUploadModal } from '@/components/upload';
import type { ImageMetadata } from '@/entities/media_entities';

export function UploadPage(): React.ReactElement {
    const navigate = useNavigate();

    // State RIÊNG của UploadPage — album đang chọn để lọc/upload vào.
    // KHÔNG phải field của albumController (đúng quyết định đã chốt).
    const [selectedAlbumId, setSelectedAlbumId] = React.useState<number | null>(null);
    const [isCreateAlbumOpen, setIsCreateAlbumOpen] = React.useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);

    // SỬA: thêm state cho Edit/Delete (menu 3 chấm trên ImageCard) —
    // theo quyết định Project Owner, UploadPage cần đủ 3 chức năng
    // (Edit/Delete/Click xem chi tiết), không chỉ xem ảnh thuần túy.
    const [editingImage, setEditingImage] = React.useState<ImageMetadata | null>(null);
    const [deletingImage, setDeletingImage] = React.useState<ImageMetadata | null>(null);

    const albumController = useAlbumListController();
    const mediaController = useMediaGalleryController(selectedAlbumId ?? undefined);
    const uploadController = useUploadController();
    const updateController = useUpdateImageController();
    const deleteController = useDeleteImageController();

    const albums = albumController.items;

    // Đồng bộ: khi selectedAlbumId đổi, báo lại cho mediaController lọc
    // đúng album (hoặc bỏ lọc nếu null — xem lại useMediaGallery Nhóm 2,
    // setAlbumId(undefined) = lấy ảnh từ TẤT CẢ album).
    React.useEffect(() => {
        mediaController.setAlbumId(selectedAlbumId ?? undefined);
    }, [selectedAlbumId]);

    const handleSelectAlbum = (albumId: number) => {
        setSelectedAlbumId((prev) => (prev === albumId ? null : albumId));
    };

    const handleCreateAlbum = async (title: string) => {
        // SỬA: dùng albumController.createAlbum() (media_services.ts,
        // bổ sung mới) — không còn gọi thẳng mediaAdapter từ pages/, đúng
        // ranh giới Nhóm C. createAlbum() đã tự refetch() bên trong.
        const album = await albumController.createAlbum(title);
        if (album) {
            setIsCreateAlbumOpen(false);
        }
        // Nếu thất bại, giữ dialog mở — albumController.createError sẽ
        // có message lỗi, CreateAlbumDialog có thể hiển thị sau này nếu
        // cần (hiện tại dialog chưa nhận prop error, để đơn giản ở bước
        // MVP này).
    };

    const handleUploadClick = () => {
        if (!validateAlbumSelected(selectedAlbumId)) return;
        setIsUploadModalOpen(true);
    };

    const handleUploadSuccess = async () => {
        await mediaController.refetch();
        setIsUploadModalOpen(false);
    };

    // SỬA: 3 handler mới cho menu 3 chấm + click xem chi tiết trên
    // ImageCard — theo quyết định đủ 3 chức năng ở UploadPage.
    const handleImageClick = (item: ImageMetadata) => {
        navigate(`/dashboard/image/${item.image_id}`);
    };

    const handleEditSubmit = async (updates: { album_id?: number; privacy_level?: 0 | 1 | 2; tags?: string[] }) => {
        if (!editingImage) return;
        const result = await updateController.updateImage(editingImage.image_id, updates);
        if (result) {
            setEditingImage(null);
            await mediaController.refetch();
        }
        // Nếu thất bại, giữ dialog mở — updateController.updateError sẽ
        // hiển thị lỗi (đã truyền vào EditImageDialog qua prop error).
    };

    const handleDeleteConfirm = async () => {
        if (!deletingImage) return;
        const success = await deleteController.deleteImage(deletingImage.image_id);
        if (success) {
            setDeletingImage(null);
            await mediaController.refetch();
        }
        // Nếu thất bại, giữ dialog mở — deleteController.deleteError sẽ
        // hiển thị lỗi.
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <AlbumStrip
                albums={albums}
                selectedAlbumId={selectedAlbumId}
                onSelectAlbum={handleSelectAlbum}
                onCreateAlbumClick={() => setIsCreateAlbumOpen(true)}
            />

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-xl)',
                }}
            >
                {/* Nút Upload CHỈ hiện khi đã chọn 1 album cụ thể */}
                {selectedAlbumId !== null && (
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-lg)',
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            backgroundColor: 'var(--color-brand-primary)',
                            color: 'var(--color-text-inverted)',
                            fontSize: 'var(--text-ui-button-size)',
                            fontWeight: 'var(--text-ui-button-weight)',
                            cursor: 'pointer',
                        }}
                    >
                        <UploadIcon size={18} strokeWidth={2} />
                        Upload Images
                    </button>
                )}

                {mediaController.loading ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Loading images...</p>
                ) : mediaController.items.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        No images yet{selectedAlbumId !== null ? ' in this album' : ''}.
                    </p>
                ) : (
                    <div className="masonry-4">
                        {mediaController.items.map((item) => (
                            <div key={item.image_id} className="masonry-item">
                                <ImageCard
                                    item={item}
                                    onClick={handleImageClick}
                                    onEdit={setEditingImage}
                                    onDelete={setDeletingImage}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateAlbumDialog
                isOpen={isCreateAlbumOpen}
                onClose={() => setIsCreateAlbumOpen(false)}
                onSubmit={handleCreateAlbum}
            />

            <EditImageDialog
                isOpen={editingImage !== null}
                image={editingImage}
                albums={albums}
                onClose={() => setEditingImage(null)}
                onSubmit={handleEditSubmit}
                isSubmitting={updateController.isUpdating}
                error={updateController.updateError?.message ?? null}
            />

            <DeleteImageConfirmDialog
                isOpen={deletingImage !== null}
                onCancel={() => setDeletingImage(null)}
                onConfirm={handleDeleteConfirm}
                isDeleting={deleteController.isDeleting}
                error={deleteController.deleteError?.message ?? null}
            />

            {selectedAlbumId !== null && (
                <BulkUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    albums={albums}
                    defaultAlbumId={selectedAlbumId ?? undefined}
                    uploadState={uploadController}
                    onEnqueueFiles={uploadController.enqueueFiles}
                    onCancelFile={uploadController.cancelFile}
                    onRetryFile={uploadController.retryFile}
                    onClearQueue={uploadController.clearQueue}
                    onUploadSuccess={handleUploadSuccess}
                />
            )}
        </div>
    );
}