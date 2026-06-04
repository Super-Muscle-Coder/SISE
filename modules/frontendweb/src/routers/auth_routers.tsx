/**
 * @file auth_routers.tsx
 * @layer routers
 * @description Auth UI pages (Login & Register).
 *              FIX 2.3: Password maxLength overflow protection & counter
 *              FIX 2.4: Browser autofill override CSS (via index.css)
 *              Owns form state, input management, and error display.
 *              Calls service hooks to perform auth actions.
 *              Dispatches events to notify global router on success.
 * @owner AG-04
 */

'use client';

import React, { useState } from 'react';
import { useLogin, useRegister, validateAuthForm } from '../services/auth_services';
import { AUTH_CONFIG } from '../configs/auth_config';

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
    // Clear individual field error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validation = validateAuthForm('login', formData);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors({});

    // Call login adapter
    const result = await login({
      username: formData.username,
      password: formData.password,
    });

    if (!result.success) {
      // Error is already set by the hook
      return;
    }

    // On success, the hook dispatches sessionStarted event
    // Router will handle navigation
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EFEFEF] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Welcome Back</h1>
        <p className="text-center text-gray-600 text-sm mb-8">Sign in to your account</p>

        {/* Error Message (Global) */}
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
          {/* Username/Email Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Email or Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-300 ${
                validationErrors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              placeholder="you@example.com"
              autoComplete="username"
            />
            {validationErrors.username && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.username}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-300 pr-12 ${
                  validationErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                placeholder="••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3l18 18"
                    />
                  </svg>
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 px-5 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:underline font-medium">
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

    // FIX 2.3: Limit password to 128 characters
    if ((name === 'password' || name === 'confirmPassword') && value.length > 128) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear individual field error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Additional client-side validation
    const errors: Record<string, string> = {};

    // Check confirm password matches
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // Validate all fields using the centralized validator
    const validation = validateAuthForm('register', formData);
    if (!validation.valid) {
      setValidationErrors({ ...validation.errors, ...errors });
      return;
    }

    setValidationErrors({});

    // Call register adapter
    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });

    if (!result.success) {
      // Error is already set by the hook
      return;
    }

    // On success, the hook dispatches sessionStarted event
    // Router will handle navigation
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EFEFEF] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Account</h1>
        <p className="text-center text-gray-600 text-sm mb-8">Join us today</p>

        {/* Error Message (Global) */}
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
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-300 ${
                validationErrors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              placeholder="johndoe"
              autoComplete="username"
            />
            {validationErrors.username && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.username}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-300 ${
                validationErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {validationErrors.email && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                maxLength={128}
                className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-300 pr-12 ${
                  validationErrors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                placeholder="••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3l18 18"
                    />
                  </svg>
                )}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.password}</p>
            )}
            {/* FIX 2.3: Character counter for long passwords */}
            {formData.password.length > 80 && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.password.length}/128 characters
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
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
                maxLength={128}
                className={`w-full px-5 py-3 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-300 pr-12 ${
                  validationErrors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                } ${isLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                placeholder="••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3l18 18"
                    />
                  </svg>
                )}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-red-600 text-xs mt-1">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 px-5 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating account...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};
