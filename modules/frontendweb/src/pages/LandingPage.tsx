/**
 * @file LandingPage.tsx
 * @layer pages (Nhóm C — nơi DUY NHẤT nối logic A với giao diện B)
 * @description Trang chủ SISE (chưa đăng nhập). Scope tối giản: 1 Hero
 *              Section + CTA đăng nhập/đăng ký.
 *              SỬA: /login và /register không còn là trang riêng — cả 2
 *              route đều trỏ CHÍNH LandingPage.tsx này. LandingPage tự đọc
 *              URL hiện tại (useLocation) để quyết định AuthModal có hiện
 *              hay không và ở mode nào — giữ được lợi ích "URL chia sẻ
 *              được/refresh không mất trạng thái" trong khi UX vẫn là
 *              modal nổi nhanh gọn, không cần trang riêng đầy đủ layout.
 * @owner AG-04
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LandingLayout } from '@/page-layouts/landing-layout';
import { Logo, LinkButton } from '@/components/common';
import { AuthModal, type AuthModalMode } from '@/components/auth/AuthModal';

export function LandingPage(): React.ReactElement {
    const navigate = useNavigate();
    const location = useLocation();

    // Nguồn sự thật cho việc modal có hiện hay không: chính URL hiện tại.
    // "/login" → mode 'login', "/register" → mode 'register', còn lại → null (đóng).
    const modalMode: AuthModalMode | null =
        location.pathname === '/login'
            ? 'login'
            : location.pathname === '/register'
                ? 'register'
                : null;

    const openLogin = () => navigate('/login');
    const openRegister = () => navigate('/register');
    const closeModal = () => navigate('/');
    const switchMode = (mode: AuthModalMode) => navigate(mode === 'login' ? '/login' : '/register');

    return (
        <LandingLayout
            headerContent={
                <>
                    <div className="landing-header__logo">
                        <Logo size="md" imageUrl="/images/logo.png" />
                    </div>
                    <div className="landing-header__nav" />
                    <div className="landing-header__cta">
                        <LinkButton variant="outline" onClick={openLogin}>
                            Log In
                        </LinkButton>
                        <LinkButton variant="solid" onClick={openRegister}>
                            Sign Up
                        </LinkButton>
                    </div>
                </>
            }
            // Quick Links trong Footer trỏ tới sub-page đã bỏ khỏi scope —
            // KHÔNG truyền onLinkClick, các nút Footer hiển thị nhưng
            // không phản hồi khi bấm (giữ nguyên component, dễ nối lại sau).
        >
            <section
                style={{
                    minHeight: '70vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 'var(--spacing-5xl) var(--spacing-2xl)',
                    background: `linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)`,
                }}
            >
                <div style={{ textAlign: 'center', maxWidth: '700px' }}>
                    <h1
                        style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: 'var(--text-heading-h1-weight)',
                            lineHeight: 'var(--text-heading-h1-line)',
                            letterSpacing: 'var(--text-heading-h1-tracking)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        Tìm lại mọi khoảnh khắc,{' '}
                        <span style={{ color: 'var(--color-brand-primary)' }}>
                            chỉ bằng một câu mô tả
                        </span>
                    </h1>

                    <p
                        style={{
                            fontSize: 'var(--text-body-lg-size)',
                            lineHeight: 'var(--text-body-lg-line)',
                            color: 'var(--color-text-secondary)',
                            marginBottom: 'var(--spacing-2xl)',
                        }}
                    >
                        SISE dùng AI để hiểu nội dung ảnh của bạn — tìm kiếm
                        bằng văn bản hoặc bằng chính một tấm ảnh khác,
                        không cần gắn thẻ thủ công.
                    </p>

                    <div
                        style={{
                            display: 'flex',
                            gap: 'var(--spacing-lg)',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        <LinkButton variant="solid" onClick={openRegister}>
                            Bắt đầu miễn phí
                        </LinkButton>
                        <LinkButton variant="outline" onClick={openLogin}>
                            Tôi đã có tài khoản
                        </LinkButton>
                    </div>
                </div>
            </section>

            {modalMode && (
                <AuthModal mode={modalMode} onClose={closeModal} onSwitchMode={switchMode} />
            )}
        </LandingLayout>
    );
}