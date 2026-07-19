/**
 * @file DashboardSidebar.tsx
 * @layer components (Layer 2)
 * @description Thanh điều hướng dọc cố định, cạnh trái Dashboard (~5%
 *              width). Component thuần — nhận activeItem + onNavigate qua
 *              props, KHÔNG tự gọi navigate()/hook nào (đúng ranh giới
 *              Nhóm B — điều hướng thật do pages/DashboardPage.tsx quyết
 *              định, xem AP-7 đã áp dụng nhất quán từ Footer/LandingLayout).
 *              SỬA: thay icon tĩnh (emoji) bằng lucide-react — đồng bộ
 *              thư viện icon đã dùng sẵn trong LandingFooter.tsx.
 * @owner AG-04
 */

import React from 'react';
import { Home, Upload, BarChart3 } from 'lucide-react';

export type DashboardNavItem = 'home' | 'upload' | 'result';

interface DashboardSidebarProps {
    activeItem: DashboardNavItem;
    onNavigate: (item: DashboardNavItem) => void;
}

const NAV_ITEMS: { key: DashboardNavItem; label: string; Icon: typeof Home }[] = [
    { key: 'home', label: 'Home', Icon: Home },
    { key: 'upload', label: 'Upload', Icon: Upload },
    { key: 'result', label: 'Results', Icon: BarChart3 },
];

export function DashboardSidebar({ activeItem, onNavigate }: DashboardSidebarProps): React.ReactElement {
    return (
        <nav
            style={{
                width: '5%',
                minWidth: '72px',
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-lg)',
                paddingTop: 'var(--spacing-xl)',
                backgroundColor: 'var(--color-bg-primary)',
                borderRight: '1px solid var(--color-border-light)',
                flexShrink: 0,
            }}
        >
            {NAV_ITEMS.map(({ key, label, Icon }) => {
                const isActive = key === activeItem;
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onNavigate(key)}
                        aria-label={label}
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 'var(--spacing-xs)',
                            width: '100%',
                            padding: 'var(--spacing-sm) 0',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                            borderLeft: `3px solid ${isActive ? 'var(--color-brand-primary)' : 'transparent'}`,
                            transition: `color var(--duration-normal) var(--easing-in-out), border-color var(--duration-normal) var(--easing-in-out)`,
                        }}
                    >
                        <Icon size={22} strokeWidth={2} />
                        <span style={{ fontSize: 'var(--text-body-xs-size)', fontWeight: 'var(--font-weight-medium)' }}>
                            {label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}