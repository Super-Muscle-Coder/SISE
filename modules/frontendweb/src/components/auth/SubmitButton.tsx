/**
 * @file SubmitButton.tsx
 * @layer components (Layer 3)
 * @description Reusable submit button component with loading state
 * @owner AG-04
 */

import React from 'react';

interface SubmitButtonProps {
    children: React.ReactNode;
    loadingText?: string;
    isLoading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    className?: string;
}

/**
 * SubmitButton: Styled submit button
 * 
 * Features:
 * - Loading state with spinner
 * - Disabled state
 * - Custom styling
 * - Hover/active animations
 */
export function SubmitButton({
    children,
    loadingText = 'Loading...',
    isLoading = false,
    disabled = false,
    onClick,
    className = '',
}: SubmitButtonProps): React.ReactElement {
    return (
        <button
            type="submit"
            disabled={disabled || isLoading}
            onClick={onClick}
            className={`
                w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-full
                shadow-md hover:bg-red-700 active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-smooth
                ${className}
            `}
        >
            {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg
                        className="w-4 h-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    {loadingText}
                </span>
            ) : (
                children
            )}
        </button>
    );
}