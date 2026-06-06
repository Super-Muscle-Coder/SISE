/**
 * @file tailwind.config.ts
 * @description Tailwind CSS configuration for SISE frontend.
 *              Extends default theme with custom design tokens from design_tokens.ts.
 *              Maintains consistency with Pinterest design aesthetic (minimal, high-contrast).
 * @owner AG-04
 * @reference
 *   - src/configs/design_tokens.ts (design system values)
 *   - Tailwind CSS documentation (https://tailwindcss.com/docs/configuration)
 */

import type { Config } from 'tailwindcss'

const config: Config = {
    // ========================================================================
    // CONTENT PATHS
    // ========================================================================
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
        './src/components/**/*.{js,ts,jsx,tsx}',
        './src/routers/**/*.{js,ts,jsx,tsx}',
    ],

    // ========================================================================
    // THEME CUSTOMIZATION
    // ========================================================================
    theme: {
        extend: {
            // ====================================================================
            // COLOR PALETTE EXTENSION
            // ====================================================================
            colors: {
                // Brand colors
                pinterest: '#E60023', // Pinterest red
                // Extend default colors (merge with Tailwind defaults)
                zinc: {
                    900: '#000000', // Override for pure black
                    500: '#71717a', // Secondary text
                    400: '#a1a1aa', // Tertiary text
                },
            },

            // ====================================================================
            // TYPOGRAPHY EXTENSIONS
            // ====================================================================
            fontFamily: {
                // Base sans-serif (system fonts cascade)
                sans: [
                    'system-ui',
                    '-apple-system',
                    '"Segoe UI"',
                    'Roboto',
                    '"Helvetica Neue"',
                    'Arial',
                    'sans-serif',
                ],
                // Monospace for code
                mono: ['"Fira Code"', '"Courier New"', 'monospace'],
            },

            // Font sizes (extending/overriding defaults)
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }], // 12px
                sm: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }], // 14px
                base: ['1rem', { lineHeight: '1.6', letterSpacing: '0' }], // 16px
                lg: ['1.125rem', { lineHeight: '1.7', letterSpacing: '0' }], // 18px
                xl: ['1.25rem', { lineHeight: '1.4', letterSpacing: '0' }], // 20px
                '2xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0' }], // 24px
                '3xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }], // 30px
                '4xl': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 36px
            },

            // Font weights (explicit control)
            fontWeight: {
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
                extrabold: '800',
            },

            // ====================================================================
            // SPACING EXTENSIONS
            // ====================================================================
            spacing: {
                // Extend default spacing if needed
                // Tailwind already has excellent spacing scale
                0.75: '0.75rem', // 12px
            },

            // ====================================================================
            // BORDER RADIUS EXTENSIONS
            // ====================================================================
            borderRadius: {
                // Add Pinterest-style rounding
                xs: '0.25rem', // 4px
                sm: '0.5rem', // 8px
                md: '0.75rem', // 12px
                lg: '1rem', // 16px
                xl: '1.5rem', // 24px (card default)
                '2xl': '2rem', // 32px
            },

            // ====================================================================
            // SHADOW EXTENSIONS (Subtle, minimal shadows)
            // ====================================================================
            boxShadow: {
                // Extra subtle
                xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                // Default (cards)
                sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                // Base
                DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                // Medium (modals, dropdowns)
                md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                // Large (prominent overlays)
                lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                // Extra large (full-screen)
                xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },

            // ====================================================================
            // TRANSITION EXTENSIONS
            // ====================================================================
            transitionDuration: {
                150: '150ms', // Fast
                300: '300ms', // Base
                500: '500ms', // Slow
                700: '700ms', // Slower
            },

            transitionTimingFunction: {
                'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
                'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
                'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
            },

            // ====================================================================
            // Z-INDEX EXTENSIONS
            // ====================================================================
            zIndex: {
                0: '0',
                10: '10', // Floating
                20: '20', // Dropdown
                30: '30', // Modal backdrop
                40: '40', // Modal
                50: '50', // Toast
            },

            // ====================================================================
            // COLUMNS (Masonry Grid)
            // ====================================================================
            columns: {
                2: '2',
                3: '3',
                4: '4',
                5: '5',
            },

            // ====================================================================
            // GRADIENT UTILITIES (Image overlay gradients)
            // ====================================================================
            backgroundImage: {
                // Gradient overlays for card images
                'gradient-card': 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                'gradient-card-hover': 'linear-gradient(135deg, rgba(230,0,35,0.1) 0%, transparent 100%)',
            },

            // ====================================================================
            // CUSTOM ANIMATIONS
            // ====================================================================
            animation: {
                // Fade in animation
                'fade-in': 'fadeIn 300ms ease-in-out',
                // Pulse animation (for loading states)
                'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
            },

            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                pulseSubtle: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
            },

            // ====================================================================
            // ASPECT RATIO EXTENSIONS (Image cards)
            // ====================================================================
            aspectRatio: {
                // Auto (preserve original aspect ratio for masonry)
                auto: 'auto',
                // Common photo ratios
                square: '1 / 1',
                video: '16 / 9',
                portrait: '3 / 4',
            },
        },
    },

    // ========================================================================
    // PLUGINS
    // ========================================================================
    plugins: [
        // Tailwind forms plugin (if using form components)
        // require('@tailwindcss/forms'),

        // Custom plugin for group interactions
        // (already built into Tailwind v3+)
    ],

    // ========================================================================
    // DARK MODE (disabled for this design system)
    // ========================================================================
    darkMode: false, // Pinterest aesthetic is light-mode focused

    // ========================================================================
    // COREPLUGINS (disable unused plugins to reduce bundle size)
    // ========================================================================
    corePlugins: {
        // Disable plugins not used in this design system
        // 'skew': false,
        // 'filter': false,
    },
}

export default config