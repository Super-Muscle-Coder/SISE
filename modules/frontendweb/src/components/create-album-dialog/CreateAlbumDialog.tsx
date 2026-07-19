/**
 * @file CreateAlbumDialog.tsx
 * @layer components (Layer 2)
 * @description Dialog nhỏ để tạo album mới — chỉ nhập title. Component
 *              thuần — nhận onSubmit(title) qua props, KHÔNG tự gọi
 *              mediaAdapter/hook nào (đúng ranh giới Nhóm B).
 * @owner AG-04
 */

import React from 'react';
import { X } from 'lucide-react';

interface CreateAlbumDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (title: string) => void;
    isLoading?: boolean;
}

export function CreateAlbumDialog({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
}: CreateAlbumDialogProps): React.ReactElement | null {
    const [title, setTitle] = React.useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
        setTitle('');
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'var(--color-overlay-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-lg)',
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '380px',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 'var(--spacing-xl)',
                    position: 'relative',
                }}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    style={{
                        position: 'absolute',
                        top: 'var(--spacing-base)',
                        right: 'var(--spacing-base)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                    }}
                >
                    <X size={20} strokeWidth={2} />
                </button>

                <h3
                    style={{
                        margin: 0,
                        marginBottom: 'var(--spacing-lg)',
                        fontSize: 'var(--text-heading-h4-size)',
                        fontWeight: 'var(--text-heading-h4-weight)',
                        color: 'var(--color-text-primary)',
                    }}
                >
                    New Album
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-base)' }}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Album name"
                        disabled={isLoading}
                        autoFocus
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: 'var(--spacing-md) var(--spacing-base)',
                            fontSize: 'var(--text-body-base-size)',
                            borderRadius: 'var(--radius-base)',
                            border: '1px solid var(--color-border-light)',
                            outline: 'none',
                            color: 'var(--color-text-primary)',
                            backgroundColor: isLoading ? 'var(--color-bg-tertiary)' : 'var(--color-bg-primary)',
                        }}
                    />

                    <button
                        type="submit"
                        disabled={isLoading || !title.trim()}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            fontSize: 'var(--text-ui-button-size)',
                            fontWeight: 'var(--text-ui-button-weight)',
                            color: 'var(--color-text-inverted)',
                            backgroundColor: isLoading || !title.trim() ? 'var(--color-text-tertiary)' : 'var(--color-brand-primary)',
                            borderRadius: 'var(--radius-full)',
                            border: 'none',
                            cursor: isLoading || !title.trim() ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {isLoading ? 'Creating...' : 'Create Album'}
                    </button>
                </form>
            </div>
        </div>
    );
}