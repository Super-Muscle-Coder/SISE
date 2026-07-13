/**
 * @file LandingLayout.tsx
 * @layer page-layouts (Layer 3)
 * @description Layout wrapper cho landing/homepage.
 *              SỬA:
 *              1. Header đã tách thành components/header/LandingHeader.tsx
 *                 (trước đây 6 CSS class + state hasScrolled nằm lẫn ở đây
 *                 — quá phức tạp để coi là "1 phần layout", xứng đáng là
 *                 component độc lập). LandingLayout giờ chỉ CHỨA
 *                 LandingHeader, không tự định nghĩa style/logic header.
 *              2. [AP-7 FIX] `onPageChange` (tự biết tên page cụ thể) đổi
 *                 thành `onLinkClick` — khớp Footer.tsx đã sửa. LandingLayout
 *                 vẫn KHÔNG tự quyết định điều hướng, chỉ truyền tiếp
 *                 callback xuống Footer nguyên vẹn.
 * @owner AG-04
 */
import { LandingHeader } from '@/components/header';
import { LandingFooter, type LandingFooterQuickLinkPage } from '@/components/footer';
import React from 'react';
import './landing-layout.css';

interface LandingLayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    headerContent?: React.ReactNode;
    /**
     * Truyền tiếp xuống Footer nguyên vẹn — LandingLayout không tự xử lý
     * điều hướng, chỉ là ống dẫn (xem pages/LandingPage.tsx cho logic thật).
     */
    onLinkClick?: (page: LandingFooterQuickLinkPage) => void;
}

/**
 * LandingLayout: Full-width landing page structure.
 *
 * Kiến trúc:
 * - LandingHeader (sticky, dynamic shadow — component riêng)
 * - Main content area (khung cho sub-page qua children)
 * - LandingFooter (persistent, AOS animation)
 */
export function LandingLayout({
    children,
    showHeader = true,
    headerContent,
    onLinkClick,
}: LandingLayoutProps): React.ReactElement {
    return (
        <div className="landing-layout">
            {showHeader && <LandingHeader>{headerContent}</LandingHeader>}

            <main className="landing-layout__main">
                {children}
            </main>

            <LandingFooter onLinkClick={onLinkClick} />
        </div>
    );
}