/**
 * @file DeleteImageConfirmDialog.tsx
 * @layer components (Layer 2)
 * @description Dialog xác nhận trước khi xóa ảnh (soft delete). Component
 *              thuần — nhận isOpen/onConfirm/onCancel qua props, KHÔNG tự
 *              gọi useDeleteImage() (đúng ranh giới Nhóm B).
 * @owner AG-04
 */

import React from 'react'

interface DeleteImageConfirmDialogProps {
    isOpen: boolean
    onCancel: () => void
    onConfirm: () => void
    isDeleting?: boolean
    error?: string | null
}

export function DeleteImageConfirmDialog({
    isOpen,
    onCancel,
    onConfirm,
    isDeleting = false,
    error = null,
}: DeleteImageConfirmDialogProps): React.ReactElement | null {
    if (!isOpen) return null

    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={onCancel}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'var(--color-overlay-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-lg)',
                zIndex: 1100,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '360px',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 'var(--spacing-xl)',
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        marginBottom: 'var(--spacing-sm)',
                        fontSize: 'var(--text-heading-h4-size)',
                        fontWeight: 'var(--text-heading-h4-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    Delete this image?
                </h3>
                <p
                    style={{
                        margin: 0,
                        marginBottom: 'var(--spacing-lg)',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--text-body-sm-size)',
                    }}
                >
                    This action cannot be undone from this screen.
                </p>

                {error && (
                    <p style={{ margin: '0 0 var(--spacing-base) 0', color: 'var(--color-semantic-error)', fontSize: 'var(--text-body-sm-size)' }}>
                        {error}
                    </p>
                )}

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--color-border-medium)',
                            backgroundColor: 'var(--color-bg-primary)',
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--text-ui-button-size)',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            backgroundColor: isDeleting ? 'var(--color-text-tertiary)' : 'var(--color-semantic-error)',
                            color: 'var(--color-text-inverted)',
                            fontSize: 'var(--text-ui-button-size)',
                            fontWeight: 'var(--text-ui-button-weight)',
                            cursor: isDeleting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}