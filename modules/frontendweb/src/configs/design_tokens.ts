/**
 * @file design_tokens.ts
 * @layer configs
 * @description Centralized design system tokens following Pinterest aesthetic.
 *              All design decisions (colors, typography, spacing, shadows, animations)
 *              are defined here as single source of truth.
 *              UI components import these tokens instead of hardcoding Tailwind classes.
 * @owner AG-04
 * @reference
 *   - Pinterest Design System (minimalist, high contrast, masonry layout)
 *   - Tailwind CSS configuration
 *   - Figma Design tokens best practices
 * @philosophy
 *   Clean, minimal aesthetic with strategic use of color for emphasis.
 *   Prioritize whitespace and breathing room. Shadows are subtle and purposeful.
 *   Typography is bold and distinctive. Interactions are smooth and responsive.
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const COLORS = {
    /**
     * Background Colors — Vast, clean whitespace as foundation
     */
    background: {
        // Primary surface (page/app background)
        primary: '#ffffff', // bg-white
        // Secondary surfaces (cards, modals, containers)
        secondary: '#f9f9f9', // Slightly off-white for subtle depth
        // Tertiary (hover states, subtle backgrounds)
        tertiary: '#f4f4f5', // bg-zinc-100
        // Neutral (disabled states, inactive elements)
        neutral: '#fafafa', // bg-neutral-50
    },

    /**
     * Text Colors — High contrast for readability
     */
    text: {
        // Primary text (headings, body copy)
        primary: '#000000', // text-zinc-900 (pure black)
        // Secondary text (descriptions, metadata, captions)
        secondary: '#71717a', // text-zinc-500
        // Tertiary text (hints, disabled text)
        tertiary: '#a1a1aa', // text-zinc-400
        // Inverted text (on dark backgrounds)
        inverted: '#ffffff', // text-white
    },

    /**
     * Brand Colors — Strategic color for emphasis and calls-to-action
     */
    brand: {
        // Pinterest signature red
        primary: '#E60023', // bg-red-600 (bold Pinterest red)
        // Alternative brand color (deep black for premium feel)
        secondary: '#000000', // bg-black
    },

    /**
     * Semantic Colors — Purpose-driven color usage
     */
    semantic: {
        // Success state (e.g., upload complete, search found results)
        success: '#10b981', // bg-emerald-500
        // Warning state (e.g., presigned URL expiring soon)
        warning: '#f59e0b', // bg-amber-500
        // Error state (e.g., upload failed, 401 unauthorized)
        error: '#ef4444', // bg-red-500
        // Info state (e.g., evaluation running)
        info: '#3b82f6', // bg-blue-500
    },

    /**
     * Border & Divider Colors — Subtle structural elements
     */
    border: {
        // Light border for cards, inputs
        light: '#e4e4e7', // border-zinc-200
        // Medium border for emphasis
        medium: '#d4d4d8', // border-zinc-300
        // Dark border for contrast
        dark: '#71717a', // border-zinc-500
    },

    /**
     * Overlay & Backdrop Colors — Semi-transparent layers
     */
    overlay: {
        // Black overlay for contrast (e.g., on image cards)
        black: 'rgba(0, 0, 0, 0.6)', // from-black/60
        // White overlay for lightening (e.g., hover states)
        white: 'rgba(255, 255, 255, 0.1)', // to-white/10
    },
} as const

// ============================================================================
// TYPOGRAPHY (FONT SYSTEM)
// ============================================================================

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
            fontSize: '2.25rem', // text-4xl
            fontWeight: '800', // font-extrabold
            lineHeight: '1.1', // tight
            letterSpacing: '-0.02em', // tracking-tight
        },
        h2: {
            fontSize: '1.875rem', // text-3xl
            fontWeight: '700', // font-bold
            lineHeight: '1.2',
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '1.5rem', // text-2xl
            fontWeight: '700', // font-bold
            lineHeight: '1.3',
            letterSpacing: '0',
        },
        h4: {
            fontSize: '1.25rem', // text-xl
            fontWeight: '600', // font-semibold
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
            fontSize: '1rem', // text-base
            fontWeight: '400', // font-normal
            lineHeight: '1.6', // comfortable reading
            letterSpacing: '0',
        },
        // Slightly larger body text (important content)
        lg: {
            fontSize: '1.125rem', // text-lg
            fontWeight: '400',
            lineHeight: '1.7',
            letterSpacing: '0',
        },
        // Smaller body text (secondary information)
        sm: {
            fontSize: '0.875rem', // text-sm
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
        },
        // Extra small (metadata, hints)
        xs: {
            fontSize: '0.75rem', // text-xs
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0.01em', // slight tracking for micro-text clarity
        },
    },

    /**
     * UI Text Styles — For labels, buttons, badges
     */
    ui: {
        // Button text (medium emphasis)
        button: {
            fontSize: '1rem',
            fontWeight: '600', // font-semibold
            lineHeight: '1.4',
            letterSpacing: '0',
        },
        // Label text (form labels, field names)
        label: {
            fontSize: '0.875rem', // text-sm
            fontWeight: '500', // font-medium
            lineHeight: '1.4',
            letterSpacing: '0',
        },
        // Badge/tag text (compact labeling)
        badge: {
            fontSize: '0.75rem', // text-xs
            fontWeight: '600', // font-semibold
            lineHeight: '1.2',
            letterSpacing: '0.05em', // tracking-wide for badges
        },
    },
} as const

// ============================================================================
// SPACING SYSTEM (Vertical Rhythm)
// ============================================================================

export const SPACING = {
    /**
     * Base unit: 4px (Tailwind default)
     * Scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px...
     */
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '0.75rem', // 12px
    base: '1rem', // 16px (default)
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem', // 48px
    '4xl': '4rem', // 64px

    /**
     * Global gaps for layouts (Masonry grid spacing)
     */
    gap: {
        // Compact layout (mobile)
        compact: '0.75rem', // md (12px)
        // Standard layout (tablet & desktop)
        standard: '1rem', // base (16px)
        // Spacious layout (large screens)
        spacious: '1.5rem', // lg (24px)
    },
} as const

// ============================================================================
// BORDER RADIUS (Roundness Scale)
// ============================================================================

export const BORDER_RADIUS = {
    /**
     * Subtle roundness — Soft, modern aesthetic
     */
    none: '0', // Sharp corners (rare)
    sm: '0.25rem', // 4px (very slight)
    base: '0.5rem', // 8px (default)
    md: '0.75rem', // 12px
    lg: '1rem', // 16px
    xl: '1.5rem', // 24px (card radius)
    '2xl': '2rem', // 32px (larger components)
    full: '9999px', // Pill-shaped buttons (border-full)
} as const

// ============================================================================
// SHADOWS (Depth & Elevation)
// ============================================================================

export const SHADOWS = {
    /**
     * Shadow scale — Subtle elevation without heaviness
     * Pinterest style: minimal shadows, primarily used for cards and modals
     */
    none: 'none',
    // Extra subtle (almost imperceptible)
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    // Subtle (default for cards)
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    // Base (for elevated cards, inputs)
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    // Medium (for modals, dropdowns)
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    // Large (for prominent overlays)
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    // Extra large (for full-screen modals)
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const

// ============================================================================
// TRANSITIONS & ANIMATIONS
// ============================================================================

export const TRANSITIONS = {
    /**
     * Duration presets — Feel responsive without being jarring
     */
    duration: {
        // Instant feedback (micro-interactions)
        fast: '150ms',
        // Standard transition (hover, field focus)
        base: '300ms',
        // Deliberate motion (modals, page transitions)
        slow: '500ms',
        // Extended animation (complex sequences)
        slower: '700ms',
    },

    /**
     * Easing functions — Smooth, natural motion
     */
    easing: {
        // Linear (constant speed)
        linear: 'linear',
        // Ease in (accelerates smoothly)
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        // Ease out (decelerates smoothly)
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        // Ease in-out (smooth at both ends)
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    /**
     * Combined transition strings for direct CSS use
     */
    default: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)', // Tailwind default easing
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const

// ============================================================================
// Z-INDEX SCALE (Stacking Context)
// ============================================================================

export const Z_INDEX = {
    /**
     * Hierarchical z-index values prevent stacking conflicts
     */
    // Default (no elevation)
    base: 0,
    // Floating elements (sticky headers, tooltips)
    floating: 10,
    // Dropdowns, popovers
    dropdown: 20,
    // Modal backgrounds
    modalBackdrop: 30,
    // Modal content (overlays backdrop)
    modal: 40,
    // Toast notifications (topmost)
    toast: 50,
    // Debugging (never used in production)
    debug: 999,
} as const

// ============================================================================
// BREAKPOINTS (Responsive Design)
// ============================================================================

export const BREAKPOINTS = {
    /**
     * Mobile-first breakpoints (matches Tailwind defaults)
     * Use in media queries: @media (min-width: ${BREAKPOINTS.md})
     */
    xs: '320px', // Extra small phones
    sm: '640px', // Small phones (~iPhone SE)
    md: '768px', // Tablets (~iPad)
    lg: '1024px', // Laptops (~1024px)
    xl: '1280px', // Desktops (~1280px)
    '2xl': '1536px', // Large desktops (~1536px+)
} as const

// ============================================================================
// MASONRY GRID CONFIGURATION
// ============================================================================

export const MASONRY = {
    /**
     * Column counts by breakpoint (mobile-first)
     * Used for masonry layout: columns-2 sm:columns-3 md:columns-4 lg:columns-5
     */
    columns: {
        mobile: 2, // 2 columns on mobile (xs)
        tablet: 3, // 3 columns on tablets (sm)
        laptop: 4, // 4 columns on laptops (md)
        desktop: 5, // 5 columns on large desktops (lg)
    },

    /**
     * Gap between items in masonry (consistent with SPACING)
     */
    gap: SPACING.gap.standard, // 1rem (16px)

    /**
     * Tailwind class string for masonry container
     * Apply to parent: className={MASONRY.containerClass}
     */
    containerClass: 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4',

    /**
     * Tailwind class string for masonry item (child)
     * Apply to child: className={MASONRY.itemClass}
     */
    itemClass: 'break-inside-avoid', // Prevent cards from being split across columns
} as const

// ============================================================================
// CARD MORPHOLOGY (Image Card Styling)
// ============================================================================

export const CARD = {
    /**
     * Base card container styling (for gallery/search result cards)
     */
    container: {
        borderRadius: BORDER_RADIUS.xl, // 1rem (16px)
        overflow: 'hidden', // Clip content to rounded corners
        backgroundColor: COLORS.background.secondary,
        shadow: SHADOWS.sm,
    },

    /**
     * Image overlay (gradient for text contrast)
     * Apply to overlay layer: className={CARD.overlayClass}
     */
    overlayClass: 'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent',

    /**
     * Card hover effect (group state for interactive elements)
     * Parent should use: className="group relative overflow-hidden rounded-2xl"
     * Children use: className="opacity-0 group-hover:opacity-100"
     */
    hoverTransition: {
        duration: TRANSITIONS.duration.base, // 300ms
        easing: TRANSITIONS.easing.inOut,
    },

    /**
     * Badge positioning (Confidence score, privacy level)
     * Apply to badge: className={CARD.badgeClass}
     */
    badgeClass:
        'absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 text-zinc-900 font-semibold text-xs',

    /**
     * Action button styling (hover state buttons)
     * Apply to button: className={CARD.actionButtonClass}
     */
    actionButtonClass:
        'px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all duration-300',
} as const

// ============================================================================
// BUTTON COMPONENT VARIANTS
// ============================================================================

export const BUTTON = {
    /**
     * Button base styles (shared across all variants)
     */
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BORDER_RADIUS.full, // Pill-shaped (9999px)
        fontWeight: '600', // font-semibold
        transition: TRANSITIONS.default,
        cursor: 'pointer',
        userSelect: 'none',
    },

    /**
     * Button size variants
     */
    size: {
        sm: {
            padding: `${SPACING.sm} ${SPACING.md}`, // 8px 12px
            fontSize: TYPOGRAPHY.ui.label.fontSize,
        },
        md: {
            padding: `${SPACING.md} ${SPACING.lg}`, // 12px 24px
            fontSize: TYPOGRAPHY.ui.button.fontSize,
        },
        lg: {
            padding: `${SPACING.base} ${SPACING.xl}`, // 16px 32px
            fontSize: TYPOGRAPHY.ui.button.fontSize,
        },
    },

    /**
     * Button color variants
     */
    variant: {
        // Primary brand button (Pinterest red)
        primary: {
            backgroundColor: COLORS.brand.primary, // #E60023
            color: COLORS.text.inverted,
            boxShadow: SHADOWS.sm,
            '&:hover': {
                backgroundColor: '#cc001f', // Slightly darker red
                boxShadow: SHADOWS.md,
            },
        },
        // Secondary button (black)
        secondary: {
            backgroundColor: COLORS.brand.secondary, // #000000
            color: COLORS.text.inverted,
            boxShadow: SHADOWS.sm,
            '&:hover': {
                backgroundColor: '#1a1a1a', // Slightly lighter black
                boxShadow: SHADOWS.md,
            },
        },
        // Ghost button (outline style, transparent background)
        ghost: {
            backgroundColor: 'transparent',
            color: COLORS.text.primary,
            border: `1px solid ${COLORS.border.light}`,
            '&:hover': {
                backgroundColor: COLORS.background.tertiary,
                borderColor: COLORS.border.medium,
            },
        },
    },
} as const

// ============================================================================
// INPUT COMPONENT STYLING
// ============================================================================

export const INPUT = {
    /**
     * Text input/textarea base styling
     */
    base: {
        width: '100%',
        padding: `${SPACING.md} ${SPACING.base}`, // 12px 16px
        borderRadius: BORDER_RADIUS.md,
        border: `1px solid ${COLORS.border.light}`,
        fontSize: TYPOGRAPHY.body.base.fontSize,
        lineHeight: TYPOGRAPHY.body.base.lineHeight,
        transition: TRANSITIONS.default,
        backgroundColor: COLORS.background.primary,
        color: COLORS.text.primary,
    },

    /**
     * Input focus state
     */
    focus: {
        outline: 'none',
        borderColor: COLORS.brand.primary,
        boxShadow: `0 0 0 3px ${COLORS.brand.primary}20`, // 20% alpha
    },

    /**
     * Input disabled state
     */
    disabled: {
        backgroundColor: COLORS.background.tertiary,
        color: COLORS.text.tertiary,
        cursor: 'not-allowed',
        opacity: '0.6',
    },

    /**
     * Input error state
     */
    error: {
        borderColor: COLORS.semantic.error,
        boxShadow: `0 0 0 3px ${COLORS.semantic.error}20`,
    },
} as const

// ============================================================================
// BADGE COMPONENT STYLING
// ============================================================================

export const BADGE = {
    /**
     * Badge base styling
     */
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: SPACING.md,
        paddingRight: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        fontSize: TYPOGRAPHY.ui.badge.fontSize,
        fontWeight: TYPOGRAPHY.ui.badge.fontWeight,
        transition: TRANSITIONS.fast,
    },

    /**
     * Badge variants (status indicators)
     */
    variant: {
        // Confidence score badge (on cards)
        confidence: {
            backgroundColor: COLORS.background.secondary,
            color: COLORS.text.primary,
            fontWeight: '600',
        },
        // Privacy level badge (Private/Friends/Public)
        privacy: {
            backgroundColor: COLORS.overlay.black,
            color: COLORS.text.inverted,
        },
        // Success state
        success: {
            backgroundColor: COLORS.semantic.success,
            color: COLORS.text.inverted,
        },
        // Warning state
        warning: {
            backgroundColor: COLORS.semantic.warning,
            color: COLORS.text.inverted,
        },
        // Error state
        error: {
            backgroundColor: COLORS.semantic.error,
            color: COLORS.text.inverted,
        },
    },
} as const

// ============================================================================
// EXPORT TYPE FOR COMPONENT USAGE
// ============================================================================

export type DesignTokens = {
    COLORS: typeof COLORS
    TYPOGRAPHY: typeof TYPOGRAPHY
    SPACING: typeof SPACING
    BORDER_RADIUS: typeof BORDER_RADIUS
    SHADOWS: typeof SHADOWS
    TRANSITIONS: typeof TRANSITIONS
    Z_INDEX: typeof Z_INDEX
    BREAKPOINTS: typeof BREAKPOINTS
    MASONRY: typeof MASONRY
    CARD: typeof CARD
    BUTTON: typeof BUTTON
    INPUT: typeof INPUT
    BADGE: typeof BADGE
}