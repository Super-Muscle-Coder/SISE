/**
 * @file Footer.tsx
 * @layer components (Layer 2)
 * @description Landing Footer with 4-column layout, social icons, and AOS animations
 * 
 * Structure:
 * - Column 1: Logo + Brand tagline
 * - Column 2: About SISE
 * - Column 3: Quick Links
 * - Column 4: Social Media Icons
 * - Bottom: Copyright line
 * 
 * Features:
 * - Fade-in-up animation on scroll (AOS-like effect)
 * - Social icon hover effects with colored shadows
 * - Dark background (#1a1a1a) with white text
 * 
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
        shadowColor: '#0078D7', // GitHub/SISE brand
        url: 'https://github.com/Super-Muscle-Coder/SISE',
    },
    {
        name: 'Website',
        icon: ExternalLink,
        shadowColor: '#FFD700', // Yellow/gold
        url: 'https://sise.com',
    },
    {
        name: 'Twitter/X',
        icon: Send,
        shadowColor: '#E1306C', // Pinkish-red
        url: 'https://twitter.com',
    },
    {
        name: 'Email',
        icon: Mail,
        shadowColor: '#DB4437', // Brand color
        url: 'mailto:contact@sise.com',
    },
];

export function Footer({ onPageChange }: { onPageChange?: (page: 'introduce' | 'about' | 'explore' | 'terms') => void }): React.ReactElement {
    const footerRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Intersection Observer for AOS-like fade-in effect
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.5 }
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

    const handleQuickLinkClick = (page: string) => {
        if (onPageChange) {
            onPageChange(page as 'introduce' | 'about' | 'explore' | 'terms');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Animation classes based on visibility
    const getAnimationStyle = (delay: number): React.CSSProperties => {
        return {
            visibility: isVisible ? 'visible' : 'hidden',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(250px)',
            transition: isVisible 
                ? `all 600ms ease-out ${delay}ms` 
                : 'none',
        };
    };

    return (
        <footer
            ref={footerRef}
            style={{
                backgroundColor: '#1a1a1a',
                color: '#ffffff',
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
                            fontSize: 'var(--font-size-base)',
                            color: '#ffffff',
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
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-lg)',
                            color: '#ffffff',
                        }}
                    >
                        About SISE
                    </h3>
                    <p
                        style={{
                            fontSize: 'var(--font-size-base)',
                            color: '#b3b3b3',
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
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-lg)',
                            color: '#ffffff',
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
                                    onClick={() => handleQuickLinkClick(link.value)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#b3b3b3',
                                        fontSize: 'var(--font-size-base)',
                                        cursor: 'pointer',
                                        transition: 'color var(--duration-normal)',
                                        padding: 0,
                                        textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = 'var(--color-brand-primary)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#b3b3b3';
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
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'var(--font-weight-semibold)',
                            marginBottom: 'var(--spacing-lg)',
                            color: '#ffffff',
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
                                        color: '#ffffff',
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
                    // ✅ Dùng transition thay animation
                    transition: isVisible 
                        ? `all 600ms ease-out 400ms` 
                        : 'none',
                }}
            >
                <p
                    style={{
                        fontSize: 'var(--font-size-sm)',
                        color: '#808080',
                        margin: 0,
                    }}
                >
                    © 2026 - SISE. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
