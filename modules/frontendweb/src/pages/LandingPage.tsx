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
                                <div style={{ display: 'flex', textAlign: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            width: '70%',
                                            padding: 'var(--spacing-base) var(--spacing-lg)',
                                            backgroundColor: 'var(--color-brand-primary)',
                                            color: '#ffffff',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            fontSize: 'var(--font-size-base)',
                                            borderRadius: 'var(--radius-2xl)',
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
                                <div style={{ display: 'flex', textAlign: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                    <button
                                        type="submit"
                                        style={{
                                            width: '70%',
                                            padding: 'var(--spacing-base) var(--spacing-lg)',
                                            backgroundColor: 'var(--color-brand-primary)',
                                            color: '#ffffff',
                                            fontWeight: 'var(--font-weight-semibold)',
                                            fontSize: 'var(--font-size-base)',
                                            borderRadius: 'var(--radius-2xl)',
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
 * ExplorePage v7 — PREV redesign
 *
 * ROOT CAUSE của PREV bug:
 * Cách cũ (prepend): item mới vào idx=0 (nth-child 1).
 * CSS idle: nth-child(1) = width:100%, height:100% (fullscreen).
 * → Item mới mount thẳng vào fullscreen, không có vị trí track để transition từ đó.
 * → CSS transition chạy từ fullscreen về fullscreen = không nhìn thấy gì.
 * → Item cũ vẫn ở nth-child(2), content vẫn display:block → ta thấy nội dung cũ.
 *
 * FIX (v7): Thay đổi cấu trúc mảng cho PREV:
 * - NEXT: [cũ, mới, track3, track4, ...tail]  (giống cũ)
 *         cũ=idx0=nth-child(1): fullscreen, đứng yên
 *         mới=idx1=nth-child(2): phóng to từ track lên
 *
 * - PREV: [cũ, mới, tail..., trackLast]
 *         cũ=idx0=nth-child(1): fullscreen, đứng yên (giống NEXT)
 *         mới=idx1=nth-child(2): PHÓNG TO từ track (nth-child 3 → nth-child 2)
 *
 * Để làm được này với PREV, thứ tự rotate phải là:
 *   [items[0], prevItem, items[1], items[2], ..., items[n-2]]
 *   tức là: giữ items[0] (cũ) ở đầu, chèn prevItem (items[n-1]) vào idx=1,
 *   và đẩy items[n-1] ra khỏi cuối.
 *
 * Như vậy cả NEXT và PREV đều có cùng cấu trúc:
 *   idx=0: fullscreen cũ (đứng yên)
 *   idx=1: fullscreen mới (đang animate vào)
 *   idx=2..5: track cards
 *   idx=6+: ẩn
 *
 * ContentBlock luôn ở idx=1 → nth-child(2) → luôn đúng.
 * getItemZIndex vẫn giữ nguyên logic.
 */

interface ExploreItem {
    id: number;
    image: string;
    title: string;
    name: string;
    description: string;
}

const EXPLORE_ITEMS: ExploreItem[] = [
    {
        id: 1,
        image: '/images/demo-abstract.png',
        title: 'ARTSTYLE',
        name: 'Cyberpunk & Synthwave',
        description: 'A style inspired by technology and futuristic cities, featuring vibrant neon colors and strong lighting.',
    },
    {
        id: 2,
        image: '/images/demo-darkaca.png',
        title: 'ARTSTYLE',
        name: 'Dark Academia & Gothic Art',
        description: 'Dark, mysterious tones with a classic touch, evoking philosophical, intellectual, and melancholic emotions.',
    },
    {
        id: 3,
        image: '/images/demo-anime.jpg',
        title: 'ARTSTYLE',
        name: 'Anime & Manga',
        description: 'Continues to hold strong appeal with diverse styles, ranging from cute and playful to sharp and realistic.',
    },
    {
        id: 4,
        image: '/images/demo-minimal.jpg',
        title: 'ARTSTYLE',
        name: 'Minimalism & Flat Design',
        description: 'Simple, clean, avoiding unnecessary details, focusing on basic shapes and colors.',
    },
    {
        id: 5,
        image: '/images/demo-surreal.jpg',
        title: 'ARTSTYLE',
        name: 'Surrealism & Abstract Art',
        description: 'Transforms unrealistic imagery, blending abstract and surreal elements to create a dreamlike effect.',
    },
    {
        id: 6,
        image: '/images/demo-cartoon.png',
        title: 'ARTSTYLE',
        name: 'Cartoon & Chibi Art',
        description: 'Cartoon and chibi art feature bold outlines, big eyes, and exaggerated expressions, making characters fun and lively.',
    },
    {
        id: 7,
        image: '/images/demo-handdrawing.png',
        title: 'ARTSTYLE',
        name: 'Hand-drawn & Sketch-like',
        description: 'Mimics the feel of traditional hand-drawn illustrations, with rough and natural lines commonly seen in modern artworks.',
    },
];

const T_TEXT_EXIT_START = 8000;
const T_TEXT_EXIT_ANIM  = 550;
const T_CARD_SLIDE      = 1200;

// ─── Rotate functions ────────────────────────────────────────
//
// NEXT: đưa idx=1 lên làm active, idx=0 (cũ) xuống cuối
//   before: [A(active), B, C, D, E, F, G]
//   after:  [A(cũ),     B(active), C, D, E, F, G → A ở cuối]
//   = [...items.slice(1), items[0]]  (giống cũ)
//
// PREV: đưa item cuối track (idx=n-1) thành active mới ở idx=1,
//        giữ idx=0 (A cũ) đứng yên
//   before: [A(active), B, C, D, E, F, G]
//   after:  [A(cũ),  G(active-mới), B, C, D, E, F]
//   = [items[0], items[n-1], ...items.slice(1, n-1)]
//
// Kết quả: cả 2 direction đều có idx=0=cũ(đứng yên), idx=1=mới(animate vào)
function rotateNext(items: ExploreItem[]): ExploreItem[] {
    // [cũ(0→xuống cuối), B(1→active), C, D, ...]
    return [...items.slice(1), items[0]];
}

function rotatePrev(items: ExploreItem[]): ExploreItem[] {
    // [A(cũ, giữ nguyên idx=0), G(cuối→active idx=1), B, C, D, E, F]
    const n = items.length;
    return [items[0], items[n - 1], ...items.slice(1, n - 1)];
}

// ─── ContentBlock ─────────────────────────────────────────────
interface ContentBlockProps {
    item: ExploreItem;
    isExiting: boolean;
    onStartNow: () => void;
}

function ContentBlock({ item, isExiting, onStartNow }: ContentBlockProps): React.ReactElement {
    const cls = `explore-content${isExiting ? ' explore-content--exit' : ''}`;
    return (
        <div className={cls}>
            <div className="explore-title" style={{ opacity: 0 }}>{item.title}</div>
            <div className="explore-name"  style={{ opacity: 0 }}>{item.name}</div>
            <div className="explore-des"   style={{ opacity: 0 }}>{item.description}</div>
            <div className="explore-btn"   style={{ opacity: 0 }}>
                <button>Wanna See More?</button>
                <a
                    className="explore-start-link"
                    href="#"
                    onClick={(e) => { e.preventDefault(); onStartNow(); }}
                >
                    Start now
                </a>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────
function ExplorePage({
    onPageChange,
}: {
    onPageChange?: (page: 'introduce' | 'about' | 'explore' | 'terms' | 'login' | 'register') => void;
}): React.ReactElement {

    const [items, setItems]           = React.useState<ExploreItem[]>(EXPLORE_ITEMS);
    const [phase, setPhase]           = React.useState<'idle' | 'text-exit' | 'sliding'>('idle');
    const [dir, setDir]               = React.useState<'next' | 'prev'>('next');
    const [timeKey, setTimeKey]       = React.useState(0);
    const [contentKey, setContentKey] = React.useState(0);

    const t1 = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const t2 = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const t3 = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAll = React.useCallback(() => {
        if (t1.current) clearTimeout(t1.current);
        if (t2.current) clearTimeout(t2.current);
        if (t3.current) clearTimeout(t3.current);
    }, []);

    const doSlide = React.useCallback((direction: 'next' | 'prev') => {
        setItems((prev) => direction === 'next' ? rotateNext(prev) : rotatePrev(prev));
        setContentKey((k) => k + 1);
        setPhase('sliding');
        setTimeKey((k) => k + 1);
    }, []);

    const scheduleAutoplay = React.useCallback(() => {
        clearAll();
        t1.current = setTimeout(() => {
            setPhase('text-exit');
            setDir('next');
            t2.current = setTimeout(() => {
                doSlide('next');
                t3.current = setTimeout(() => {
                    setPhase('idle');
                    scheduleAutoplay();
                }, T_CARD_SLIDE);
            }, T_TEXT_EXIT_ANIM);
        }, T_TEXT_EXIT_START);
    }, [clearAll, doSlide]); // eslint-disable-line react-hooks/exhaustive-deps

    const triggerSlide = React.useCallback((direction: 'next' | 'prev') => {
        if (phase !== 'idle') return;
        clearAll();
        setDir(direction);
        setPhase('text-exit');
        t1.current = setTimeout(() => {
            doSlide(direction);
            t2.current = setTimeout(() => {
                setPhase('idle');
                scheduleAutoplay();
            }, T_CARD_SLIDE);
        }, T_TEXT_EXIT_ANIM);
    }, [phase, clearAll, doSlide, scheduleAutoplay]);

    React.useEffect(() => {
        scheduleAutoplay();
        return clearAll;
    }, [scheduleAutoplay, clearAll]);

    const handleNext = () => triggerSlide('next');
    const handlePrev = () => triggerSlide('prev');

    // idx=1 luôn là item active (nth-child 2) cho cả NEXT và PREV
    const currentIndex = items[1].id;

    // z-index inline — đồng bộ với React render, không có CSS-class timing lag
    // Cả NEXT và PREV đều có cấu trúc giống nhau:
    //   idx=0: fullscreen cũ (dưới)
    //   idx=1: fullscreen mới (trên, đang animate vào)
    //   idx=2+: track cards (trên fullscreen)
    const getItemZIndex = (idx: number): number => {
        if (phase === 'sliding') {
            if (idx === 0) return 1;   // cũ: dưới
            if (idx === 1) return 5;   // mới: trên cùng
            return 10;                 // track cards
        }
        // idle / text-exit
        if (idx === 0) return 1;
        if (idx === 1) return 2;
        return 10;
    };

    const carouselClass = [
        'explore-carousel',
        phase === 'sliding' && dir === 'next' ? 'explore-next' : '',
        phase === 'sliding' && dir === 'prev' ? 'explore-prev' : '',
    ].filter(Boolean).join(' ');

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');

                /* ═══ ROOT ═══════════════════════════════════════════ */
                .explore-carousel {
                    width: 100vw;
                    height: 100vh;
                    overflow: hidden;
                    position: relative;
                    font-family: 'Poppins', sans-serif;
                    background: #111;
                }

                /* ═══ ITEMS — default: card nhỏ trên track ══════════ */
                .explore-carousel .explore-list .explore-item {
                    width: 180px;
                    height: 250px;
                    position: absolute;
                    top: 80%;
                    transform: translateY(-70%);
                    left: 70%;
                    border-radius: 20px;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                    background-position: 50% 50%;
                    background-size: cover;
                    transition:
                        left          1.2s cubic-bezier(0.25, 0.1, 0.25, 1),
                        top           1.2s cubic-bezier(0.25, 0.1, 0.25, 1),
                        width         1.2s cubic-bezier(0.25, 0.1, 0.25, 1),
                        height        1.2s cubic-bezier(0.25, 0.1, 0.25, 1),
                        border-radius 1.2s cubic-bezier(0.25, 0.1, 0.25, 1),
                        transform     1.2s cubic-bezier(0.25, 0.1, 0.25, 1);
                }

                /* ─── nth-child(1) & (2): fullscreen ─── */
                .explore-carousel .explore-list .explore-item:nth-child(1),
                .explore-carousel .explore-list .explore-item:nth-child(2) {
                    top: 0; left: 0;
                    transform: translate(0, 0);
                    border-radius: 0;
                    width: 100%; height: 100%;
                }

                /* ─── Track ─── */
                .explore-carousel .explore-list .explore-item:nth-child(3) { left: 67%; }
                .explore-carousel .explore-list .explore-item:nth-child(4) { left: calc(67% + 200px); }
                .explore-carousel .explore-list .explore-item:nth-child(5) { left: calc(67% + 400px); }
                .explore-carousel .explore-list .explore-item:nth-child(6) { left: calc(67% + 600px); }

                /* ─── Ẩn ─── */
                .explore-carousel .explore-list .explore-item:nth-child(n+7) {
                    left: calc(67% + 800px);
                    opacity: 0;
                }

                /* ═══ NEXT transition ════════════════════════════════
                   idx=0 (cũ): đứng yên, transition:none
                   idx=1 (mới): phóng to ease-in
                ════════════════════════════════════════════════════ */
                .explore-carousel.explore-next .explore-list .explore-item:nth-child(1) {
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    border-radius: 0;
                    transform: translate(0, 0);
                    transition: none;
                }
                .explore-carousel.explore-next .explore-list .explore-item:nth-child(2) {
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    border-radius: 0;
                    transform: translate(0, 0);
                    transition:
                        left          1.2s cubic-bezier(0.4, 0, 1, 1),
                        top           1.2s cubic-bezier(0.4, 0, 1, 1),
                        width         1.2s cubic-bezier(0.4, 0, 1, 1),
                        height        1.2s cubic-bezier(0.4, 0, 1, 1),
                        border-radius 1.2s cubic-bezier(0.4, 0, 1, 1),
                        transform     1.2s cubic-bezier(0.4, 0, 1, 1);
                }

                /* ═══ PREV transition ════════════════════════════════
                   Cấu trúc GIỐNG NEXT:
                   idx=0 (cũ): đứng yên, transition:none
                   idx=1 (mới = item cuối track, vừa chèn vào idx=1): phóng to ease-in
                   → item mới xuất phát từ track (nth-child 3 cũ) về fullscreen (nth-child 2)
                ════════════════════════════════════════════════════ */
                .explore-carousel.explore-prev .explore-list .explore-item:nth-child(1) {
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    border-radius: 0;
                    transform: translate(0, 0);
                    transition: none;
                }
                .explore-carousel.explore-prev .explore-list .explore-item:nth-child(2) {
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    border-radius: 0;
                    transform: translate(0, 0);
                    transition:
                        left          1.2s cubic-bezier(0.4, 0, 1, 1),
                        top           1.2s cubic-bezier(0.4, 0, 1, 1),
                        width         1.2s cubic-bezier(0.4, 0, 1, 1),
                        height        1.2s cubic-bezier(0.4, 0, 1, 1),
                        border-radius 1.2s cubic-bezier(0.4, 0, 1, 1),
                        transform     1.2s cubic-bezier(0.4, 0, 1, 1);
                }

                /* ═══ CONTENT ════════════════════════════════════════ */
                .explore-list .explore-item .explore-content {
                    display: none;
                    position: absolute;
                    top: 50%;
                    left: 100px;
                    width: 400px;
                    color: #fff;
                    z-index: 20;
                    margin-top: -200px;
                }
                /* nth-child(2) = idx=1 = luôn là item active, cả NEXT lẫn PREV */
                .explore-list .explore-item:nth-child(2) .explore-content {
                    display: block;
                }

                /* ─── TEXT ENTER ─── */
                .explore-content .explore-title {
                    font-size: 100px;
                    text-transform: uppercase;
                    color: #1472FF;
                    font-weight: bold;
                    line-height: 1;
                    animation: ecTitleEnter 1s ease-out 0.3s 1 forwards;
                }
                .explore-content .explore-name {
                    font-size: 50px;
                    text-transform: uppercase;
                    font-weight: bold;
                    line-height: 1;
                    text-shadow: 3px 4px 4px rgba(255,255,255,0.8);
                    animation: ecTitleEnter 1s ease-out 0.55s 1 forwards;
                }
                .explore-content .explore-des {
                    margin-top: 10px;
                    margin-bottom: 20px;
                    font-size: 18px;
                    margin-left: 5px;
                    animation: ecSubEnter 1s ease-out 0.8s 1 forwards;
                }
                .explore-content .explore-btn {
                    width: 420px;
                    margin-left: 5px;
                    animation: ecSubEnter 1s ease-out 1s 1 forwards;
                }
                @keyframes ecTitleEnter {
                    from { opacity: 0; margin-top: 70px; filter: blur(20px); }
                    to   { opacity: 1; margin-top: 0;    filter: blur(0); }
                }
                @keyframes ecSubEnter {
                    from { opacity: 0; transform: translateY(40px); filter: blur(10px); }
                    to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
                }

                /* ─── TEXT EXIT ─── */
                .explore-content--exit .explore-title {
                    animation: ecExit 0.35s ease-in 0s    1 forwards !important;
                }
                .explore-content--exit .explore-name {
                    animation: ecExit 0.35s ease-in 0.08s 1 forwards !important;
                }
                .explore-content--exit .explore-des {
                    animation: ecExit 0.35s ease-in 0.16s 1 forwards !important;
                }
                .explore-content--exit .explore-btn {
                    animation: ecExit 0.35s ease-in 0.16s 1 forwards !important;
                }
                @keyframes ecExit {
                    from { opacity: 1; transform: translateX(0);     filter: blur(0); }
                    to   { opacity: 0; transform: translateX(-90px); filter: blur(10px); }
                }

                /* ─── Buttons ─── */
                .explore-content .explore-btn button {
                    padding: 10px 20px;
                    font-size: 20px;
                    border: 2px solid #fff;
                    border-radius: 15px;
                    background: transparent;
                    color: #fff;
                    cursor: pointer;
                    margin-right: 15px;
                    font-family: 'Poppins', sans-serif;
                    transition: 0.3s;
                }
                .explore-content .explore-btn button:hover {
                    background: #fff;
                    color: #1472FF;
                }
                .explore-content .explore-btn .explore-start-link {
                    display: inline-block;
                    padding: 10px 20px;
                    font-size: 20px;
                    font-weight: 400;
                    color: #fff;
                    background: transparent;
                    border: 2px solid #fff;
                    border-radius: 15px;
                    text-decoration: none;
                    transition: 0.3s;
                }
                .explore-content .explore-btn .explore-start-link:hover {
                    background-color: #1472FF;
                    border-color: #1472FF;
                    transform: scale(1.05);
                }

                /* ═══ ARROWS ═════════════════════════════════════════ */
                .explore-arrows {
                    position: absolute;
                    top: 80%;
                    right: 60%;
                    z-index: 200;
                    width: 300px;
                    max-width: 30%;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }
                .explore-arrow-btn {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background-color: #1472FF;
                    color: #fff;
                    border: none;
                    outline: none;
                    font-size: 16px;
                    font-family: monospace;
                    font-weight: bold;
                    cursor: pointer;
                    transition: background 0.5s, color 0.5s, opacity 0.3s;
                }
                .explore-arrow-btn:hover:not(:disabled) { background: #fff; color: #000; }
                .explore-arrow-btn:disabled { opacity: 0.35; cursor: not-allowed; }

                /* ═══ INDEX ══════════════════════════════════════════ */
                .explore-index {
                    position: absolute;
                    top: calc(80% + 60px);
                    right: 60%;
                    z-index: 200;
                    font-family: 'Poppins', sans-serif;
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                    text-shadow: 1px 2px 4px rgba(0,0,0,0.6);
                    letter-spacing: 1px;
                }

                /* ═══ TIME BAR ═══════════════════════════════════════ */
                .explore-time-running {
                    position: absolute;
                    width: 0%;
                    height: 4px;
                    background-color: #14ff72cb;
                    left: 0; top: 0;
                    z-index: 300;
                    animation: exploreRunningTime 10s linear 1 forwards;
                }
                @keyframes exploreRunningTime {
                    from { width: 0%; }
                    to   { width: 100%; }
                }

                /* ═══ RESPONSIVE ═════════════════════════════════════ */
                @media screen and (max-width: 999px) {
                    .explore-list .explore-item .explore-content { left: 50px; }
                    .explore-content .explore-title,
                    .explore-content .explore-name { font-size: 70px; }
                    .explore-content .explore-des  { font-size: 16px; }
                }
                @media screen and (max-width: 690px) {
                    .explore-list .explore-item .explore-content { top: 40%; }
                    .explore-content .explore-title,
                    .explore-content .explore-name { font-size: 45px; }
                    .explore-content .explore-btn button { padding: 10px 15px; font-size: 14px; }
                }
            `}</style>

            <div className={carouselClass}>
                <div className="explore-list">
                    {items.map((item, idx) => (
                        <div
                            key={item.id}
                            className="explore-item"
                            style={{
                                backgroundImage: `url(${item.image})`,
                                zIndex: getItemZIndex(idx),
                            }}
                        >
                            {/* ContentBlock chỉ tại idx=1 (nth-child 2) — luôn đúng cho cả NEXT và PREV */}
                            {idx === 1 && (
                                <ContentBlock
                                    key={contentKey}
                                    item={item}
                                    isExiting={phase === 'text-exit'}
                                    onStartNow={() => onPageChange?.('login')}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="explore-arrows">
                    <button className="explore-arrow-btn" onClick={handlePrev} disabled={phase !== 'idle'}>{'<'}</button>
                    <button className="explore-arrow-btn" onClick={handleNext} disabled={phase !== 'idle'}>{'>'}</button>
                </div>

                <div className="explore-index">
                    {currentIndex} / {EXPLORE_ITEMS.length}
                </div>

                <div key={timeKey} className="explore-time-running" />
            </div>
        </>
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
                                borderRadius: 'var(--radius-xl)',
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
                                borderRadius: 'var(--radius-xl)',
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