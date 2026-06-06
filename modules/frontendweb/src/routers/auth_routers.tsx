/**
 * @file auth_routers.tsx (UPDATED)
 * @layer routers
 * @description Auth UI pages (Login & Register) - Pinterest design aligned.
 *              FIXES:
 *              - FIX UI.1: Background từ #EFEFEF → white
 *              - FIX UI.2: Button primary từ blue-600 → pinterest red (#E60023)
 *              - FIX UI.3: Text colors dùng semantic tokens
 *              - FIX UI.4: Refactor color usage (border, error, etc.)
 * @owner AG-04
 */

'use client';

import React, { useState } from 'react';
import { useLogin, useRegister, validateAuthForm } from '../services/auth_services';
import { AUTH_CONFIG } from '../configs/auth_configs';

// ============================================================================
// LOGIN PAGE COMPONENT
// ============================================================================

export const LoginPage: React.FC = () => {
    const { isLoading, error, login } = useLogin();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validation = validateAuthForm('login', formData);
        if (!validation.valid) {
            setValidationErrors(validation.errors);
            return;
        }

        setValidationErrors({});

        const result = await login({
            username: formData.username,
            password: formData.password,
        });

        if (!result.success) {
            return;
        }
    };

    return (
        // FIX UI.1: bg-[#EFEFEF] → bg-white (Pinterest design)
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
            {/* FIX UI.4: shadow-lg → shadow-md (subtle cards in Pinterest) */}
            <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 border border-zinc-100">
                {/* Header - Text colors semantic */}
                <h1 className="text-3xl font-bold text-center text-black mb-2">Welcome Back</h1>
                <p className="text-center text-zinc-500 text-sm mb-8">Sign in to your account</p>

                {/* Error Message */}
                {error && (
                    <div
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm line-clamp-2 animate-in fade-in duration-300"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Field */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-black mb-2">
                            Email or Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${validationErrors.username
                                    ? 'border-red-400 bg-red-50 focus:ring-red-300'
                                    : 'border-zinc-200 bg-white focus:ring-red-500'
                                } ${isLoading ? 'bg-zinc-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
                            placeholder="you@example.com"
                            autoComplete="username"
                            aria-describedby={validationErrors.username ? 'username-error' : undefined}
                            aria-invalid={!!validationErrors.username}
                        />
                        {validationErrors.username && (
                            <p id="username-error" className="text-red-600 text-xs mt-1" role="alert">
                                {validationErrors.username}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${validationErrors.password
                                        ? 'border-red-400 bg-red-50 focus:ring-red-300'
                                        : 'border-zinc-200 bg-white focus:ring-red-500'
                                    } ${isLoading ? 'bg-zinc-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
                                placeholder="••••••"
                                autoComplete="current-password"
                                aria-describedby={validationErrors.password ? 'password-error' : undefined}
                                aria-invalid={!!validationErrors.password}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black disabled:opacity-50 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {validationErrors.password && (
                            <p id="password-error" className="text-red-600 text-xs mt-1" role="alert">
                                {validationErrors.password}
                            </p>
                        )}
                    </div>

                    {/* Submit Button - FIX UI.2: bg-blue-600 → bg-red-600 (Pinterest brand) */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 px-5 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                {/* Footer Link */}
                <p className="text-center text-sm text-zinc-600 mt-6">
                    Don't have an account?{' '}
                    <a href="/register" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
};

// ============================================================================
// REGISTER PAGE COMPONENT
// ============================================================================

export const RegisterPage: React.FC = () => {
    const { isLoading, error, register } = useRegister();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        const passwordMaxLength = AUTH_CONFIG.validation.password.maxLength;
        if ((name === 'password' || name === 'confirmPassword') && value.length > passwordMaxLength) {
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, string> = {};

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }

        const validation = validateAuthForm('register', formData);
        if (!validation.valid) {
            setValidationErrors({ ...validation.errors, ...errors });
            return;
        }

        setValidationErrors({});

        const result = await register({
            username: formData.username,
            email: formData.email,
            password: formData.password,
        });

        if (!result.success) {
            return;
        }
    };

    return (
        // FIX UI.1: bg-[#EFEFEF] → bg-white
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
            {/* FIX UI.4: shadow-lg → shadow-md */}
            <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 border border-zinc-100">
                {/* Header */}
                <h1 className="text-3xl font-bold text-center text-black mb-2">Create Account</h1>
                <p className="text-center text-zinc-500 text-sm mb-8">Join us today</p>

                {/* Error Message */}
                {error && (
                    <div
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm line-clamp-2 animate-in fade-in duration-300"
                        role="alert"
                    >
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username Field */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-black mb-2">
                            Username
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            maxLength={AUTH_CONFIG.validation.username.maxLength}
                            className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${validationErrors.username
                                    ? 'border-red-400 bg-red-50 focus:ring-red-300'
                                    : 'border-zinc-200 bg-white focus:ring-red-500'
                                } ${isLoading ? 'bg-zinc-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
                            placeholder="johndoe"
                            autoComplete="username"
                            aria-describedby={validationErrors.username ? 'username-error' : undefined}
                            aria-invalid={!!validationErrors.username}
                        />
                        {validationErrors.username && (
                            <p id="username-error" className="text-red-600 text-xs mt-1" role="alert">
                                {validationErrors.username}
                            </p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 transition-all duration-300 ${validationErrors.email
                                    ? 'border-red-400 bg-red-50 focus:ring-red-300'
                                    : 'border-zinc-200 bg-white focus:ring-red-500'
                                } ${isLoading ? 'bg-zinc-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
                            placeholder="you@example.com"
                            autoComplete="email"
                            aria-describedby={validationErrors.email ? 'email-error' : undefined}
                            aria-invalid={!!validationErrors.email}
                        />
                        {validationErrors.email && (
                            <p id="email-error" className="text-red-600 text-xs mt-1" role="alert">
                                {validationErrors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                maxLength={AUTH_CONFIG.validation.password.maxLength}
                                className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${validationErrors.password
                                        ? 'border-red-400 bg-red-50 focus:ring-red-300'
                                        : 'border-zinc-200 bg-white focus:ring-red-500'
                                    } ${isLoading ? 'bg-zinc-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
                                placeholder="••••••"
                                autoComplete="new-password"
                                aria-describedby={validationErrors.password ? 'password-error' : undefined}
                                aria-invalid={!!validationErrors.password}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black disabled:opacity-50 transition-colors"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {validationErrors.password && (
                            <p id="password-error" className="text-red-600 text-xs mt-1" role="alert">
                                {validationErrors.password}
                            </p>
                        )}
                        {formData.password.length > 80 && (
                            <p className="text-xs text-zinc-500 mt-1">
                                {formData.password.length}/{AUTH_CONFIG.validation.password.maxLength} characters
                            </p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                maxLength={AUTH_CONFIG.validation.password.maxLength}
                                className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 transition-all duration-300 pr-12 ${validationErrors.confirmPassword
                                        ? 'border-red-400 bg-red-50 focus:ring-red-300'
                                        : 'border-zinc-200 bg-white focus:ring-red-500'
                                    } ${isLoading ? 'bg-zinc-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
                                placeholder="••••••"
                                autoComplete="new-password"
                                aria-describedby={validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
                                aria-invalid={!!validationErrors.confirmPassword}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={isLoading}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black disabled:opacity-50 transition-colors"
                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                                {showConfirmPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0 8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {validationErrors.confirmPassword && (
                            <p id="confirm-password-error" className="text-red-600 text-xs mt-1" role="alert">
                                {validationErrors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* Submit Button - FIX UI.2: bg-blue-600 → bg-red-600 */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 px-5 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating account...
                            </span>
                        ) : (
                            'Sign Up'
                        )}
                    </button>
                </form>

                {/* Footer Link */}
                <p className="text-center text-sm text-zinc-600 mt-6">
                    Already have an account?{' '}
                    <a href="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                        Sign in
                    </a>
                </p>
            </div>
        </div>
    );
};