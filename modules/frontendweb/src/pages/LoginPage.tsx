/**
 * @file LoginPage.tsx
 * @layer pages
 * @description Login page - uses AuthLayout from page-layouts
 * @owner AG-04
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/page-layouts';
import { useLogin } from '@/services/auth_services';
import { LoginRequest } from '@/entities/auth_entities';

/**
 * LoginPage: User authentication form
 * 
 * Features:
 * - Username input (not email - per backend spec)
 * - Password input
 * - Form validation
 * - Loading state
 * - Error handling
 * - Sign up link
 */
export function LoginPage(): React.ReactElement {
    const navigate = useNavigate();
    const { login, isLoading, error } = useLogin();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!username || !password) {
            setFormError('Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            setFormError('Username must be at least 3 characters');
            return;
        }

        if (password.length < 8) {
            setFormError('Password must be at least 8 characters');
            return;
        }

        try {
            const credentials: LoginRequest = { username, password };
            await login(credentials);
            // Navigation handled by auth service via custom event
            navigate('/dashboard');
        } catch (err) {
            setFormError((err as Error).message || 'Login failed');
        }
    };

    return (
        <AuthLayout
            title="Sign In"
            subtitle="Welcome back to SISE"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
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
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-md text-base font-normal text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:bg-zinc-100 disabled:cursor-not-allowed transition-smooth"
                        required
                        autoComplete="username"
                    />
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
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-zinc-200 rounded-md text-base font-normal text-zinc-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:bg-zinc-100 disabled:cursor-not-allowed transition-smooth"
                        required
                        autoComplete="current-password"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-md hover:bg-red-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-smooth"
                >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                {/* Sign Up Link */}
                <div className="text-center text-sm text-zinc-600">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="text-red-600 font-semibold hover:text-red-700 hover:underline"
                    >
                        Create one
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}