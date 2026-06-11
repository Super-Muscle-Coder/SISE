/**
 * @file DashboardLayout.tsx
 * @layer page-layouts (Layer 2)
 * @description Layout wrapper for dashboard pages
 * Provides two-column layout: sidebar + main content
 * @owner AG-04
 */

import React, { useState } from 'react';
import './dashboard-layout.css';

interface DashboardLayoutProps {
    title?: string;
    sidebar?: React.ReactNode;
    children: React.ReactNode;
    sidebarCollapsible?: boolean;
}

/**
 * DashboardLayout: Two-column dashboard structure
 * Used by: DashboardPage, ProfilePage, etc.
 * 
 * Features:
 * - Optional collapsible sidebar
 * - Main content area
 * - Responsive: sidebar collapses on mobile
 * - Optional header/title area
 */
export function DashboardLayout({
    title,
    sidebar,
    children,
    sidebarCollapsible = true,
}: DashboardLayoutProps): React.ReactElement {
    const [sidebarOpen, setSidebarOpen] = useState(!sidebarCollapsible);

    return (
        <div className="dashboard-layout">
            {/* Header */}
            {title && (
                <header className="dashboard-layout__header">
                    <div className="dashboard-layout__header-content">
                        {sidebarCollapsible && (
                            <button
                                className="dashboard-layout__toggle"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                aria-label="Toggle sidebar"
                            >
                                ☰
                            </button>
                        )}
                        <h1 className="dashboard-layout__title">{title}</h1>
                    </div>
                </header>
            )}

            {/* Main Container */}
            <div className="dashboard-layout__container">
                {/* Sidebar */}
                {sidebar && (
                    <aside
                        className={`dashboard-layout__sidebar ${sidebarOpen ? 'dashboard-layout__sidebar--open' : ''
                            }`}
                    >
                        <nav className="dashboard-layout__sidebar-content">
                            {sidebar}
                        </nav>
                    </aside>
                )}

                {/* Main Content */}
                <main className="dashboard-layout__main">
                    {children}
                </main>
            </div>
        </div>
    );
}