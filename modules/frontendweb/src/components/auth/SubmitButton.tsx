/**
 * @file SubmitButton.tsx
 * @layer components (Layer 3)
 * @description Reusable submit button component with loading state.
 *              SỬA: trước đây hardcode bg-red-600/hover:bg-red-700 (Tailwind
 *              built-in, không liên quan --color-brand-primary) — nay dùng
 *              đúng token brand color hiện tại.
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
 */
export function SubmitButton({
    children,
    loadingText = 'Loading...',
    isLoading = false,
    disabled = false,
    onClick,
    className = '',
}: SubmitButtonProps): React.ReactElement {
    const [isHovered, setIsHovered] = React.useState(false);
    const isDisabled = disabled || isLoading;

    return (
        <button
            type="submit"
            disabled={isDisabled}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`w-full ${className}`}
            style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                fontSize: 'var(--text-ui-button-size)',
                fontWeight: 'var(--text-ui-button-weight)',
                color: 'var(--color-text-inverted)',
                backgroundColor: isDisabled
                    ? 'var(--color-text-tertiary)'
                    : isHovered
                        ? 'var(--color-brand-primary-hover)'
                        : 'var(--color-brand-primary)',
                borderRadius: 'var(--radius-full)',
                boxShadow: 'var(--shadow-md)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.6 : 1,
                transform: isHovered && !isDisabled ? 'scale(0.98)' : 'scale(1)',
                transition: `background-color var(--duration-normal) var(--easing-in-out), transform var(--duration-fast) var(--easing-in-out), opacity var(--duration-normal) var(--easing-in-out)`,
            }}
        >
            {isLoading ? (
                <span className="flex items-center justify-center" style={{ gap: 'var(--spacing-sm)' }}>
                    <svg
                        className="animate-spin"
                        style={{ width: '1rem', height: '1rem' }}
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            style={{ opacity: 0.25 }}
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            style={{ opacity: 0.75 }}
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