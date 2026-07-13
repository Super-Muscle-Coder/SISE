/**
 * @file LandingHeader.tsx
 * @layer components (Layer 2)
 * @description Sticky header cho Landing Page, dynamic shadow khi cuộn.
 *              Tách từ page-layouts/landing-layout/LandingLayout.tsx —
 *              trước đây header chiếm 6 CSS class + state riêng (hasScrolled)
 *              nằm lẫn trong layout, đủ phức tạp để xứng đáng là 1 component
 *              độc lập (ngang hàng Footer.tsx), không phải 1 phần của layout.
 *              CHỈ dùng cho Landing Page — không dùng ở Dashboard/trang chủ
 *              chính sau khi đăng nhập (theo xác nhận Project Owner).
 * @owner AG-04
 */

import React, { useState, useEffect } from 'react';
import './landing-header.css';

interface LandingHeaderProps {
    children?: React.ReactNode; // Nội dung header (Logo, Nav, CTA) — do pages/ truyền vào
}

/**
 * LandingHeader: Sticky header với dynamic shadow khi cuộn.
 * Component thuần túy — không tự quyết định nội dung bên trong (logo/nav/CTA
 * cụ thể là gì), chỉ cung cấp khung sticky + hiệu ứng shadow.
 */
export function LandingHeader({ children }: LandingHeaderProps): React.ReactElement {
    const [hasScrolled, setHasScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 5; // Ngưỡng nhỏ tránh flicker
            setHasScrolled(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`landing-header ${hasScrolled ? 'landing-header--scrolled' : ''}`}
        >
            <div className="landing-header__container">
                {children}
            </div>
        </header>
    );
}