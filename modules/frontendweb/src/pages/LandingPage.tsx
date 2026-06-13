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
                            fontSize: 'clamp(3rem, 4.5vw, 3.8rem)',
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
                            fontSize: 'clamp(1.5rem, 2vw, 1.8rem)',
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
                            fontSize: 'clamp(3rem, 4.5vw, 3.8rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        Search Images
                    </h2>
                    <p
                        style={{
                            fontSize: 'var(--font-size-2xl)',
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
                            fontSize: 'clamp(3rem, 4.5vw, 3.8rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        Curated Collections
                    </h2>
                    <p
                        style={{
                            fontSize: 'var(--font-size-2xl)',
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
                            fontSize: 'clamp(3rem, 4.5vw, 3.8rem)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        Share & Collaborate
                    </h2>
                    <p
                        style={{
                            fontSize: 'var(--font-size-2xl)',
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

    /**
 * @file CTA Section in LandingPage.tsx
 * @description Carousel-style Sign Up / Log In form slider
 * 
 * Layout positions:
 * - 0%-25%: Text Sign Up (slides left when toggled)
 * - 25%-75%: Form container (Sign Up or Log In)
 * - 75%-100%: Text Log In (slides right when toggled)
 * 
 * @owner AG-04
 */

    function CTASection(): React.ReactElement {
        const [isLoginMode, setIsLoginMode] = React.useState(false);
        const [signUpData, setSignUpData] = React.useState({
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        });
        const [logInData, setLogInData] = React.useState({
            email: '',
            password: '',
        });

        // ===== TOGGLE BETWEEN SIGNUP AND LOGIN =====
        const toggleMode = () => {
            setIsLoginMode(!isLoginMode);
        };

        // ===== SIGNUP FORM HANDLERS =====
        const handleSignUpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setSignUpData({
                ...signUpData,
                [e.target.name]: e.target.value,
            });
        };

        const handleSignUpSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            console.log('Sign Up:', signUpData);
            // TODO: Call backend signup API
        };

        // ===== LOGIN FORM HANDLERS =====
        const handleLogInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setLogInData({
                ...logInData,
                [e.target.name]: e.target.value,
            });
        };

        const handleLogInSubmit = (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            console.log('Log In:', logInData);
            // TODO: Call backend login API
        };

        // ===== POSITIONING LOGIC =====
         // Text Sign Up: 25% when signup mode, -25% when login mode (off-left)
         const textSignUpLeft = isLoginMode ? '-25%' : '0%';

         // Form: 75% when signup, 25% when login (with bounce animation)
         const formLeft = isLoginMode ? '10%' : '60%';

         // Text Log In: 100% when signup (off-right), 60% when login mode
         const textLogInLeft = isLoginMode ? '60%' : '100%';

         // Determine animation based on mode switch
         const getFormAnimation = () => {
             if (isLoginMode) {
                 return 'bounceToLogin 1200ms ease-out forwards';
             } else {
                 return 'bounceToSignUp 1200ms ease-out forwards';
             }
         };

        return (
            <section
                id="cta"
                className="cta-section"
                style={{
                    position: 'relative',
                    width: '100%',
                    height: '100vh',
                    background: `url('/images/CTA.png') center/cover no-repeat`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}
            >
                {/* Container with relative positioning for absolute children */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        maxWidth: '1400px',
                        margin: '0 auto',
                        paddingLeft: 'var(--spacing-xl)',
                        paddingRight: 'var(--spacing-xl)',
                    }}
                >
                    {/* ===== TEXT SIGN UP (Left, 0%-25%) ===== */}
                    <div
                        style={{
                            position: 'absolute',
                            left: textSignUpLeft,
                            top: '45%',
                            transform: 'translateY(-50%)',
                            width: '50%', 
                            opacity: isLoginMode ? 0 : 1,
                            visibility: isLoginMode ? 'hidden' : 'visible',
                            transition: isLoginMode
                                ? 'all 1000ms ease-out'
                                : 'all 1200ms ease-out',
                            zIndex: isLoginMode ? 0 : 5,
                        }}
                    >
                        <h2
                            style={{
                                fontSize: 'clamp(3rem, 4.5vw, 3.8rem)',
                                fontWeight: 'var(--font-weight-extrabold)',
                                color: '#ffffff',
                                marginBottom: 'var(--spacing-lg)',
                                lineHeight: '1.3',
                            }}
                        >
                            Create Your Account
                        </h2>
                        <p
                            style={{
                                fontSize: 'clamp(1.8rem, 2.5vw, 2.3rem)',
                                color: '#ffffff',   
                                lineHeight: '1.3',
                                marginBottom: 'var(--spacing-xl)',
                            }}
                        >
                            Join thousands of users uploading, finding, and sharing amazing images.
                        </p>
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
                            {['Free account setup', 'Instant access to collections', 'Advanced search tools'].map(
                                (item, idx) => (
                                    <li
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            fontSize: 'var(--font-size-2xl)',
                                            color: '#ffffff',
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--color-brand-primary)',
                                                color: '#ffffff',
                                                fontWeight: 'bold',
                                                fontSize: 'var(--font-size-2xl)',
                                            }}
                                        >
                                            ✓
                                        </span>
                                        {item}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>

                    {/* ===== FORM CONTAINER (Center-Left/Center, 25%-75%) ===== */}
                    <div
                        style={{
                            position: 'absolute',
                            left: formLeft,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '35%',
                            minHeight: '600px', // Fixed height for consistent sizing
                            maxHeight: '730px',
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(100px)',
                            borderRadius: 'var(--radius-2xl)',
                            padding: 'var(--spacing-2xl)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                            zIndex: isLoginMode ? 10 : 10, // Always on top
                            animation: getFormAnimation(),
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                        }}
                    >
                        {/* ===== SIGN UP FORM ===== */}
                        {!isLoginMode && (
                            <form
                                onSubmit={handleSignUpSubmit}
                                style={{
                                    animation: isLoginMode ? 'fadeOut 1000ms ease-in forwards' : 'fadeIn 1200ms ease-in',
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: 'var(--font-size-2xl)',
                                        fontWeight: 'var(--font-weight-bold)',
                                        color: 'var(--color-text-primary)',
                                        marginBottom: 'var(--spacing-lg)',
                                    }}
                                >
                                    Sign Up
                                </h3>

                                {/* Username */}
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: 'var(--font-size-sm)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            color: 'var(--color-text-primary)',
                                            marginBottom: 'var(--spacing-md)',
                                        }}
                                    >
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={signUpData.username}
                                        onChange={handleSignUpChange}
                                        placeholder="Choose your username"
                                        style={{
                                            width: '100%',
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-size-base)',
                                            transition: 'all var(--duration-normal)',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Email */}
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: 'var(--font-size-sm)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            color: 'var(--color-text-primary)',
                                            marginBottom: 'var(--spacing-md)',
                                        }}
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={signUpData.email}
                                        onChange={handleSignUpChange}
                                        placeholder="your@email.com"
                                        style={{
                                            width: '100%',
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-size-base)',
                                            transition: 'all var(--duration-normal)',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Password */}
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: 'var(--font-size-sm)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            color: 'var(--color-text-primary)',
                                            marginBottom: 'var(--spacing-md)',
                                        }}
                                    >
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={signUpData.password}
                                        onChange={handleSignUpChange}
                                        placeholder="Enter password"
                                        style={{
                                            width: '100%',
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-size-base)',
                                            transition: 'all var(--duration-normal)',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Confirm Password */}
                                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: 'var(--font-size-sm)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            color: 'var(--color-text-primary)',
                                            marginBottom: 'var(--spacing-md)',
                                        }}
                                    >
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={signUpData.confirmPassword}
                                        onChange={handleSignUpChange}
                                        placeholder="Confirm password"
                                        style={{
                                            width: '100%',
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-size-base)',
                                            transition: 'all var(--duration-normal)',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Terms Checkbox */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 'var(--spacing-md)',
                                        marginBottom: 'var(--spacing-xl)',
                                        fontSize: 'var(--font-size-sm)',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        id="terms-signup"
                                        style={{
                                            marginTop: '4px',
                                            cursor: 'pointer',
                                        }}
                                    />
                                    <label htmlFor="terms-signup" style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                                        I agree to the{' '}
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onPageChange?.('terms');
                                            }}
                                            style={{
                                                color: 'var(--color-brand-primary)',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Terms of Service
                                        </a>{' '}
                                        and{' '}
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onPageChange?.('terms');
                                            }}
                                            style={{
                                                color: 'var(--color-brand-primary)',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Privacy Policy
                                        </a>
                                    </label>
                                </div>

                                {/* Sign Up Button */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            width: '70%',
                                            padding: 'var(--spacing-base) var(--spacing-lg)',
                                            backgroundColor: 'var(--color-brand-primary)',
                                            color: '#ffffff',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            fontSize: 'var(--font-size-base)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all var(--duration-normal)',
                                            boxShadow: '0 4px 12px rgba(0, 120, 215, 0.3)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#005a9a';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 120, 215, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 120, 215, 0.3)';
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                </div>

                                {/* Toggle to Log In */}
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                        Already have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={toggleMode}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-brand-primary)',
                                                fontWeight: 'var(--font-weight-semibold)',
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Log In
                                        </button>
                                    </p>
                                </div>
                            </form>
                        )}

                        {/* ===== LOG IN FORM ===== */}
                        {isLoginMode && (
                            <form
                                onSubmit={handleLogInSubmit}
                                style={{
                                    animation: isLoginMode ? 'fadeIn 1200ms ease-in' : 'fadeOut 1000ms ease-in',
                                }}
                            >
                                <h3
                                    style={{
                                        fontSize: 'var(--font-size-2xl)',
                                        fontWeight: 'var(--font-weight-bold)',
                                        color: 'var(--color-text-primary)',
                                        marginBottom: 'var(--spacing-lg)',
                                    }}
                                >
                                    Log In
                                </h3>

                                {/* Email */}
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: 'var(--font-size-sm)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            color: 'var(--color-text-primary)',
                                            marginBottom: 'var(--spacing-md)',
                                        }}
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={logInData.email}
                                        onChange={handleLogInChange}
                                        placeholder="your@email.com"
                                        style={{
                                            width: '100%',
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-size-base)',
                                            transition: 'all var(--duration-normal)',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Password */}
                                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: 'var(--font-size-sm)',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            color: 'var(--color-text-primary)',
                                            marginBottom: 'var(--spacing-md)',
                                        }}
                                    >
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={logInData.password}
                                        onChange={handleLogInChange}
                                        placeholder="Enter password"
                                        style={{
                                            width: '100%',
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--font-size-base)',
                                            transition: 'all var(--duration-normal)',
                                            boxSizing: 'border-box',
                                        }}
                                        onFocus={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--color-brand-primary)';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 120, 215, 0.1)';
                                        }}
                                        onBlur={(e) => {
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    />
                                </div>

                                {/* Remember Me */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: 'var(--spacing-xl)',
                                        fontSize: 'var(--font-size-sm)',
                                    }}
                                >
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <input type="checkbox" style={{ cursor: 'pointer' }} />
                                        <span style={{ color: 'var(--color-text-secondary)' }}>Remember me</span>
                                    </label>
                                    <a
                                        href="#"
                                        style={{
                                            color: 'var(--color-brand-primary)',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Forgot password?
                                    </a>
                                </div>

                                {/* Log In Button */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            width: '70%',
                                            padding: 'var(--spacing-base) var(--spacing-lg)',
                                            backgroundColor: 'var(--color-brand-primary)',
                                            color: '#ffffff',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            fontSize: 'var(--font-size-base)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all var(--duration-normal)',
                                            boxShadow: '0 4px 12px rgba(0, 120, 215, 0.3)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#005a9a';
                                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 120, 215, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 120, 215, 0.3)';
                                        }}
                                    >
                                        Log In
                                    </button>
                                </div>

                                {/* Toggle to Sign Up */}
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                        Don't have an account?{' '}
                                        <button
                                            type="button"
                                            onClick={toggleMode}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--color-brand-primary)',
                                                fontWeight: 'var(--font-weight-semibold)',
                                                cursor: 'pointer',
                                                textDecoration: 'underline',
                                            }}
                                        >
                                            Sign Up
                                        </button>
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* ===== TEXT LOG IN (Right, 75%-100%) ===== */}
                    <div
                        style={{
                            position: 'absolute',
                            left: textLogInLeft,
                            top: '45%',
                            transform: 'translateY(-50%)',
                            width: '50%', 
                            opacity: isLoginMode ? 1 : 0,
                            visibility: isLoginMode ? 'visible' : 'hidden',
                            transition: isLoginMode
                                ? 'all 1200ms ease-out'
                                : 'all 1000ms ease-out',
                            zIndex: isLoginMode ? 5 : 0,
                        }}
                    >
                        <h2
                            style={{
                                fontSize: 'clamp(3rem, 4.5vw, 3.8rem)',
                                fontWeight: 'var(--font-weight-extrabold)',
                                color: '#ffffff',
                                marginBottom: 'var(--spacing-lg)',
                                lineHeight: '1.3',
                            }}
                        >
                            Welcome Back
                        </h2>
                        <p
                            style={{
                                fontSize: 'clamp(1.8rem, 2.5vw, 2.3rem)',
                                color: '#ffffff',
                                lineHeight: '1.3',
                                marginBottom: 'var(--spacing-xl)',
                            }}
                        >
                            Access your albums, search history, and saved collections.
                        </p>
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
                            {['Quick access to your data', 'Personalized recommendations', 'Secure authentication'].map(
                                (item, idx) => (
                                    <li
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            fontSize: 'var(--font-size-2xl)',
                                            color: '#ffffff',
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--color-brand-primary)',
                                                color: '#ffffff',
                                                fontWeight: 'bold',
                                                fontSize: 'var(--font-size-base)',
                                            }}
                                        >
                                            ✓
                                        </span>
                                        {item}
                                    </li>
                                )
                            )}
                        </ul>
                    </div>
                </div> 

                {/* ===== TRANSITION ANIMATIONS ===== */}
                <style>
                    {`
                        @keyframes fadeIn {
                            from {
                                opacity: 0;
                            }
                            to {
                                opacity: 1;
                            }
                        }

                        @keyframes fadeOut {
                            from {
                                opacity: 1;
                            }
                            to {
                                opacity: 0;
                            }
                        }

                        @keyframes bounceToLogin {
                            0% {
                                left: 60%;
                            }
                            70% {
                                left: 5%;
                            }
                            100% {
                                left: 10%;
                            }
                        }

                        @keyframes bounceToSignUp {
                            0% {
                                left: 10%;
                            }
                            70% {
                                left: 65%;
                            }
                            100% {
                                left: 60%;
                            }
                        }
                    `}
                </style>
            </section>
        );
    }

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
    const sectionStyle: React.CSSProperties = {
        marginBottom: 'var(--spacing-4xl)',
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--color-brand-primary)',
        marginBottom: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-3xl)',
    };

    const bodyTextStyle: React.CSSProperties = {
        fontSize: 'var(--font-size-2xl)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.8',
        marginBottom: 'var(--spacing-lg)',
    };

    const listItemStyle: React.CSSProperties = {
        fontSize: 'var(--font-size-2xl)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.8',
        marginBottom: 'var(--spacing-md)',
        marginLeft: 'var(--spacing-lg)',
    };

    const valueItemStyle: React.CSSProperties = {
        marginBottom: 'var(--spacing-xl)',
    };

    const valueItemTitleStyle: React.CSSProperties = {
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-md)',
    };

    return (
        <div style={{ padding: 'var(--spacing-4xl) var(--spacing-5xl)' }}>
            {/* HEADER */}
            <div>
                <h1 style={{ fontSize: '3rem', fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-brand-primary)', marginBottom: 'var(--spacing-xl)' }}>
                    About SISE
                </h1>
                <p style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-2xl)' }}>
                    SISE — Smart Image Search Engine is a community-first platform that makes discovering, organizing, and sharing images fast, intelligent, and delightful.
                </p>
            </div>

            {/* OVERVIEW */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Overview</h2>
                <p style={bodyTextStyle}>
                    We combine AI-powered search with human curation so creators, researchers, and everyday users can find the right visual quickly and responsibly.
                </p>
            </section>

            {/* MISSION */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Mission</h2>
                <p style={bodyTextStyle}>
                    To empower visual discovery. We help people find meaningful images faster, preserve creative ownership, and build communities around visual ideas.
                </p>
            </section>

            {/* WHAT WE OFFER */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>What We Offer</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={listItemStyle}><strong>• Intelligent Search:</strong> Text and image-based search that surfaces relevant results quickly.</li>
                    <li style={listItemStyle}><strong>• Curated Collections:</strong> Community-created albums and editorial collections for inspiration.</li>
                    <li style={listItemStyle}><strong>• Seamless Uploading:</strong> Simple, fast upload flow with metadata and tagging support.</li>
                    <li style={listItemStyle}><strong>• Save & Organize:</strong> Personal boards and folders to bookmark and manage favorites.</li>
                    <li style={listItemStyle}><strong>• Share & Collaborate:</strong> Tools to publish collections, invite collaborators, and comment.</li>
                </ul>
            </section>

            {/* WHY SISE MATTERS */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Why SISE Matters</h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={listItemStyle}><strong>• Speed + Relevance:</strong> Our search prioritizes visual similarity and contextual relevance so users spend less time hunting and more time creating.</li>
                    <li style={listItemStyle}><strong>• Community Trust:</strong> Curated collections and user ratings help surface high-quality, trustworthy content.</li>
                    <li style={listItemStyle}><strong>• Respect for Creators:</strong> We design features that make it easy to credit authors and manage usage rights.</li>
                </ul>
            </section>

            {/* KEY VALUES */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Key Values</h2>
                <div style={valueItemStyle}>
                    <h3 style={valueItemTitleStyle}>Transparency</h3>
                    <p style={bodyTextStyle}>Clear policies about content ownership and platform use.</p>
                </div>
                <div style={valueItemStyle}>
                    <h3 style={valueItemTitleStyle}>Privacy</h3>
                    <p style={bodyTextStyle}>Minimal data collection and secure handling of user information.</p>
                </div>
                <div style={valueItemStyle}>
                    <h3 style={valueItemTitleStyle}>Accessibility</h3>
                    <p style={bodyTextStyle}>Interfaces and features designed for broad usability.</p>
                </div>
                <div style={valueItemStyle}>
                    <h3 style={valueItemTitleStyle}>Ethical AI</h3>
                    <p style={bodyTextStyle}>Responsible use of machine learning with human oversight.</p>
                </div>
            </section>

            {/* TEAM & CONTACT */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Team & Contact</h2>
                <p style={bodyTextStyle}>
                    A small, multidisciplinary team of engineers, designers, and community managers focused on visual search and UX.
                </p>
                <p style={bodyTextStyle}>
                    For press, partnerships, or support:{' '}
                    <a href="mailto:chuyenli2020@gmail.com" style={{ color: 'var(--color-brand-primary)', textDecoration: 'underline' }}>
                        chuyenli2020@gmail.com
                    </a>
                </p>
            </section>

            {/* CTA */}
            <section style={{ marginTop: 'var(--spacing-5xl)', paddingTop: 'var(--spacing-4xl)', borderTop: '1px solid var(--color-border-light)' }}>
                <h2 style={sectionTitleStyle}>Get Started</h2>
                <p style={bodyTextStyle}>
                    Ready to explore SISE? Sign up to create your first album and start discovering amazing image collections.
                </p>
                <button
                    onClick={() => onPageChange?.('login')}
                    style={{
                        padding: 'var(--spacing-base) var(--spacing-2xl)',
                        backgroundColor: 'var(--color-brand-primary)',
                        color: 'var(--color-text-inverted)',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-size-base)',
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all var(--duration-normal) var(--easing-in-out)',
                        boxShadow: '0 4px 12px rgba(0, 120, 215, 0.3)',
                        marginRight: 'var(--spacing-lg)',
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
                    Sign Up
                </button>
                <button
                    onClick={() => onPageChange?.('introduce')}
                    style={{
                        padding: 'var(--spacing-base) var(--spacing-2xl)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-brand-primary)',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-size-base)',
                        borderRadius: 'var(--radius-full)',
                        border: '2px solid var(--color-brand-primary)',
                        cursor: 'pointer',
                        transition: 'all var(--duration-normal) var(--easing-in-out)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)';
                        e.currentTarget.style.color = 'var(--color-text-inverted)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-brand-primary)';
                    }}
                >
                    Back to Home
                </button>
            </section>
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
    const sectionStyle: React.CSSProperties = {
        marginBottom: 'var(--spacing-4xl)',
    };

    const sectionTitleStyle: React.CSSProperties = {
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--color-brand-primary)',
        marginBottom: 'var(--spacing-lg)',
        marginTop: 'var(--spacing-3xl)',
    };

    const bodyTextStyle: React.CSSProperties = {
        fontSize: 'var(--font-size-2xl)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.8',
        marginBottom: 'var(--spacing-lg)',
    };

    const listItemStyle: React.CSSProperties = {
        fontSize: 'var(--font-size-2xl)',
        color: 'var(--color-text-secondary)',
        lineHeight: '1.8',
        marginBottom: 'var(--spacing-md)',
        marginLeft: 'var(--spacing-lg)',
    };

    return (
        <div style={{ padding: 'var(--spacing-4xl) var(--spacing-5xl)' }}>
            {/* HEADER */}
            <div>
                <h1 style={{ fontSize: '3rem', fontWeight: 'var(--font-weight-extrabold)', color: 'var(--color-brand-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Terms of Use & Privacy Policy
                </h1>
                <p style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-3xl)' }}>
                    Effective date: 2025
                </p>
            </div>

            {/* INTRODUCTION */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Introduction</h2>
                <p style={bodyTextStyle}>
                    These Terms of Use ("Terms") govern your access to and use of SISE. By using the service you agree to these Terms. If you do not agree, please do not use the platform.
                </p>
            </section>

            {/* ACCOUNT AND ELIGIBILITY */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Account and Eligibility</h2>
                <h3 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Registration
                </h3>
                <p style={bodyTextStyle}>
                    You must provide accurate information and maintain your account credentials.
                </p>
                <h3 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Eligibility
                </h3>
                <p style={bodyTextStyle}>
                    Users must be at least the minimum legal age in their jurisdiction. Minors must use the service under parental supervision.
                </p>
            </section>

            {/* USER CONTENT AND OWNERSHIP */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>User Content and Ownership</h2>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Ownership
                </h3>
                <p style={bodyTextStyle}>
                    Users retain ownership of images they upload.
                </p>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    License to SISE
                </h3>
                <p style={bodyTextStyle}>
                    By uploading, you grant SISE a non-exclusive, worldwide license to host, display, and distribute the content on the platform for the purpose of operating and promoting the service. This license is revocable by deleting the content, subject to cached copies and legal obligations.
                </p>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Prohibited Content
                </h3>
                <p style={bodyTextStyle}>
                    Do not upload content that infringes copyright, violates privacy, is illegal, or contains hate speech, explicit sexual content, or violent material.
                </p>
            </section>

            {/* RIGHTS AND RESPONSIBILITIES */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Rights and Responsibilities</h2>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    User Responsibilities
                </h3>
                <p style={bodyTextStyle}>
                    You are responsible for the content you upload and for complying with applicable laws.
                </p>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Platform Rights
                </h3>
                <p style={bodyTextStyle}>
                    SISE may remove or restrict access to content that violates these Terms or applicable law. SISE may also suspend or terminate accounts for repeated violations.
                </p>
            </section>

            {/* COPYRIGHT AND DMCA */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Copyright and DMCA Policy</h2>
                <p style={bodyTextStyle}>
                    If you believe your copyrighted work has been posted without permission, follow our takedown procedure and provide required information for a DMCA notice. Include a contact email for counter-notice.
                </p>
            </section>

            {/* PRIVACY AND DATA USE */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Privacy and Data Use</h2>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Data Handling
                </h3>
                <p style={bodyTextStyle}>
                    We collect and process personal data as described in our Privacy Policy. We use data to operate the service, improve features, and communicate with users.
                </p>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Third Parties
                </h3>
                <p style={bodyTextStyle}>
                    We do not sell personal data. We may share data with service providers under contract to operate the platform.
                </p>
            </section>

            {/* DISCLAIMERS AND LIABILITY */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Disclaimers and Limitation of Liability</h2>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    No Warranty
                </h3>
                <p style={bodyTextStyle}>
                    The service is provided "as is." SISE disclaims implied warranties to the fullest extent permitted by law.
                </p>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Limitation of Liability
                </h3>
                <p style={bodyTextStyle}>
                    To the extent permitted by law, SISE's liability is limited to direct damages up to a capped amount (e.g., fees paid in the prior 12 months), and SISE is not liable for indirect, incidental, or consequential damages.
                </p>
            </section>

            {/* TERMINATION AND SUSPENSION */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Termination and Suspension</h2>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Termination
                </h3>
                <p style={bodyTextStyle}>
                    Either party may terminate the relationship by closing the account or discontinuing the service.
                </p>
                <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                    Survival
                </h3>
                <p style={bodyTextStyle}>
                    Sections about ownership, disclaimers, limitation of liability, and dispute resolution survive termination.
                </p>
            </section>

            {/* GOVERNING LAW */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Governing Law and Dispute Resolution</h2>
                <p style={bodyTextStyle}>
                    These Terms are governed by the laws of the jurisdiction where SISE is registered. Any disputes shall be resolved through binding arbitration or court proceedings, subject to applicable local law.
                </p>
            </section>

            {/* CHANGES TO TERMS */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Changes to Terms</h2>
                <p style={bodyTextStyle}>
                    We may update these Terms. We will notify users of material changes and post the updated Terms with a new effective date.
                </p>
            </section>

            {/* CONTACT AND NOTICES */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>Contact and Notices</h2>
                <p style={bodyTextStyle}>
                    For legal notices and support:{' '}
                    <a href="mailto:chuyenlic4.2020@gmail.com" style={{ color: 'var(--color-brand-primary)', textDecoration: 'underline' }}>
                        chuyenlic4.2020@gmail.com
                    </a>
                </p>
            </section>

            {/* FAQ */}
            <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>FAQ</h2>
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                        Who owns my photos?
                    </h3>
                    <p style={bodyTextStyle}>
                        You do. SISE has a license to display and operate the service.
                    </p>
                </div>
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                        How do I report abuse?
                    </h3>
                    <p style={bodyTextStyle}>
                        Use the report button on any content or contact support.
                    </p>
                </div>
                <div>
                    <h3 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
                        How do I remove my content?
                    </h3>
                    <p style={bodyTextStyle}>
                        Delete it from your account; contact support if you need help.
                    </p>
                </div>
            </section>

            {/* CTA */}
            <section style={{ marginTop: 'var(--spacing-5xl)', paddingTop: 'var(--spacing-4xl)', borderTop: '1px solid var(--color-border-light)' }}>
                <p style={bodyTextStyle}>
                    Have questions about our terms? Contact us at{' '}
                    <a href="mailto:chuyenlic4.2020@gmail.com" style={{ color: 'var(--color-brand-primary)', textDecoration: 'underline' }}>
                        chuyenlic4.2020@gmail.com
                    </a>
                </p>
                <button
                    onClick={() => onPageChange?.('introduce')}
                    style={{
                        marginTop: 'var(--spacing-lg)',
                        padding: 'var(--spacing-base) var(--spacing-2xl)',
                        backgroundColor: 'var(--color-brand-primary)',
                        color: 'var(--color-text-inverted)',
                        fontWeight: 'var(--font-weight-semibold)',
                        fontSize: 'var(--font-size-base)',
                        borderRadius: 'var(--radius-full)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all var(--duration-normal) var(--easing-in-out)',
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
                    Back to Home
                </button>
            </section>
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
                                fontSize: 'var(--font-size-xl)',
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
                                fontSize: 'var(--font-size-xl)',
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