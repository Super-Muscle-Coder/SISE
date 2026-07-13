/**
 * @file NavButton.tsx
 * @layer components (Layer 2)
 * @description Navigation button for landing page sub-page links.
 *              SỬA 2 lỗi:
 *              1. fontWeight trước đây gọi getComputedStyle(document
 *                 .documentElement) NGAY TRONG RENDER — mỗi lần re-render
 *                 (kể cả hover) buộc trình duyệt forced-reflow đồng bộ để
 *                 lấy 1 giá trị tĩnh đã biết trước (600). Đây là layout
 *                 thrashing, gây giật khi rê chuột qua nhiều NavButton
 *                 cùng lúc (nav bar). Sửa: dùng thẳng var(--token).
 *              2. var(--font-size-*) đã bị xóa khi tái cấu trúc
 *                 globals.css (đổi sang --text-heading-*--text-ui-*) —
 *                 nếu không sửa, biến này không tồn tại, font-size rỗng.
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
 * NavButton: Navigation button with raised hover effect.
 * Styling hoàn toàn driven bởi CSS variables, không hardcode.
 */
export function NavButton({
    label,
    isActive = false,
    onClick,
    className = '',
    size = 'md',
}: NavButtonProps): React.ReactElement {
    const [isHovered, setIsHovered] = React.useState(false);

    // NavButton không thuộc heading/body/ui chuẩn (kích thước riêng cho
    // nav sub-page link) — giữ thang size cục bộ, nhưng trỏ về token gần
    // nhất hợp lý thay vì --font-size-* đã xóa.
    const sizeMap = {
        sm: { padding: 'var(--spacing-sm) var(--spacing-base)', fontSize: 'var(--text-ui-label-size)' },
        md: { padding: 'var(--spacing-md) var(--spacing-lg)', fontSize: 'var(--text-heading-h4-size)' },
        lg: { padding: 'var(--spacing-base) var(--spacing-xl)', fontSize: 'var(--text-heading-h3-size)' },
    };

    const currentSize = sizeMap[size];

    // SỬA: dùng thẳng var(--font-weight-semibold) — không cần
    // getComputedStyle vì đây là giá trị tĩnh, không đổi theo runtime.
    const baseStyle: React.CSSProperties = {
        fontWeight: 'var(--font-weight-semibold)' as unknown as number,
        borderRadius: 'var(--radius-2xl)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        lineHeight: '1.4',
        fontFamily: 'var(--typography-family-base)',
        transition: `all var(--duration-normal) var(--easing-in-out)`,
        border: 'none',
    };

    let stateStyle: React.CSSProperties = {};

    if (isActive) {
        stateStyle = {
            backgroundColor: 'var(--color-brand-primary)',
            color: 'var(--color-text-inverted)',
            transform: 'translateY(-6px)',
            boxShadow: '0 8px 16px rgba(0, 120, 215, 0.25)',
        };
    } else if (isHovered) {
        stateStyle = {
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            transform: 'translateY(-6px)',
            boxShadow: 'var(--shadow-lg)',
        };
    } else {
        stateStyle = {
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            boxShadow: 'none',
            transform: 'translateY(0)',
            border: 'none',
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