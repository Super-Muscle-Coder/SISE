/**
 * @file LinkButton.tsx
 * @layer components (Layer 2)
 * @description Button dùng cho điều hướng thuần túy (KHÔNG gắn form/submit)
 *              — tách từ style của SubmitButton (components/auth/), vì
 *              SubmitButton có type="submit" cứng, chỉ đúng ngữ nghĩa khi
 *              nằm trong <form>. LinkButton dùng type="button", phù hợp
 *              cho CTA điều hướng như "Sign Up"/"Log In" ở Header/Hero
 *              Section — không thuộc form nào.
 *              Dùng CHUNG cho mọi nơi cần 1 nút điều hướng nổi bật (khác
 *              NavButton — vốn thiết kế riêng cho tab-style sub-page nav,
 *              không phù hợp CTA).
 * @owner AG-04
 */

import React from 'react';

interface LinkButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    /** 'solid' = nền brand color đặc (CTA chính); 'outline' = viền, nền trong suốt (CTA phụ, vd "Log In" cạnh "Sign Up") */
    variant?: 'solid' | 'outline';
    className?: string;
}

/**
 * LinkButton: Styled button cho điều hướng (không phải submit form).
 */
export function LinkButton({
    children,
    onClick,
    disabled = false,
    variant = 'solid',
    className = '',
}: LinkButtonProps): React.ReactElement {
    const [isHovered, setIsHovered] = React.useState(false);

    const solidStyle: React.CSSProperties = {
        backgroundColor: disabled
            ? 'var(--color-text-tertiary)'
            : isHovered
                ? 'var(--color-brand-primary-hover)'
                : 'var(--color-brand-primary)',
        color: 'var(--color-text-inverted)',
        border: 'none',
        boxShadow: 'var(--shadow-md)',
    };

    const outlineStyle: React.CSSProperties = {
        backgroundColor: isHovered && !disabled ? 'var(--color-bg-secondary)' : 'transparent',
        color: disabled ? 'var(--color-text-tertiary)' : 'var(--color-brand-primary)',
        border: `1px solid ${disabled ? 'var(--color-border-medium)' : 'var(--color-brand-primary)'}`,
        boxShadow: 'none',
    };

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={className}
            style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                fontSize: 'var(--text-ui-button-size)',
                fontWeight: 'var(--text-ui-button-weight)',
                borderRadius: 'var(--radius-full)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                transform: isHovered && !disabled ? 'scale(0.98)' : 'scale(1)',
                transition: `background-color var(--duration-normal) var(--easing-in-out), transform var(--duration-fast) var(--easing-in-out), opacity var(--duration-normal) var(--easing-in-out), border-color var(--duration-normal) var(--easing-in-out)`,
                ...(variant === 'solid' ? solidStyle : outlineStyle),
            }}
        >
            {children}
        </button>
    );
}