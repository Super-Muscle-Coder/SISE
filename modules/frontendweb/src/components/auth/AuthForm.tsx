/**
 * @file AuthForm.tsx
 * @layer components (Layer 3)
 * @description Reusable authentication form wrapper component
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
 * 
 * Features:
 * - Consistent form styling
 * - Error message area
 * - Submit button area
 * - Loading state management
 */
export function AuthForm({
    title,
    onSubmit,
    children,
    isLoading = false,
}: AuthFormProps): React.ReactElement {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {title && (
                <h2 className="text-2xl font-bold text-zinc-900 mb-6">
                    {title}
                </h2>
            )}
            {children}
        </form>
    );
}