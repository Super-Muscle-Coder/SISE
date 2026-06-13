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