/**
 * @file LandingFooter.tsx
 * @layer components (Layer 2)
 * @description Landing Footer với 4-column layout, social icons, và AOS
 *              animations.
 *              SỬA:
 *              1. var(--font-size-*) đã bị xóa (globals.css tái cấu trúc)
 *                 → đổi sang --text-heading-*--text-body-*.
 *              2. Bảng màu dark theme hardcode → nay dùng
 *                 var(--color-footer-*), khớp COLORS.footer mới thêm vào
 *                 design-system/colors.ts.
 *              3. Màu social icon (GitHub/Twitter/Gmail...) GIỮ NGUYÊN
 *                 hardcode có chủ đích — màu nhận diện thương hiệu bên thứ
 *                 3, không thuộc hệ thống màu SISE.
 *              4. [AP-7 FIX] Trước đây nhận prop `onPageChange` và TỰ GỌI
 *                 window.scrollTo(...) — đây là logic điều hướng lọt vào
 *                 Nhóm B (Layer Leakage, xem Workflow_Centric_Architecture.md
 *                 §2.4.3 AP-7). Footer (giao diện thuần túy) không được
 *                 biết "trang nào", "URL nào", hay "có cần scroll không".
 *                 Nay Footer CHỈ phát ra sự kiện thuần `onLinkClick(page)`
 *                 khi người dùng bấm — quyết định điều hướng/scroll thật
 *                 thuộc về pages/LandingPage.tsx (Nhóm C).
 * @owner AG-04
 */

import React, { useState, useEffect, useRef } from 'react';
import { Globe, Mail, Send, ExternalLink } from 'lucide-react';

interface SocialIcon {
    name: string;
    icon: React.ComponentType<{ size: number; strokeWidth: number }>;
    shadowColor: string;
    url: string;
}

const SOCIAL_ICONS: SocialIcon[] = [
    {
        name: 'GitHub',
        icon: Globe,
        shadowColor: '#0078D7',
        url: 'https://github.com/Super-Muscle-Coder/SISE',
    },
    {
        name: 'Website',
        icon: ExternalLink,
        shadowColor: '#FFD700',
        url: 'https://sise.com',
    },
    {
        name: 'Twitter/X',
        icon: Send,
        shadowColor: '#E1306C',
        url: 'https://twitter.com',
    },
    {
        name: 'Email',
        icon: Mail,
        shadowColor: '#DB4437',
        url: 'mailto:contact@sise.com',
    },
];

export type LandingFooterQuickLinkPage = 'introduce' | 'about' | 'explore' | 'terms';

interface LandingFooterProps {
    /**
     * Gọi khi người dùng bấm 1 Quick Link. Footer KHÔNG tự quyết định điều
     * hướng hay scroll — chỉ báo "người dùng muốn tới đâu", pages/ quyết
     * định phần còn lại.
     */
    onLinkClick?: (page: LandingFooterQuickLinkPage) => void;
}

export function LandingFooter({ onLinkClick }: LandingFooterProps): React.ReactElement {
    const footerRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.45 }
        );

        if (footerRef.current) {
            observer.observe(footerRef.current);
        }

        return () => {
            if (footerRef.current) {
                observer.unobserve(footerRef.current);
            }
        };
    }, []);

    const getAnimationStyle = (delay: number): React.CSSProperties => {
        return {
            visibility: isVisible ? 'visible' : 'hidden',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(180px)',
            transition: isVisible
                ? `all 600ms ease-out ${delay}ms`
                : 'none',
        };
    };

    return (
        <footer
            ref={footerRef}
            style={{
                backgroundColor: 'var(--color-footer-background)',
                color: 'var(--color-footer-text)',
                paddingTop: 'var(--spacing-5xl)',
                paddingBottom: 'var(--spacing-3xl)',
            }}
        >
            {/* Main Content Container */}
            <div
                style={{
                    maxWidth: '1360px',
                    margin: '0 auto',
                    paddingLeft: 'var(--spacing-base)',
                    paddingRight: 'var(--spacing-base)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 'var(--spacing-5xl)',
                    marginBottom: 'var(--spacing-5xl)',
                }}
            >
                {/* COLUMN 1: Logo + Brand Tagline */}
                <div style={getAnimationStyle(150)}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <img
                            src="/images/logo.png"
                            alt="SISE Logo"
                            style={{
                                height: '48px',
                                width: 'auto',
                                filter: 'brightness(0) invert(1)',
                            }}
                        />
                    </div>
                    <p
                        style={{
                            fontSize: 'var(--text-body-base-size)',
                            color: 'var(--color-footer-text)',
                            lineHeight: '1.6',
                            fontWeight: 'var(--font-weight-normal)',
                        }}
                    >
                        SISE – Upload, Search, Share, Save.
                    </p>
                </div>

                {/* COLUMN 2: About SISE */}
                <div style={getAnimationStyle(250)}>
                    <h3
                        style={{
                            fontSize: 'var(--text-heading-h4-size)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-lg)',
                            color: 'var(--color-footer-text)',
                        }}
                    >
                        About SISE
                    </h3>
                    <p
                        style={{
                            fontSize: 'var(--text-body-base-size)',
                            color: 'var(--color-footer-text-muted)',
                            lineHeight: '1.8',
                        }}
                    >
                        Where your photos live
                        Upload, search, share, and save.
                    </p>
                </div>

                {/* COLUMN 3: Quick Links */}
                <div style={getAnimationStyle(350)}>
                    <h3
                        style={{
                            fontSize: 'var(--text-heading-h4-size)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-lg)',
                            color: 'var(--color-footer-text)',
                        }}
                    >
                        Quick Links
                    </h3>
                    <ul
                        style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--spacing-md)',
                        }}
                    >
                        {[
                            { label: 'Introduce', value: 'introduce' },
                            { label: 'About', value: 'about' },
                            { label: 'Explore', value: 'explore' },
                            { label: 'Terms', value: 'terms' },
                        ].map((link) => (
                            <li key={link.value}>
                                <button
                                    onClick={() => onLinkClick?.(link.value as LandingFooterQuickLinkPage)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--color-footer-text-muted)',
                                        fontSize: 'var(--text-body-base-size)',
                                        cursor: 'pointer',
                                        transition: 'color var(--duration-normal)',
                                        padding: 0,
                                        textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = 'var(--color-brand-primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--color-footer-text-muted)';
                                    }}
                                >
                                    {link.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* COLUMN 4: Follow Us (Social Media) */}
                <div style={getAnimationStyle(450)}>
                    <h3
                        style={{
                            fontSize: 'var(--text-heading-h4-size)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-lg)',
                            color: 'var(--color-footer-text)',
                        }}
                    >
                        Follow Us
                    </h3>
                    <div
                        style={{
                            display: 'flex',
                            gap: 'var(--spacing-lg)',
                            flexWrap: 'wrap',
                        }}
                    >
                        {SOCIAL_ICONS.map((social) => {
                            const IconComponent = social.icon;
                            return (
                                <a
                                    key={social.name}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        color: 'var(--color-footer-text)',
                                        transition: 'all var(--duration-normal)',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        boxShadow: '0 0 0 2px rgba(255, 255, 255, 0)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = `0 0 16px 2px ${social.shadowColor}`;
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0)';
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    title={social.name}
                                >
                                    <IconComponent size={24} strokeWidth={1.5} />
                                </a>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Copyright Line */}
            <div
                style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: 'var(--spacing-3xl)',
                    textAlign: 'center',
                    visibility: isVisible ? 'visible' : 'hidden',
                    opacity: isVisible ? 1 : 0,
                    transition: isVisible
                        ? `all 600ms ease-out 400ms`
                        : 'none',
                }}
            >
                <p
                    style={{
                        fontSize: 'var(--text-body-sm-size)',
                        color: 'var(--color-footer-text-faint)',
                        margin: 0,
                    }}
                >
                    © 2026 - SISE. All rights reserved.
                </p>
            </div>
        </footer>
    );
}