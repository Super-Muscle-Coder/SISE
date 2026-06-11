/**
 * @file DashboardPage.tsx
 * @layer pages
 * @description Main dashboard page - uses DashboardLayout from page-layouts
 * @owner AG-04
 */

import React from 'react';
import { DashboardLayout } from '@/page-layouts';

/**
 * DashboardPage: User dashboard with sidebar navigation
 * 
 * Will include:
 * - User profile overview
 * - Album management
 * - Recent searches
 * - Stats/metrics
 * - Sidebar navigation
 */
export function DashboardPage(): React.ReactElement {
    const sidebarContent = (
        <nav className="space-y-2">
            <NavLink href="/dashboard" label="Dashboard" active />
            <NavLink href="/albums" label="Albums" />
            <NavLink href="/search" label="Search" />
            <NavLink href="/evaluation" label="Evaluation" />
            <NavLink href="/profile" label="Profile" />
            <NavLink href="/settings" label="Settings" />
        </nav>
    );

    return (
        <DashboardLayout
            title="Dashboard"
            sidebar={sidebarContent}
            sidebarCollapsible={true}
        >
            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-red-50 to-red-100 p-6 rounded-lg border border-red-200">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                        Welcome back!
                    </h2>
                    <p className="text-zinc-600">
                        You have 3 new search results and 1 album update.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Albums" value="12" icon="📁" />
                    <StatCard title="Images" value="342" icon="🖼️" />
                    <StatCard title="Searches" value="28" icon="🔍" />
                    <StatCard title="Views" value="1.2K" icon="👁️" />
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-zinc-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-zinc-900 mb-4">
                        Recent Activity
                    </h3>
                    <p className="text-zinc-500">
                        Your recent activity will appear here.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}

/**
 * NavLink component for sidebar
 */
function NavLink({
    href,
    label,
    active = false,
}: {
    href: string;
    label: string;
    active?: boolean;
}) {
    return (
        <a
            href={href}
            className={`
                block px-4 py-2 rounded-md font-medium transition-colors
                ${active
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 text-zinc-600'
                }
            `}
        >
            {label}
        </a>
    );
}

/**
 * StatCard component
 */
function StatCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: string;
    icon: string;
}) {
    return (
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-zinc-600 font-medium">{title}</p>
                    <p className="text-2xl font-bold text-zinc-900">{value}</p>
                </div>
                <div className="text-3xl">{icon}</div>
            </div>
        </div>
    );
}