/**
 * @file SearchByImageDialog.tsx
 * @layer components (Layer 2)
 * @description Dialog nhỏ cho tìm kiếm bằng ảnh — 2 cách: chọn file từ
 *              thiết bị hoặc kéo thả. Component thuần — nhận onSubmit(file)
 *              qua props, KHÔNG tự gọi useSearchController() (đúng ranh
 *              giới Nhóm B, giống DashboardSidebar).
 * @owner AG-04
 */

import React from 'react';
import { X } from 'lucide-react';

interface SearchByImageDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (file: File) => void;
    isLoading?: boolean;
}

export function SearchByImageDialog({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
}: SearchByImageDialogProps): React.ReactElement | null {
    const [isDragActive, setIsDragActive] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFile = (file: File | undefined) => {
        if (!file) return;
        onSubmit(file);
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
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 'var(--spacing-5xl)',
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 'var(--spacing-xl)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--spacing-lg)',
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: 'var(--text-heading-h4-size)',
                            fontWeight: 'var(--text-heading-h4-weight)',
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        Search by Image
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        style={{
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
                </div>

                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragActive(true);
                    }}
                    onDragLeave={() => setIsDragActive(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragActive(false);
                        handleFile(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: `2px dashed ${isDragActive ? 'var(--color-brand-primary)' : 'var(--color-border-medium)'}`,
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-2xl)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: isDragActive ? 'var(--color-bg-secondary)' : 'transparent',
                        transition: `border-color var(--duration-normal) var(--easing-in-out), background-color var(--duration-normal) var(--easing-in-out)`,
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                        style={{ display: 'none' }}
                    />
                    <p
                        style={{
                            margin: 0,
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--text-body-base-size)',
                        }}
                    >
                        {isLoading
                            ? 'Searching...'
                            : 'Drag & drop an image here, or click to browse'}
                    </p>
                </div>
            </div>
        </div>
    );
}