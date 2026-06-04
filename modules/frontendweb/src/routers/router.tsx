/**
 * @file router.tsx
 * @layer routers
 * @description Application-level routing configuration.
 *              FIX R1: Listens for sessionStarted event and navigates to /dashboard.
 *              Provides public (Login/Register) and protected routes.
 * @owner AG-04
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginPage } from '../routers/auth_routers';
import { RegisterPage } from '../routers/auth_routers';
import { AUTH_CONFIG } from '../configs/auth_config';
import { getStoredToken } from '../services/auth_services';

/**
 * Protected Route wrapper to check if user is authenticated.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getStoredToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

/**
 * Public Route wrapper to redirect authenticated users away from login/register.
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getStoredToken();
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

/**
 * Main Router component with FIX R1: Session started event listener.
 */
export const AppRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  /**
   * FIX R1: Listen for sessionStarted event from auth_services.ts
   * When user successfully logs in, navigate to /dashboard.
   */
  React.useEffect(() => {
    const handleSessionStarted = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.info('[Router] Session started', customEvent.detail);
      // Navigate to dashboard after brief delay to let state settle
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    };

    window.addEventListener(
      AUTH_CONFIG.events.sessionStarted,
      handleSessionStarted as EventListener
    );

    return () => {
      window.removeEventListener(
        AUTH_CONFIG.events.sessionStarted,
        handleSessionStarted as EventListener
      );
    };
  }, [navigate]);

  /**
   * FIX R1: Also listen for sessionEnded event to redirect to login.
   */
  React.useEffect(() => {
    const handleSessionEnded = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.info('[Router] Session ended', customEvent.detail?.reason);
      // Redirect to login
      navigate('/login', { replace: true });
    };

    window.addEventListener(
      AUTH_CONFIG.events.sessionEnded,
      handleSessionEnded as EventListener
    );

    return () => {
      window.removeEventListener(
        AUTH_CONFIG.events.sessionEnded,
        handleSessionEnded as EventListener
      );
    };
  }, [navigate]);

  return <>{children}</>;
};

/**
 * Placeholder Dashboard page.
 * TODO T004-03: Replace with actual Dashboard component.
 */
const DashboardPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p className="mt-4 text-gray-600">
        Welcome! This is your dashboard. Album management and search features coming soon.
      </p>
    </div>
  );
};

/**
 * Placeholder Home/Landing page.
 */
const HomePage: React.FC = () => {
  const token = getStoredToken();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h2 className="text-3xl font-bold text-gray-900">Welcome to SISE</h2>
      <p className="mt-4 text-gray-600">
        Smart Image Search Engine - Multimodal Retrieval Platform
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/login"
          className="rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-all"
        >
          Sign In
        </a>
        <a
          href="/register"
          className="rounded-full border border-gray-300 px-6 py-3 text-gray-900 font-semibold hover:bg-gray-100 transition-all"
        >
          Sign Up
        </a>
      </div>
    </div>
  );
};

/**
 * Routes configuration with public and protected routes.
 */
export const RouterConfig: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Home page - redirects based on auth state */}
        <Route path="/" element={<HomePage />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
