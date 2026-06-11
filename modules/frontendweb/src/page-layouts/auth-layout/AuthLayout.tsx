/**
 * @file AuthLayout.tsx
 * @layer page-layouts (Layer 2)
 * @description Layout wrapper for authentication pages (Login, Register)
 * Provides centered form container with consistent styling
 * @owner AG-04
 */

import React from 'react';
import './auth-layout.css';

interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

/**
 * AuthLayout: Centered, minimal form container
 * Used by: LoginPage, RegisterPage
 * 
 * Features:
 * - Full viewport height centering
 * - Max-width constraint (28rem / 448px)
 * - White card with subtle shadow
 * - Responsive padding on mobile
 */
export function AuthLayout({
    title,
    subtitle,
    children,
}: AuthLayoutProps): React.ReactElement {
    return (
        <div className="auth-layout">
            <div className="auth-layout__container">
                {/* Header Section */}
                <header className="auth-layout__header">
                    <h1 className="auth-layout__title">{title}</h1>
                    {subtitle && (
                        <p className="auth-layout__subtitle">{subtitle}</p>
                    )}
                </header>

                {/* Content Section */}
                <main className="auth-layout__content">
                    {children}
                </main>
            </div>
        </div>
    );
}