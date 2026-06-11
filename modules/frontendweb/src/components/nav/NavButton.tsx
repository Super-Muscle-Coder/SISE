/**
 * @file NavButton.tsx
 * @layer components (Layer 2)
 * @description Navigation button for landing page sub-page links
 * Styled using inline styles for better Tailwind compatibility
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
 * NavButton: Reusable navigation button component
 * 
 * Design:
 * - Inactive: Gray background, black text
 * - Active: Red background, white text
 */
export function NavButton({
    label,
    isActive = false,
    onClick,
    className = '',
    size = 'md',
}: NavButtonProps): React.ReactElement {
    // Size classes
    const sizeClasses: Record<string, string> = {
        sm: 'px-4 py-1.5 text-sm',
        md: 'px-5 py-2 text-sm',
        lg: 'px-6 py-2.5 text-base',
    };

    // Base styles
    const baseStyle: React.CSSProperties = {
        fontWeight: 600,
        borderRadius: '0.5rem',
        transition: 'all 200ms ease-in-out',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        border: 'none',
        padding: size === 'sm' ? '0.375rem 1rem' : size === 'lg' ? '0.625rem 1.5rem' : '0.5rem 1.25rem',
        fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1rem' : '0.875rem',
    };

    // Variant styles
    const variantStyle: React.CSSProperties = isActive
        ? {
            backgroundColor: '#dc2626', // red-600
            color: '#ffffff',
        }
        : {
            backgroundColor: '#6b7280', // gray-500
            color: '#000000',
        };

    return (
        <button
            onClick={onClick}
            style={{ ...baseStyle, ...variantStyle }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isActive ? '#b91c1c' : '#4b5563';
                if (!isActive) {
                    e.currentTarget.style.opacity = '0.9';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isActive ? '#dc2626' : '#6b7280';
                e.currentTarget.style.opacity = '1';
            }}
            className={className}
        >
            {label}
        </button>
    );
}