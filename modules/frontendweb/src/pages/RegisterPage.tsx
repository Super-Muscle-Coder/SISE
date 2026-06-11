/**
 * @file RegisterPage.tsx
 * @layer pages
 * @description Register/Sign up page - uses AuthLayout from page-layouts
 * @owner AG-04
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/page-layouts';
import { useRegister } from '@/services/auth_services';
import { RegisterRequest, FormValidationResult } from '@/entities/auth_entities';

/**
 * RegisterPage: User registration form
 * 
 * Features:
 * - Username input (3-50 chars)
 * - Email input (with format validation)
 * - Password input (min 8 chars with strength indicator)
 * - Password confirmation
 * - Form validation (client-side + server-side)
 * - Loading state
 * - Error handling
 * - Sign in link
 */
export function RegisterPage(): React.ReactElement {
    const navigate = useNavigate();
    const { register, isLoading, error } = useRegister();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

    // Calculate password strength
    const calculatePasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
        if (pwd.length < 8) return 'weak';
        if (pwd.length < 12) return 'medium';
        // Check for complexity (uppercase, number, special char)
        const hasUpper = /[A-Z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecial = /[!@#$%^&*]/.test(pwd);
        if (hasUpper && hasNumber && hasSpecial) return 'strong';
        return 'medium';
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setPasswordStrength(calculatePasswordStrength(value));
    };

    // Validate form before submission
    const validateForm = (): FormValidationResult => {
        const errors: Record<string, string> = {};

        // Username validation
        if (!username) {
            errors.username = 'Username is required';
        } else if (username.length < 3) {
            errors.username = 'Username must be at least 3 characters';
        } else if (username.length > 50) {
            errors.username = 'Username must not exceed 50 characters';
        }

        // Email validation
        if (!email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!password) {
            errors.password = 'Password is required';
        } else if (password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        // Confirm password validation
        if (!confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setFieldErrors({});

        // Client-side validation
        const validation = validateForm();
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            setFormError('Please fix the errors below');
            return;
        }

        try {
            const credentials: RegisterRequest = {
                username,
                email,
                password,
            };
            await register(credentials);
            // Navigation handled by auth service via custom event
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = (err as Error).message || error || 'Registration failed';
            setFormError(errorMessage);
        }
    };

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join SISE and start exploring"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* General Error Message */}
                {(formError || error) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm font-medium text-red-800">
                            {formError || error}
                        </p>
                    </div>
                )}

                {/* Username Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="username"
                        className="block text-sm font-medium text-zinc-900"
                    >
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            if (fieldErrors.username) {
                                setFieldErrors({ ...fieldErrors, username: '' });
                            }
                        }}
                        placeholder="3-50 characters"
                        disabled={isLoading}
                        className={`
                            w-full px-4 py-3 border rounded-md text-base font-normal
                            placeholder-zinc-500 focus:outline-none focus:ring-1
                            disabled:bg-zinc-100 disabled:cursor-not-allowed transition-smooth
                            ${fieldErrors.username
                                ? 'border-red-500 focus:border-red-600 focus:ring-red-600'
                                : 'border-zinc-200 focus:border-red-600 focus:ring-red-600'
                            }
                        `}
                        required
                        autoComplete="username"
                    />
                    {fieldErrors.username && (
                        <p className="text-sm font-medium text-red-600">{fieldErrors.username}</p>
                    )}
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-zinc-900"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (fieldErrors.email) {
                                setFieldErrors({ ...fieldErrors, email: '' });
                            }
                        }}
                        placeholder="name@example.com"
                        disabled={isLoading}
                        className={`
                            w-full px-4 py-3 border rounded-md text-base font-normal
                            placeholder-zinc-500 focus:outline-none focus:ring-1
                            disabled:bg-zinc-100 disabled:cursor-not-allowed transition-smooth
                            ${fieldErrors.email
                                ? 'border-red-500 focus:border-red-600 focus:ring-red-600'
                                : 'border-zinc-200 focus:border-red-600 focus:ring-red-600'
                            }
                        `}
                        required
                        autoComplete="email"
                    />
                    {fieldErrors.email && (
                        <p className="text-sm font-medium text-red-600">{fieldErrors.email}</p>
                    )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-zinc-900"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => {
                            handlePasswordChange(e.target.value);
                            if (fieldErrors.password) {
                                setFieldErrors({ ...fieldErrors, password: '' });
                            }
                        }}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={`
                            w-full px-4 py-3 border rounded-md text-base font-normal
                            placeholder-zinc-500 focus:outline-none focus:ring-1
                            disabled:bg-zinc-100 disabled:cursor-not-allowed transition-smooth
                            ${fieldErrors.password
                                ? 'border-red-500 focus:border-red-600 focus:ring-red-600'
                                : 'border-zinc-200 focus:border-red-600 focus:ring-red-600'
                            }
                        `}
                        required
                        autoComplete="new-password"
                    />
                    {/* Password Strength Indicator */}
                    {password && (
                        <div className="flex gap-1">
                            <div
                                className={`flex-1 h-1 rounded-full ${passwordStrength === 'weak'
                                        ? 'bg-red-500'
                                        : passwordStrength === 'medium'
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                    }`}
                            />
                            <div
                                className={`flex-1 h-1 rounded-full ${passwordStrength === 'medium' || passwordStrength === 'strong'
                                        ? 'bg-yellow-500'
                                        : 'bg-zinc-200'
                                    }`}
                            />
                            <div
                                className={`flex-1 h-1 rounded-full ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-zinc-200'
                                    }`}
                            />
                        </div>
                    )}
                    {fieldErrors.password && (
                        <p className="text-sm font-medium text-red-600">{fieldErrors.password}</p>
                    )}
                    <p className="text-xs text-zinc-500">
                        Minimum 8 characters. Stronger with uppercase, numbers, and symbols.
                    </p>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-zinc-900"
                    >
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (fieldErrors.confirmPassword) {
                                setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                            }
                        }}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className={`
                            w-full px-4 py-3 border rounded-md text-base font-normal
                            placeholder-zinc-500 focus:outline-none focus:ring-1
                            disabled:bg-zinc-100 disabled:cursor-not-allowed transition-smooth
                            ${fieldErrors.confirmPassword
                                ? 'border-red-500 focus:border-red-600 focus:ring-red-600'
                                : 'border-zinc-200 focus:border-red-600 focus:ring-red-600'
                            }
                        `}
                        required
                        autoComplete="new-password"
                    />
                    {fieldErrors.confirmPassword && (
                        <p className="text-sm font-medium text-red-600">
                            {fieldErrors.confirmPassword}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-md hover:bg-red-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-smooth"
                >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>

                {/* Sign In Link */}
                <div className="text-center text-sm text-zinc-600">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="text-red-600 font-semibold hover:text-red-700 hover:underline"
                    >
                        Sign in
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}