/**
 * @file LandingPage.tsx
 * @layer pages (Layer 4)
 * @description Landing/Home page with navigation
 * Displays content sections: Introduce, About, Explore, Terms of Service
 * @owner AG-04
 * 
 * Features:
 * - Sticky header with dynamic shadow (no shadow at top)
 * - All header elements on single row (logo, nav, CTA)
 * - Navigation buttons with active state (gray/red styling)
 * - Sub-page routing and content rendering
 * - Smooth scroll interactions
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingLayout } from '@/page-layouts';
import { Logo } from '@/components/common/Logo';
import { NavButton } from '@/components/nav/NavButton';

/**
 * Sub-page components: Render in main content area
 */

function IntroducePage(): React.ReactElement {
    return (
        <>
            {/* Hero Section */}
            <section className="landing-layout__hero">
                <div className="landing-layout__hero-content">
                    <h1 className="landing-layout__hero-title">
                        Discover & Share Visual Stories
                    </h1>
                    <p className="landing-layout__hero-subtitle">
                        SISE is your platform for exploring curated image collections,
                        searching by content, and sharing your visual discoveries with the world.
                    </p>
                    <div className="landing-layout__hero-actions">
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="px-8 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 active:scale-95 transition-smooth shadow-md"
                        >
                            Get Started
                        </button>
                        <button
                            onClick={() =>
                                document
                                    .getElementById('explore-section')
                                    ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            className="px-8 py-3 border-2 border-red-600 text-red-600 font-semibold rounded-full hover:bg-red-50 transition-smooth"
                        >
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="landing-layout__section" id="explore-section">
                <div className="max-w-1360px mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-zinc-900">
                        Why Choose SISE?
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-6 bg-zinc-50 rounded-lg hover:shadow-md transition-smooth">
                            <div className="text-3xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">
                                Smart Search
                            </h3>
                            <p className="text-zinc-600 text-sm">
                                Find images using text queries or image-based search. Powered by
                                advanced AI technology.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-6 bg-zinc-50 rounded-lg hover:shadow-md transition-smooth">
                            <div className="text-3xl mb-4">📚</div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">
                                Curated Collections
                            </h3>
                            <p className="text-zinc-600 text-sm">
                                Browse carefully organized albums and discover new visual content
                                curated by our community.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-6 bg-zinc-50 rounded-lg hover:shadow-md transition-smooth">
                            <div className="text-3xl mb-4">🌐</div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">
                                Share & Collaborate
                            </h3>
                            <p className="text-zinc-600 text-sm">
                                Create albums, share your visual discoveries, and collaborate with
                                other creators.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="landing-layout__section">
                <div className="max-w-800px mx-auto text-center bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-12">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-4">
                        Ready to explore?
                    </h2>
                    <p className="text-zinc-600 mb-8">
                        Join thousands of visual enthusiasts. Sign up today and start your journey.
                    </p>
                    <button className="px-8 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 active:scale-95 transition-smooth shadow-md">
                        Create Account
                    </button>
                </div>
            </section>
        </>
    );
}

function AboutPage(): React.ReactElement {
    return (
        <section className="landing-layout__section">
            <div className="max-w-900px mx-auto">
                <h1 className="text-3xl font-bold text-zinc-900 mb-6">About SISE</h1>
                <p className="text-zinc-600 text-lg leading-8 mb-4">
                    SISE is a modern image discovery and sharing platform built for visual
                    enthusiasts. Our mission is to make visual content more discoverable and
                    shareable.
                </p>
                <p className="text-zinc-600 text-lg leading-8">
                    [More detailed about content will be added here]
                </p>
            </div>
        </section>
    );
}

function ExplorePage(): React.ReactElement {
    return (
        <section className="landing-layout__section">
            <div className="max-w-1360px mx-auto">
                <h1 className="text-3xl font-bold text-zinc-900 mb-6">Explore Collections</h1>
                <p className="text-zinc-600 text-lg mb-8">
                    Discover curated image collections from our community.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Placeholder collection cards */}
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className="bg-zinc-100 rounded-lg h-48 flex items-center justify-center hover:shadow-md transition-smooth"
                        >
                            <span className="text-zinc-500">Collection {i}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TermsPage(): React.ReactElement {
    return (
        <section className="landing-layout__section">
            <div className="max-w-900px mx-auto">
                <h1 className="text-3xl font-bold text-zinc-900 mb-6">Terms of Service</h1>
                <div className="text-zinc-600 space-y-4">
                    <p>
                        By using SISE, you agree to these terms and conditions.
                    </p>
                    <p>
                        [Detailed terms and conditions will be added here]
                    </p>
                </div>
            </div>
        </section>
    );
}

/**
 * LandingPage: Main landing page component
 * 
 * Layout:
 * - Header (sticky, dynamic shadow)
 *   - Logo (left)
 *   - Navigation buttons (center)
 *   - CTA buttons (right)
 * - Main content (dynamic sub-page rendering)
 * - Footer (persistent)
 */
export function LandingPage(): React.ReactElement {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState<'introduce' | 'about' | 'explore' | 'terms'>(
        'introduce'
    );

    /**
     * Render current page based on activeTab
     */
    const renderCurrentPage = () => {
        switch (activePage) {
            case 'about':
                return <AboutPage />;
            case 'explore':
                return <ExplorePage />;
            case 'terms':
                return <TermsPage />;
            case 'introduce':
            default:
                return <IntroducePage />;
        }
    };

    return (
        <LandingLayout
            showHeader={true}
            headerContent={
                <div className="landing-layout__header-container">
                    {/* Logo - Left */}
                    <div className="landing-layout__header-logo">
                        <div
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            {/* Using text-based logo by default */}
                                <Logo 
                                    imageUrl="/images/logo.png"
                                    alt="SISE Logo"
                                    size="md"
                                    showText={false}  // Hiển thị text "SISE" bên cạnh ảnh, chuyển sang false nếu chỉ muốn hiển thị ảnh
                                />
                            {/* 
                                To use image logo instead:
                                <Logo 
                                    imageUrl="/images/logo.png"
                                    alt="SISE Logo"
                                    size="md"
                                    showText={true}
                                />
                            */}
                        </div>
                    </div>

                    {/* Navigation Links - Center */}
                    <nav className="landing-layout__header-nav hidden md:flex">
                        <NavButton
                            label="Introduce"
                            isActive={activePage === 'introduce'}
                            onClick={() => setActivePage('introduce')}
                            size="md"
                        />
                        <NavButton
                            label="About"
                            isActive={activePage === 'about'}
                            onClick={() => setActivePage('about')}
                            size="md"
                        />
                        <NavButton
                            label="Explore"
                            isActive={activePage === 'explore'}
                            onClick={() => setActivePage('explore')}
                            size="md"
                        />
                        <NavButton
                            label="Terms"
                            isActive={activePage === 'terms'}
                            onClick={() => setActivePage('terms')}
                            size="md"
                        />
                    </nav>

                    {/* CTA Buttons - Right */}
                    <div className="landing-layout__header-cta">
                        {/* Sign In (Red background, white text) */}
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all duration-200"
                        >
                            Sign In
                        </button>
                        {/* Sign Up (Gray background, black text) */}
                        <button
                            onClick={() => navigate('/register')}
                            className="px-6 py-2 bg-gray-500 text-black font-semibold rounded-lg hover:bg-gray-600 active:scale-95 transition-all duration-200"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            }
        >
            {/* Main Content Area - Renders sub-pages */}
            {renderCurrentPage()}
        </LandingLayout>
    );
}