/**
 * @file Logo.tsx
 * @layer components (Layer 2)
 * @description Logo component - displays SISE branding
 * Supports both text-based and image-based logos
 * Uses CSS variables from Layer 1 (globals.css)
 * @owner AG-04
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
 * Modes:
 * 1. Text-based (default): Shows emoji + text "SISE"
 * 2. Image-based: Shows custom logo image
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

    // Size presets
    const sizeMap = {
        sm: { 
            icon: 'text-xl', 
            text: 'text-lg', 
            containerGap: 'gap-1.5'
        },
        md: { 
            icon: 'text-3xl', 
            text: 'text-2xl', 
            containerGap: 'gap-2'
        },
        lg: { 
            icon: 'text-4xl', 
            text: 'text-3xl', 
            containerGap: 'gap-2.5'
        },
    };

    // Image size presets - RIÊNG BIỆT
    const imageSizeMap = {
        sm: { width: 32, height: 32 },
        md: { width: 48, height: 48 },
        lg: { width: 64, height: 64 },
    };

    const sizes = sizeMap[size];
    const imageSizes = imageSizeMap[size];  // ✅ FIX: Lấy từ imageSizeMap

    // If imageUrl provided and loads successfully, render image-based logo
    if (imageUrl && !imageError) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <img
                    src={imageUrl}
                    alt={alt}
                    width={width || imageSizes.width}
                    height={height || imageSizes.height}
                    className="object-contain"
                    style={{ maxHeight: '60px' }}  // ✅ Thêm max-height để limit kích thước
                    onError={() => {
                        console.warn(`Logo image failed to load: ${imageUrl}`);
                        setImageError(true);
                    }}
                />
                {showText && (
                    <span 
                        className={`${sizes.text} font-extrabold`}
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        SISE
                    </span>
                )}
            </div>
        );
    }

    // Fallback: Text-based logo with emoji
    return (
        <div className={`flex items-center ${sizes.containerGap} ${className}`}>
            <div 
                className={sizes.icon}
                style={{ 
                    color: 'var(--color-brand-primary)',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                🖼️
            </div>

            {showText && (
                <span 
                    className={`${sizes.text} font-extrabold`}
                    style={{ color: 'var(--color-text-primary)' }}
                >
                    SISE
                </span>
            )}
        </div>
    );
}