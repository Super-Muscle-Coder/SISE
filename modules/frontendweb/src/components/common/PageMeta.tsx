/**
 * @file PageMeta.tsx
 * @layer components (Layer 3)
 * @description Meta tags for page SEO (title, description, etc.)
 * @owner AG-04
 */

import React, { useEffect } from 'react';

interface PageMetaProps {
    title: string;
    description?: string;
    robots?: string;
}

/**
 * PageMeta: Set page metadata for SEO
 * 
 * Usage:
 * <PageMeta title="Login - SISE" description="Sign in to your account" />
 */
export function PageMeta({
    title,
    description,
    robots = 'index, follow',
}: PageMetaProps): null {
    useEffect(() => {
        // Set document title
        document.title = title;

        // Set meta description
        if (description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            } else {
                const meta = document.createElement('meta');
                meta.name = 'description';
                meta.content = description;
                document.head.appendChild(meta);
            }
        }

        // Set robots
        const metaRobots = document.querySelector('meta[name="robots"]');
        if (metaRobots) {
            metaRobots.setAttribute('content', robots);
        } else {
            const meta = document.createElement('meta');
            meta.name = 'robots';
            meta.content = robots;
            document.head.appendChild(meta);
        }
    }, [title, description, robots]);

    return null;
}