// router.tsx
// Đây là tệp dùng để quản lí, sắp xếp các Page trong web của chúng ta, giúp cho việc điều hướng giữa các trang trở nên dễ dàng hơn.
/*
Công dụng: Quản lý tất cả routes (URL paths)
  - Định nghĩa đường dẫn: /login, /register, /dashboard, ...
  - Quyết định page nào hiển thị cho URL nào
  - Bảo vệ routes (ProtectedRoute)
  - Xử lý điều hướng khi login/logout
Bạn cần biết: Muốn thêm page mới? Thêm Route mới ở đây
*/
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AUTH_CONFIG } from '../configs/auth_configs';
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
 * Routes configuration with public and protected routes.
 */
const RouterConfig: React.FC = () => {
    return (
        <Routes>
            {/* Landing page - visible to everyone, but redirects if authenticated */}
            <Route
                path="/"
                element={
                    (() => {
                        const token = getStoredToken();
                        if (token) {
                            return <Navigate to="/dashboard" replace />;
                        }
                        return <LandingPage />;
                    })()
                }
            />

            {/* Public auth routes */}
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

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

/**
 * SessionNavigationHandler - Handles navigation on auth events.
 * Must be INSIDE BrowserRouter to use useNavigate().
 * FIX R1: Listen for sessionStarted and sessionEnded events.
 */
const SessionNavigationHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    /**
     * FIX R1: Listen for sessionStarted event from auth_services.ts
     * When user successfully logs in, navigate to /dashboard.
     */
    React.useEffect(() => {
        const handleSessionStarted = (event: Event) => {
            const customEvent = event as CustomEvent;
            console.info('[Router] Session started', customEvent.detail);
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
 * AppRouter - BrowserRouter wrapper with session navigation handler.
 */
export const AppRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <BrowserRouter>
            <SessionNavigationHandler>
                {children}
            </SessionNavigationHandler>
        </BrowserRouter>
    );
};

/**
 * Export RouterConfig for use in App structure.
 */
export { RouterConfig };