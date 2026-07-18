/**
 * @file FormSubmitButton.tsx
 * @layer components (Layer 2)
 * @description Nút submit THẬT (type="submit", trigger onSubmit của form
 *              cha) — dùng chung cho LoginForm/SignupForm. KHÁC LinkButton
 *              (type="button", dùng cho điều hướng thuần, KHÔNG submit form
 *              nào) — 2 component tách biệt vì khác bản chất ngữ nghĩa
 *              HTML, không dùng lẫn cho nhau.
 * @owner AG-04
 */

import React from 'react';

interface FormSubmitButtonProps {
    children: React.ReactNode;
    loadingText?: string;
    isLoading?: boolean;
    disabled?: boolean;
}

export function FormSubmitButton({
    children,
    loadingText = 'Loading...',
    isLoading = false,
    disabled = false,
}: FormSubmitButtonProps): React.ReactElement {
    const [isHovered, setIsHovered] = React.useState(false);
    const isDisabled = disabled || isLoading;

    return (
        <button
            type="submit"
            disabled={isDisabled}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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
                backgroundColor: isDisabled
                    ? 'var(--color-text-tertiary)'
                    : isHovered
                        ? 'var(--color-brand-primary-hover)'
                        : 'var(--color-brand-primary)',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                boxShadow: 'var(--shadow-md)',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.6 : 1,
                transform: isHovered && !isDisabled ? 'scale(0.98)' : 'scale(1)',
                transition: `background-color var(--duration-normal) var(--easing-in-out), transform var(--duration-fast) var(--easing-in-out), opacity var(--duration-normal) var(--easing-in-out)`,
            }}
        >
            {isLoading ? loadingText : children}
        </button>
    );
}