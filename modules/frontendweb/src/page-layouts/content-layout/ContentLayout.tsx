/**
 * @file ContentLayout.tsx
 * @layer page-layouts (Layer 2)
 * @description Layout wrapper for content pages (Search, Albums, etc.)
 * Provides grid/masonry container with header and filters
 * @owner AG-04
 */

import React from 'react';
import './content-layout.css';

interface ContentLayoutProps {
    title?: string;
    subtitle?: string;
    filters?: React.ReactNode;
    children: React.ReactNode;
    layout?: 'grid' | 'masonry' | 'list';
}

/**
 * ContentLayout: Content display structure
 * Used by: SearchResultsPage, AlbumsPage, MediaPage
 * 
 * Features:
 * - Header with title and subtitle
 * - Filter/controls area
 * - Grid/masonry/list layout options
 * - Responsive container
 */
export function ContentLayout({
    title,
    subtitle,
    filters,
    children,
    layout = 'grid',
}: ContentLayoutProps): React.ReactElement {
    return (
        <div className="content-layout">
            {/* Header Section */}
            {(title || subtitle) && (
                <header className="content-layout__header">
                    {title && (
                        <h1 className="content-layout__title">{title}</h1>
                    )}
                    {subtitle && (
                        <p className="content-layout__subtitle">{subtitle}</p>
                    )}
                </header>
            )}

            {/* Filters Section */}
            {filters && (
                <section className="content-layout__filters">
                    {filters}
                </section>
            )}

            {/* Content Section */}
            <main
                className={`content-layout__content content-layout__content--${layout}`}
            >
                {children}
            </main>
        </div>
    );
}