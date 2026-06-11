/**
 * @file typography.ts
 * @layer design-system (Layer 0)
 * @description Typography tokens - font families, sizes, weights, line heights
 * @owner AG-04
 * @reference Figma typography scale
 */

export const TYPOGRAPHY = {
    /**
     * Font Families — Clean, modern sans-serif system
     * Cascade: System fonts → Google Web Fonts → fallback
     */
    fontFamily: {
        // Base system font (Apple San Francisco, system defaults)
        base: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        // Monospace for code, technical content
        mono: '"Fira Code", "Courier New", monospace',
    },

    /**
     * Heading Styles — Bold, distinctive, condensed tracking
     */
    heading: {
        h1: {
            fontSize: '2.25rem', // 36px
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '1.875rem', // 30px
            fontWeight: '700',
            lineHeight: '1.2',
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '1.5rem', // 24px
            fontWeight: '700',
            lineHeight: '1.3',
            letterSpacing: '0',
        },
        h4: {
            fontSize: '1.25rem', // 20px
            fontWeight: '600',
            lineHeight: '1.4',
            letterSpacing: '0',
        },
    },

    /**
     * Body Text Styles — Comfortable reading experience
     */
    body: {
        // Primary body text (main content)
        base: {
            fontSize: '1rem', // 16px
            fontWeight: '400',
            lineHeight: '1.6',
            letterSpacing: '0',
        },
        // Slightly larger body text (important content)
        lg: {
            fontSize: '1.125rem', // 18px
            fontWeight: '400',
            lineHeight: '1.7',
            letterSpacing: '0',
        },
        // Smaller body text (secondary information)
        sm: {
            fontSize: '0.875rem', // 14px
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
        },
        // Extra small (metadata, hints)
        xs: {
            fontSize: '0.75rem', // 12px
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0.01em',
        },
    },

    /**
     * UI Text Styles — For labels, buttons, badges
     */
    ui: {
        // Button text (medium emphasis)
        button: {
            fontSize: '1rem',
            fontWeight: '600',
            lineHeight: '1.4',
            letterSpacing: '0',
        },
        // Label text (form labels, field names)
        label: {
            fontSize: '0.875rem',
            fontWeight: '500',
            lineHeight: '1.4',
            letterSpacing: '0',
        },
        // Badge/tag text (compact labeling)
        badge: {
            fontSize: '0.75rem',
            fontWeight: '600',
            lineHeight: '1',
            letterSpacing: '0.5px',
        },
    },
} as const;