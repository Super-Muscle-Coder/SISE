/**
 * @file LandingLayout.tsx
 * @layer page-layouts (Layer 3)
 * @description Layout wrapper for landing/homepage
 * Provides sticky navigation header with dynamic shadow, content sections, and footer
 * @owner AG-04
 * 
 * Features:
 * - Sticky header with dynamic shadow on scroll
 * - Flexible main content area for routing sub-pages
 * - Persistent footer with 4-column layout
 * - Navigation state management
 */
import { Footer } from '@/components/footer/Footer'; 
import React, { useState, useEffect } from 'react';
import './landing-layout.css';

interface LandingLayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    headerContent?: React.ReactNode;
    onPageChange?: (page: 'introduce' | 'about' | 'explore' | 'terms') => void;
}

/**
 * LandingLayout: Full-width landing page structure
 * 
 * Architecture:
 * - Header (sticky, dynamic shadow)
 * - Main content area (frame/container for sub-pages)
 * - Footer (persistent with AOS animations)
 * 
 * Sub-pages render in main content area via routing
 */
export function LandingLayout({
    children,
    showHeader = true,
    headerContent,
    onPageChange,
}: LandingLayoutProps): React.ReactElement {
    const [hasScrolled, setHasScrolled] = useState(false);

    /**
     * Listen for scroll events to trigger dynamic shadow
     * Shadow appears when user scrolls down from top
     */
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 5; // Small threshold to avoid flickering
            setHasScrolled(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="landing-layout">
            {/* Header/Navigation - Sticky with Dynamic Shadow */}
            {showHeader && (
                <header
                    className={`landing-layout__header ${
                        hasScrolled ? 'landing-layout__header--scrolled' : ''
                    }`}
                >
                    <div className="landing-layout__header-container">
                        {headerContent}
                    </div>
                </header>
            )}

            {/* Main Content - Frame for Sub-pages */}
            <main className="landing-layout__main">
                {children}
            </main>

            {/* Footer - Persistent with 4-column layout and AOS animations */}
            <Footer onPageChange={onPageChange} />
        </div>
    );
}