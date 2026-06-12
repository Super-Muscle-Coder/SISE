/**
 * @file LandingPage.tsx
 * @layer pages (Layer 4)
 * @description Landing/Home page with navigation
 * 
 * Design Pattern: Uses Layer 1 CSS variables (globals.css) + Layer 2 components
 * - Minimal inline styles, mostly CSS variables
 * - Reuses NavButton component (Layer 2) with proper styling
 * - Hero section uses semantic brand colors
 * 
 * UPDATED:
 * - Header layout: Logo (lg) + Nav buttons (left), Sign In/Up (right)
 * - All colors use CSS variables (--color-brand-primary, etc.)
 * - All spacing uses CSS variables (--spacing-*)
 * - All transitions use CSS variables (--duration-*, --easing-*)
 * @owner AG-04
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LandingLayout } from '@/page-layouts';
import { Logo } from '@/components/common/Logo';
import { NavButton } from '@/components/nav/NavButton';


/**
 * Sub-page components: Render in main content area
 */

/**
 * @file IntroducePage - Section 1: Hero
 */

function IntroducePage({ onPageChange }: { onPageChange?: (page: 'terms' | 'login' | 'register') => void }): React.ReactElement {
    const [showPasswordTips, setShowPasswordTips] = React.useState(false);

    // ===== HELPER STYLE FUNCTIONS =====
    const getContainerStyle = () => ({
        maxWidth: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '3%',
        paddingRight: '3%',
        gap: '4%',
    });

    const getTextContainerStyle = () => ({
        flex: '0 0 45%',
    });

    const getImageContainerStyle = () => ({
        flex: '0 0 45%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    });

    const getImageStyle = (): React.CSSProperties => ({
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        objectPosition: 'center',
    });

    // ===== SECTION 1: HERO (NO ANIMATION) =====
    const HeroSection = () => (
        <section
            id="hero"
            className="introduce-section introduce-section--hero"
            style={{
                background: 'var(--color-bg-primary)',
                paddingBottom: 'var(--spacing-5xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
            }}
        >
            <div style={getContainerStyle()}>
                {/* TEXT - 45% */}
                <div style={getTextContainerStyle()}>
                    <h1
                        style={{
                            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                            fontWeight: 'var(--font-weight-extrabold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-lg)',
                            lineHeight: '1.1',
                        }}
                    >
                        Discover & Share Visual Stories
                    </h1>
                    <p
                        style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            color: 'var(--color-text-secondary)',
                            marginBottom: 'var(--spacing-2xl)',
                            lineHeight: '1.6',
                        }}
                    >
                        SISE is your platform for exploring curated image collections,
                        searching by content, and sharing your visual discoveries with the world.
                    </p>

                    {/* CTA BUTTONS */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 'var(--spacing-lg)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <button
                            onClick={() => window.location.href = '/register'}
                            style={{
                                padding: 'var(--spacing-base) var(--spacing-2xl)',
                                backgroundColor: 'var(--color-brand-primary)',
                                color: 'var(--color-text-inverted)',
                                fontWeight: 'var(--font-weight-semibold)',
                                fontSize: 'var(--font-size-base)',
                                borderRadius: 'var(--radius-full)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: `all var(--duration-normal) var(--easing-in-out)`,
                                boxShadow: '0 4px 12px rgba(0, 120, 215, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-brand-primary-hover)';
                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 120, 215, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 120, 215, 0.3)';
                            }}
                        >
                            Get Started
                        </button>

                        <button
                            onClick={() =>
                                document
                                    .getElementById('feature1')
                                    ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            style={{
                                padding: 'var(--spacing-base) var(--spacing-2xl)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-brand-primary)',
                                fontWeight: 'var(--font-weight-semibold)',
                                fontSize: 'var(--font-size-base)',
                                borderRadius: 'var(--radius-full)',
                                border: '2px solid var(--color-brand-primary)',
                                cursor: 'pointer',
                                transition: `all var(--duration-normal) var(--easing-in-out)`,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 120, 215, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            Learn More
                        </button>
                    </div>
                </div>

                {/* IMAGE - 45% */}
                <div style={getImageContainerStyle()}>
                    <img
                        src="/images/hero-section.png"
                        alt="Hero Section"
                        style={{ ...getImageStyle(), height: '500px' }}
                    />
                </div>
            </div>
        </section>
    );

    // ===== SECTION 2: FEATURE 1 (TEXT LEFT, IMAGE RIGHT) =====
    const Feature1Section = () => (
        <section
            id="feature1"
            className="introduce-section introduce-section--feature1"
            style={{
                background: 'linear-gradient(to bottom, #f2f2f2 0%, #ffffff 100%)',
                paddingTop: 'var(--spacing-5xl)',
                paddingBottom: 'var(--spacing-5xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
            }}
        >
            <div style={getContainerStyle()}>
                {/* TEXT - 45% */}
                <div style={getTextContainerStyle()}>
                    <h2
                        style={{
                            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        Search Images
                    </h2>
                    <p
                        style={{
                            fontSize: 'var(--font-size-base)',
                            color: 'var(--color-text-secondary)',
                            lineHeight: '1.8',
                        }}
                    >
                        Find images using intelligent text queries or image-based search. Powered by advanced AI technology to deliver precise results every time.
                    </p>
                </div>

                {/* IMAGE - 45% */}
                <div style={getImageContainerStyle()}>
                    <img
                        src="/images/feature-1.png"
                        alt="Search Images"
                        style={{ ...getImageStyle(), height: '400px' }}
                    />
                </div>
            </div>
        </section>
    );

    // ===== SECTION 3: FEATURE 2 (IMAGE LEFT, TEXT RIGHT) =====
    const Feature2Section = () => (
        <section
            id="feature2"
            className="introduce-section introduce-section--feature2"
            style={{
                background: 'linear-gradient(to bottom, #f2f2f2 0%, #ffffff 100%)',
                paddingTop: 'var(--spacing-5xl)',
                paddingBottom: 'var(--spacing-5xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
            }}
        >
            <div style={getContainerStyle()}>
                {/* IMAGE - 45% */}
                <div style={getImageContainerStyle()}>
                    <img
                        src="/images/feature-2.png"
                        alt="Curated Collections"
                        style={{ ...getImageStyle(), height: '400px' }}
                    />
                </div>

                {/* TEXT - 45% */}
                <div style={getTextContainerStyle()}>
                    <h2
                        style={{
                            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        Curated Collections
                    </h2>
                    <p
                        style={{
                            fontSize: 'var(--font-size-base)',
                            color: 'var(--color-text-secondary)',
                            lineHeight: '1.8',
                        }}
                    >
                        Explore carefully organized albums curated by our passionate community. Discover new visual content and get inspired by creative collections.
                    </p>
                </div>
            </div>
        </section>
    );

    // ===== SECTION 4: FEATURE 3 (TEXT LEFT, IMAGE RIGHT) =====
    const Feature3Section = () => (
        <section
            id="feature3"
            className="introduce-section introduce-section--feature3"
            style={{
                background: 'linear-gradient(to bottom, #f2f2f2 0%, #ffffff 100%)',
                paddingTop: 'var(--spacing-5xl)',
                paddingBottom: 'var(--spacing-5xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
            }}
        >
            <div style={getContainerStyle()}>
                {/* TEXT - 45% */}
                <div style={getTextContainerStyle()}>
                    <h2
                        style={{
                            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        Share & Collaborate
                    </h2>
                    <p
                        style={{
                            fontSize: 'var(--font-size-base)',
                            color: 'var(--color-text-secondary)',
                            lineHeight: '1.8',
                        }}
                    >
                        Create your own albums and share visual discoveries with others. Collaborate with the community and build meaningful connections around shared interests.
                    </p>
                </div>

                {/* IMAGE - 45% */}
                <div style={getImageContainerStyle()}>
                    <img
                        src="/images/feature-3.png"
                        alt="Share & Collaborate"
                        style={{ ...getImageStyle(), height: '400px' }}
                    />
                </div>
            </div>
        </section>
    );

    // ===== SECTION 5: CTA SECTION =====
    const CTASection = () => (
        <section
            id="cta"
            className="introduce-section introduce-section--cta"
            style={{
                position: 'relative',
                paddingTop: 'var(--spacing-5xl)',
                paddingBottom: 'var(--spacing-5xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                overflow: 'hidden',
            }}
        >
            {/* Background Image with Overlay */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'url(/images/CTA.png)',
                    backgroundSize: 'cover' as const,
                    backgroundPosition: 'center' as const,
                    zIndex: 1,
                    opacity: 1,
                }}
            />

            {/* Content Container */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    maxWidth: '100%',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '3%',
                    paddingRight: '3%',
                    gap: '4%',
                }}
            >
                {/* LEFT: Text Call-to-Action */}
                <div style={{ flex: '0 0 45%' }}>
                    <h2
                        style={{
                            fontSize: 'clamp(2.5rem, 5vw, 3rem)',
                            fontWeight: 'var(--font-weight-extrabold)',
                            color: 'var(--color-text-inverted)',
                            marginBottom: 'var(--spacing-lg)',
                            lineHeight: '1.1',
                        }}
                    >
                        Ready to get started?
                    </h2>
                    <p
                        style={{
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            color: 'var(--color-text-inverted)',
                            lineHeight: '1.6',
                        }}
                    >
                        Join thousands of creators discovering and sharing visual stories. Start exploring today.
                    </p>
                </div>

                {/* RIGHT: Sign Up Form */}
                <div
                    style={{
                        flex: '0 0 45%',
                        backgroundColor: 'var(--color-bg-primary)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-3xl)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--spacing-lg)',
                    }}
                >
                    {/* Form Header */}
                    <h3
                        style={{
                            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                            fontWeight: 'var(--font-weight-extrabold)',
                            color: 'var(--color-text-primary)',
                            textAlign: 'center',
                            margin: 0,
                        }}
                    >
                        Welcome to SISE
                    </h3>
                    <p
                        style={{
                            fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                            color: 'var(--color-text-secondary)',
                            textAlign: 'center',
                            margin: 0,
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        Find new ideas to try today
                    </p>

                    {/* Form Fields */}
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-base)' }}>
                        {/* Username */}
                        <div style={{ width: '100%' }}>
                            <label style={{
                                display: 'block',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--spacing-sm)',
                            }}>
                                Username
                            </label>
                            <input
                                type="text"
                                placeholder="User's Name"
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    padding: 'var(--spacing-md) var(--spacing-base)',
                                    fontSize: 'var(--font-size-base)',
                                    border: `1px solid var(--color-border-light)`,
                                    borderRadius: 'var(--radius-base)',
                                    fontFamily: 'var(--typography-family-base)',
                                    transition: `all var(--duration-normal)`,
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border-light)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div style={{ width: '100%' }}>
                            <label style={{
                                display: 'block',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--spacing-sm)',
                            }}>
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="Email"
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    padding: 'var(--spacing-md) var(--spacing-base)',
                                    fontSize: 'var(--font-size-base)',
                                    border: `1px solid var(--color-border-light)`,
                                    borderRadius: 'var(--radius-base)',
                                    fontFamily: 'var(--typography-family-base)',
                                    transition: `all var(--duration-normal)`,
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border-light)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        {/* Password with Tips */}
                        <div style={{ width: '100%' }}>
                            <label style={{
                                display: 'block',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--spacing-sm)',
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                placeholder="Password"
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    padding: 'var(--spacing-md) var(--spacing-base)',
                                    fontSize: 'var(--font-size-base)',
                                    border: `1px solid var(--color-border-light)`,
                                    borderRadius: 'var(--radius-base)',
                                    fontFamily: 'var(--typography-family-base)',
                                    transition: `all var(--duration-normal)`,
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border-light)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            <button
                                onClick={() => setShowPasswordTips(true)}
                                style={{
                                    marginTop: 'var(--spacing-sm)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-brand-primary)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    textDecoration: 'underline',
                                }}
                            >
                                Password tips
                            </button>
                        </div>

                        {/* Confirm Password */}
                        <div style={{ width: '100%' }}>
                            <label style={{
                                display: 'block',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--spacing-sm)',
                            }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    padding: 'var(--spacing-md) var(--spacing-base)',
                                    fontSize: 'var(--font-size-base)',
                                    border: `1px solid var(--color-border-light)`,
                                    borderRadius: 'var(--radius-base)',
                                    fontFamily: 'var(--typography-family-base)',
                                    transition: `all var(--duration-normal)`,
                                    boxSizing: 'border-box',
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border-light)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    <p
                        style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-secondary)',
                            textAlign: 'center',
                            margin: 'var(--spacing-base) 0',
                            lineHeight: '1.6',
                        }}
                    >
                        By continuing, you agree to SISE's{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onPageChange?.('terms');
                            }}
                            style={{
                                color: 'var(--color-brand-primary)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                        >
                            Terms of Service
                        </a>{' '}
                        and acknowledge you've read our{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                onPageChange?.('terms');
                            }}
                            style={{
                                color: 'var(--color-brand-primary)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                        >
                            Privacy Policy
                        </a>
                        .
                    </p>

                    {/* Continue Button */}
                    <button
                        style={{
                            width: '60%',
                            padding: 'var(--spacing-base) var(--spacing-2xl)',
                            backgroundColor: 'var(--color-brand-primary)',
                            color: 'var(--color-text-inverted)',
                            fontWeight: 'var(--font-weight-semibold)',
                            fontSize: 'var(--font-size-base)',
                            borderRadius: 'var(--radius-base)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: `all var(--duration-normal)`,
                            boxShadow: '0 4px 12px rgba(0, 120, 215, 0.3)',
                            textAlign: 'center',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-brand-primary-hover)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 120, 215, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 120, 215, 0.3)';
                        }}
                    >
                        Continue
                    </button>

                    {/* Or Divider */}
                    <div
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-base)',
                            margin: 'var(--spacing-base) 0',
                        }}
                    >
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-light)' }} />
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Or</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-light)' }} />
                    </div>

                    {/* Login Link */}
                    <p
                        style={{
                            fontSize: 'var(--font-size-base)',
                            color: 'var(--color-text-secondary)',
                            margin: 0,
                        }}
                    >
                        Already a member?{' '}
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                window.location.href = '/login';
                            }}
                            style={{
                                color: 'var(--color-brand-primary)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontWeight: 'var(--font-weight-semibold)',
                            }}
                        >
                            Log in
                        </a>
                    </p>

                    {/* App Download */}
                    <div
                        style={{
                            width: '100%',
                            marginTop: 'var(--spacing-lg)',
                            borderTop: `1px solid var(--color-border-light)`,
                            paddingTop: 'var(--spacing-lg)',
                            textAlign: 'center',
                        }}
                    >
                        <p
                            style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--spacing-md)',
                            }}
                        >
                            Get the SISE app
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--spacing-base)', justifyContent: 'center' }}>
                            <a
                                href="#"
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-base)',
                                    backgroundColor: 'var(--color-text-primary)',
                                    color: 'var(--color-text-inverted)',
                                    borderRadius: 'var(--radius-base)',
                                    textDecoration: 'none',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    cursor: 'pointer',
                                }}
                            >
                                iOS
                            </a>
                            <a
                                href="#"
                                style={{
                                    padding: 'var(--spacing-sm) var(--spacing-base)',
                                    backgroundColor: 'var(--color-text-primary)',
                                    color: 'var(--color-text-inverted)',
                                    borderRadius: 'var(--radius-base)',
                                    textDecoration: 'none',
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    cursor: 'pointer',
                                }}
                            >
                                Android
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Password Tips Modal */}
            {showPasswordTips && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowPasswordTips(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--spacing-2xl)',
                            maxWidth: '500px',
                            position: 'relative',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowPasswordTips(false)}
                            style={{
                                position: 'absolute',
                                top: 'var(--spacing-lg)',
                                right: 'var(--spacing-lg)',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                color: 'var(--color-text-secondary)',
                                padding: '4px',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            ✕
                        </button>

                        <h3
                            style={{
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 'var(--font-weight-bold)',
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--spacing-lg)',
                            }}
                        >
                            Password tips
                        </h3>

                        <p
                            style={{
                                fontSize: 'var(--font-size-base)',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--spacing-lg)',
                                lineHeight: '1.6',
                            }}
                        >
                            A strong password helps keep your account safe. Use at least 8 letters, numbers and symbols.
                        </p>

                        <h4
                            style={{
                                fontSize: 'var(--font-size-base)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--spacing-md)',
                            }}
                        >
                            What to avoid
                        </h4>

                        <ul
                            style={{
                                marginLeft: 'var(--spacing-lg)',
                                marginBottom: 'var(--spacing-2xl)',
                                paddingLeft: 0,
                            }}
                        >
                            <li style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                                • Common passwords, words and names
                            </li>
                            <li style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                                • Recent dates or dates associated with you
                            </li>
                            <li style={{ color: 'var(--color-text-secondary)' }}>
                                • Simple patterns and repeated text
                            </li>
                        </ul>

                        <button
                            onClick={() => setShowPasswordTips(false)}
                            style={{
                                width: 'auto',
                                padding: 'var(--spacing-md) var(--spacing-lg)',
                                backgroundColor: 'var(--color-brand-primary)',
                                color: 'var(--color-text-inverted)',
                                fontWeight: 'var(--font-weight-semibold)',
                                fontSize: 'var(--font-size-base)',
                                borderRadius: 'var(--radius-base)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: `all var(--duration-normal)`,
                                margin: '0 auto',
                                display: 'block',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-brand-primary-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)';
                            }}
                        >
                            Okay
                        </button>
                    </div>
                </div>
            )}
        </section>
    );

    // ===== RENDER ALL =====
    return (
        <>
            <HeroSection />
            <Feature1Section />
            <Feature2Section />
            <Feature3Section />
            <CTASection />
        </>
    );
}

export default IntroducePage;

/**
 * AboutPage: About SISE subpage (rendered inside LandingPage)
 */
function AboutPage({ onPageChange }: { onPageChange?: (page: 'introduce' | 'about' | 'explore' | 'terms' | 'login' | 'register') => void }): React.ReactElement {
    return (
        <div style={{ padding: 'var(--spacing-4xl) var(--spacing-xl)', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xl)', color: 'var(--color-brand-primary)' }}>
                About SISE
            </h1>
            <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                Coming soon: About page content
            </p>
        </div>
    );
}

/**
 * ExplorePage: Explore features subpage (rendered inside LandingPage)
 */
function ExplorePage({ onPageChange }: { onPageChange?: (page: 'introduce' | 'about' | 'explore' | 'terms' | 'login' | 'register') => void }): React.ReactElement {
    return (
        <div style={{ padding: 'var(--spacing-4xl) var(--spacing-xl)', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xl)', color: 'var(--color-brand-primary)' }}>
                Explore Features
            </h1>
            <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                Coming soon: Explore page content
            </p>
        </div>
    );
}

/**
 * TermsPage: Terms & Privacy subpage (rendered inside LandingPage)
 */
function TermsPage({ onPageChange }: { onPageChange?: (page: 'introduce' | 'about' | 'explore' | 'terms' | 'login' | 'register') => void }): React.ReactElement {
    return (
        <div style={{ padding: 'var(--spacing-4xl) var(--spacing-xl)', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xl)', color: 'var(--color-brand-primary)' }}>
                Terms of Service & Privacy Policy
            </h1>
            <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', lineHeight: '1.8' }}>
                Coming soon: Terms and Privacy Policy content
            </p>
        </div>
    );
}

/**
 * LandingPage: Main landing page
 * 
 * Header layout:
 * - Left: Logo (lg size) + Nav buttons
 * - Right: Sign In (blue) + Sign Up (light gray)
 * 
 * All styling follows Layer 0 (colors.ts) and Layer 1 (globals.css) standards
 */
export function LandingPage(): React.ReactElement {
    const [searchParams, setSearchParams] = useSearchParams();

    // Get page from URL query param, default to 'introduce'
    const pageParam = searchParams.get('page') as 'introduce' | 'about' | 'explore' | 'terms' | null;
    const [activePage, setActivePage] = useState<'introduce' | 'about' | 'explore' | 'terms'>(
        pageParam || 'introduce'
    );

    // Sync activePage with URL when it changes
    useEffect(() => {
        if (activePage === 'introduce') {
            setSearchParams({}); // Clear params for home
        } else {
            setSearchParams({ page: activePage });
        }
    }, [activePage, setSearchParams]);

    const renderCurrentPage = () => {
        const handlePageChange = (page: 'introduce' | 'about' | 'explore' | 'terms' | 'login' | 'register') => {
            if (page === 'login' || page === 'register') {
                // External navigation for auth pages
                window.location.href = `/${page}`;
            } else {
                // Internal navigation for subpages
                setActivePage(page as 'introduce' | 'about' | 'explore' | 'terms');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        switch (activePage) {
            case 'about':
                return <AboutPage onPageChange={handlePageChange} />;
            case 'explore':
                return <ExplorePage onPageChange={handlePageChange} />;
            case 'terms':
                return <TermsPage onPageChange={handlePageChange} />;
            case 'introduce':
            default:
                return <IntroducePage onPageChange={handlePageChange} />;
        }
    };

    return (
        <LandingLayout
            showHeader={true}
            onPageChange={setActivePage}
            headerContent={
                <div className="landing-layout__header-container">
                    {/* LEFT CONTAINER: Logo + Nav Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2xl)' }}>
                        {/* Logo - SIZE: lg (1.5x larger) */}
                        <div
                            style={{
                                cursor: 'pointer',
                                opacity: 1,
                                transition: `opacity var(--duration-normal) var(--easing-in-out)`,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        >
                            <Logo 
                                imageUrl="/images/logo.png"
                                alt="SISE Logo"
                                size="lg"
                                showText={false}
                            />
                        </div>

                        {/* Navigation Buttons Container - spacing using CSS variables */}
                        <nav style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
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
                    </div>

                    {/* RIGHT CONTAINER: Sign In + Sign Up */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
                        {/* Sign In Button - using CSS variables */}
                        <button
                            onClick={() => window.location.href = '/login'}
                            style={{
                                padding: `var(--spacing-md) var(--spacing-lg)`,
                                backgroundColor: 'var(--color-brand-primary)',
                                color: 'var(--color-text-inverted)',
                                fontWeight: 'var(--font-weight-semibold)',
                                borderRadius: 'var(--radius-base)',
                                border: 'none',
                                cursor: 'pointer',
                                transition: `all var(--duration-normal) var(--easing-in-out)`,
                                fontSize: 'var(--font-size-sm)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-brand-primary-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)';
                            }}
                        >
                            Sign In
                        </button>

                        {/* Sign Up Button - using CSS variables */}
                        <button
                            onClick={() => window.location.href = '/register'}
                            style={{
                                padding: `var(--spacing-md) var(--spacing-lg)`,
                                backgroundColor: 'var(--color-gray-light)',
                                color: 'var(--color-text-primary)',
                                fontWeight: 'var(--font-weight-semibold)',
                                borderRadius: 'var(--radius-base)',
                                border: `1px solid var(--color-border-light)`,
                                cursor: 'pointer',
                                transition: `all var(--duration-normal) var(--easing-in-out)`,
                                fontSize: 'var(--font-size-sm)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-border-light)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-gray-light)';
                            }}
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            }
        >
            {/* Main Content Area */}
            {renderCurrentPage()}
        </LandingLayout>
    );
}