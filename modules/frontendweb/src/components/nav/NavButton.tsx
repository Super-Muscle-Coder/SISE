/**
 * @file NavButton.tsx
 * @layer components (Layer 2)
 * @description Navigation button for landing page sub-page links
 * 
 * Design Pattern: Uses Layer 1 CSS variables (globals.css)
 * States:
 * - Normal: White background, black text (no shadow, no transform)
 * - Hover: White background, black text, raised effect (translateY -6px), shadow
 * - Active: Blue background (--color-brand-primary), white text, raised + shadow
 * 
 * All styling uses CSS variables defined in globals.css to maintain consistency
 * @owner AG-04
 */

import React from 'react';

interface NavButtonProps {
    label: string;
    isActive?: boolean;
    onClick: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * NavButton: Navigation button with raised hover effect
 * Styling is driven by CSS variables, not hardcoded values
 */
export function NavButton({
    label,
    isActive = false,
    onClick,
    className = '',
    size = 'md',
}: NavButtonProps): React.ReactElement {
    const [isHovered, setIsHovered] = React.useState(false);

    // Size configuration
    const sizeMap = {
        sm: { padding: 'var(--spacing-sm) var(--spacing-base)', fontSize: 'var(--font-size-sm)' },
        md: { padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: 'var(--font-size-sm)' },
        lg: { padding: 'var(--spacing-base) var(--spacing-xl)', fontSize: 'var(--font-size-base)' },
    };

    const currentSize = sizeMap[size];

    // Base styles - NO BORDER initially
    const baseStyle: React.CSSProperties = {
        fontWeight: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--font-weight-semibold') || '600'),
        borderRadius: 'var(--radius-base)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        lineHeight: '1.4',
        fontFamily: 'var(--typography-family-base)',
        transition: `all var(--duration-normal) var(--easing-in-out)`,
        border: 'none',  // ✅ NO BORDER BASE
    };

    // Dynamic styles based on state
    let stateStyle: React.CSSProperties = {};

    if (isActive) {
        // Active state: Blue, white text, raised + shadow + BORDER
        stateStyle = {
            backgroundColor: 'var(--color-brand-primary)',
            color: 'var(--color-text-inverted)',
            transform: 'translateY(-6px)',
            boxShadow: '0 8px 16px rgba(0, 120, 215, 0.25)',
            // border: `1px solid var(--color-brand-primary)`,  // ✅ ADD border on active
        };
    } else if (isHovered) {
        // Hover state: White, black text, raised + shadow + BORDER
        stateStyle = {
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            transform: 'translateY(-6px)',
            boxShadow: 'var(--shadow-lg)',
            //border: `1px solid var(--color-border-light)`,  // ✅ ADD border on hover
        };
    } else {
        // Normal state: White, black text, NO shadow, NO raise, NO BORDER
        stateStyle = {
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            boxShadow: 'none',
            transform: 'translateY(0)',
            border: 'none',  // ✅ EXPLICITLY no border
        };
    }

    return (
        <button
            onClick={onClick}
            style={{ ...baseStyle, ...stateStyle }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={className}
        >
            {label}
        </button>
    );
}