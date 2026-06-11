/**
 * @file Logo.tsx
 * @layer components (Layer 2)
 * @description Logo component - displays SISE branding
 * Supports both text-based and image-based logos
 * @owner AG-04
 * 
 * Usage (Text-based - default):
 * <Logo size="md" showText={true} />
 * 
 * Usage (Image-based):
 * <Logo imageUrl="/images/logo.png" alt="SISE Logo" size="md" />
 */

import React, { useState } from 'react';

interface LogoProps {
    /** Image URL for logo - if provided, displays image instead of text */
    imageUrl?: string;
    /** Alt text for image */
    alt?: string;
    /** Size of logo */
    size?: 'sm' | 'md' | 'lg';
    /** Show text label (only for text-based logo) */
    showText?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Logo dimensions (width x height) */
    width?: number;
    height?: number;
}

/**
 * Logo: SISE brand logo
 * 
 * Modes:
 * 1. Text-based (default): Shows emoji + text "SISE"
 * 2. Image-based: Shows custom logo image
 * 
 * Features:
 * - Multiple sizes
 * - Responsive styling
 * - Optional text label
 * - Fallback to text if image fails to load
 */
export function Logo({
    imageUrl,
    alt = 'SISE Logo',
    size = 'md',
    showText = true,
    className = '',
    width,
    height,
}: LogoProps): React.ReactElement {
    const [imageError, setImageError] = useState(false);

    /**
     * Size presets for text-based logo
     */
    const sizeMap = {
        sm: { text: 'text-lg', icon: 'text-xl', containerGap: 'gap-1.5' },
        md: { text: 'text-2xl', icon: 'text-3xl', containerGap: 'gap-2' },
        lg: { text: 'text-3xl', icon: 'text-4xl', containerGap: 'gap-2.5' },
    };

    /**
     * Image size presets
     */
    const imageSizeMap = {
        sm: { width: 32, height: 32 },
        md: { width: 48, height: 48 },
        lg: { width: 64, height: 64 },
    };

    const sizes = sizeMap[size];
    const imageSizes = imageSizeMap[size];

    /**
     * If imageUrl is provided AND image loads successfully, render image-based logo
     */
    if (imageUrl && !imageError) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <img
                    src={imageUrl}
                    alt={alt}
                    width={width || imageSizes.width}
                    height={height || imageSizes.height}
                    className="object-contain"
                    onError={() => {
                        console.warn(`Logo image failed to load: ${imageUrl}`);
                        setImageError(true);
                    }}
                />
                {showText && (
                    <span className={`${sizes.text} font-extrabold text-zinc-900`}>
                        SISE
                    </span>
                )}
            </div>
        );
    }

    /**
     * Fallback: Text-based logo with emoji
     * (Either imageUrl not provided, or image failed to load)
     */
    return (
        <div className={`flex items-center ${sizes.containerGap} ${className}`}>
            {/* Logo Icon */}
            <div className={`${sizes.icon} font-bold text-red-600`}>
                🖼️
            </div>

            {/* Logo Text */}
            {showText && (
                <span className={`${sizes.text} font-extrabold text-zinc-900`}>
                    SISE
                </span>
            )}
        </div>
    );
}