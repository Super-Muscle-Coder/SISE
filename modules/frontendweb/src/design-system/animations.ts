/**
 * @file animations.ts
 * @layer design-system (Layer 0)
 * @description Animation & transition timing tokens
 * Smooth, purposeful animations following Pinterest aesthetic
 * @owner AG-04
 */

export const ANIMATIONS = {
    /**
     * Transition Durations (milliseconds)
     * Scale: fast (150ms) → normal (300ms) → slow (500ms)
     */
    duration: {
        // Fast: UI feedback, micro-interactions
        fast: '150ms',
        // Normal: Most interactions (default)
        normal: '300ms',
        // Slow: Important state changes, modals
        slow: '500ms',
    },

    /**
     * Easing Functions — Cubic Bezier curves
     * Standard bezier timing for smooth motion
     */
    easing: {
        // Linear: Constant speed (rarely used)
        linear: 'linear',
        // Ease in: Starts slow, accelerates (enter animations)
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        // Ease out: Decelerates (exit animations)
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        // Ease in-out: Slow start & end (smooth interactions)
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    /**
     * Keyframe Animation Definitions
     * Use in CSS @keyframes or animate-* utilities
     */
    keyframes: {
        fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
        },
        fadeOut: {
            '0%': { opacity: '1' },
            '100%': { opacity: '0' },
        },
        slideInUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInUpImproved: {
            '0%': { transform: 'translateY(20px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
            '0%': { transform: 'translateY(-10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
            '0%': { transform: 'translateX(-10px)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
            '0%': { transform: 'translateX(10px)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
            '0%': { transform: 'scale(0.95)', opacity: '0' },
            '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulse: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0.5' },
        },
    },

    /**
     * Common Transition Shortcuts
     * Use: `style={{ transition: ANIMATIONS.transitions.smooth }}`
     */
    transitions: {
        // Smooth transition for all properties
        smooth: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        // Fast transition
        fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        // Slow transition
        slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        // Color only (e.g., hover states)
        colors: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        // Transform only (e.g., scale, translate)
        transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
} as const;

/**
 * Animation configurations for improved AOS-like effects
 */
export const AnimationConfig = {
    slideInUp: {
        duration: '600ms',
        easing: 'ease-out',
        keyframe: 'slideInUpImproved', // ✅ Dùng keyframe mới
    },
    slideInUpDelayed: (delayMs: number) => ({
        duration: '600ms',
        easing: 'ease-out',
        animation: `slideInUpImproved 600ms ease-out ${delayMs}ms forwards`,
        visibility: 'hidden', // ✅ Default hidden
    }),
};

