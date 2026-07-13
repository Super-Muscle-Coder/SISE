/**
 * @file AuthForm.tsx
 * @layer components (Layer 3)
 * @description Reusable authentication form wrapper component.
 *              Mọi giá trị thiết kế (spacing, typography, màu) đọc qua
 *              var(--token) từ globals.css — khớp design-system/*.ts.
 *              Tailwind class CHỈ dùng cho layout thuần (không token hóa).
 * @owner AG-04
 */

import React from 'react';

interface AuthFormProps {
    title?: string;
    onSubmit: (e: React.FormEvent) => void;
    children: React.ReactNode;
    isLoading?: boolean;
}

/**
 * AuthForm: Wrapper for authentication forms
 */
export function AuthForm({
    title,
    onSubmit,
    children,
    isLoading = false,
}: AuthFormProps): React.ReactElement {
    return (
        <form
            onSubmit={onSubmit}
            className="flex flex-col"
            style={{ gap: 'var(--spacing-base)' }}
            aria-busy={isLoading}
        >
            {title && (
                <h2
                    style={{
                        fontSize: 'var(--text-heading-h2-size)',
                        fontWeight: 'var(--text-heading-h2-weight)',
                        lineHeight: 'var(--text-heading-h2-line)',
                        letterSpacing: 'var(--text-heading-h2-tracking)',
                        color: 'var(--color-text-primary)',
                        marginBottom: 'var(--spacing-lg)',
                    }}
                >
                    {title}
                </h2>
            )}
            {children}
        </form>
    );
}