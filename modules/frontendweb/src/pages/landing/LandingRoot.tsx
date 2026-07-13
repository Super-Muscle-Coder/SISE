/**
 * @file LandingRoot.tsx
 * @layer pages (Layer C — giao điểm duy nhất giữa Nhóm A và Nhóm B)
 * @description Orchestrator MỎNG cho toàn bộ Landing area. KHÔNG chứa nội
 *              dung — chỉ làm 3 việc:
 *              1. Bọc LandingLayout (Nhóm B).
 *              2. Định nghĩa route con (/,/about,/explore,/terms) quyết
 *                 định sub-page nào render vào khung LandingLayout.
 *              3. Implement logic THẬT cho onLinkClick — nơi DUY NHẤT
 *                 trong toàn bộ Landing area được phép gọi navigate() và
 *                 window.scrollTo() (đúng theo AP-7 fix đã áp dụng ở
 *                 LandingHeader/LandingFooter — 2 component đó chỉ phát
 *                 sự kiện thuần, không tự điều hướng).
 *
 *              LỊCH SỬ: Trước đây toàn bộ Introduce/About/Explore/Terms
 *              nhồi chung vào 1 file LandingPage.tsx (~3330 dòng, ~170k
 *              ký tự) — vi phạm nghiêm trọng nguyên tắc "1 workflow/sub-page
 *              = 1 file". Đã tách thành 4 file độc lập
 *              (IntroducePage/AboutPage/ExplorePage/TermsPage), LandingRoot
 *              chỉ còn vai trò điều phối.
 * @owner AG-04
 */

import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { LandingLayout } from '@/page-layouts/landing-layout';
import type { LandingFooterQuickLinkPage } from '@/components/footer';
import { IntroducePage } from './IntroducePage';
import { AboutPage } from './AboutPage';
import { ExplorePage } from './ExplorePage';
import { TermsPage } from './TermsPage';

/**
 * Map tên page logic (dùng bởi LandingHeader/LandingFooter) sang URL path
 * thật. Nguồn sự thật DUY NHẤT cho việc "page nào ứng với URL nào" — nếu
 * cần đổi URL, chỉ sửa ở đây.
 */
const PAGE_PATH_MAP: Record<LandingFooterQuickLinkPage, string> = {
    introduce: '/',
    about: '/about',
    explore: '/explore',
    terms: '/terms',
};

export function LandingRoot(): React.ReactElement {
    const navigate = useNavigate();

    /**
     * Logic điều hướng THẬT — nơi duy nhất trong Landing area xử lý việc
     * này. LandingHeader/LandingFooter chỉ gọi lên đây qua onLinkClick,
     * không tự biết URL hay tự gọi scrollTo.
     */
    const handleLinkClick = (page: LandingFooterQuickLinkPage): void => {
        navigate(PAGE_PATH_MAP[page]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <LandingLayout onLinkClick={handleLinkClick}>
            <Routes>
                <Route path="/" element={<IntroducePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/terms" element={<TermsPage />} />
            </Routes>
        </LandingLayout>
    );
}