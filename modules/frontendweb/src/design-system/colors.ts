/**
 * @file colors.ts
 * @layer design-system (Layer 0)
 * @description Color tokens following Pinterest aesthetic - minimal & high-contrast
 * @owner AG-04
 * @reference Figma design tokens
 */

export const COLORS = {
    /**
     * Background Colors — Vast, clean whitespace as foundation
     */
    background: {
        // Primary surface (page/app background)
        primary: '#ffffff',
        // Secondary surfaces (cards, modals, containers)
        secondary: '#f9f9f9',
        // Tertiary (hover states, subtle backgrounds)
        tertiary: '#f4f4f5',
        // Neutral (disabled states, inactive elements)
        neutral: '#fafafa',
    },

    /**
     * Text Colors — High contrast for readability
     */
    text: {
        // Primary text (headings, body copy)
        primary: '#000000',
        // Secondary text (descriptions, metadata, captions)
        secondary: '#71717a',
        // Tertiary text (hints, disabled text)
        tertiary: '#a1a1aa',
        // Inverted text (on dark backgrounds)
        inverted: '#ffffff',
    },

    /**
     * Brand Colors — Strategic color for emphasis and calls-to-action
     */
    brand: {
        // Pinterest signature red
        primary: '#E60023',
        // Alternative brand color (deep black for premium feel)
        secondary: '#000000',
    },

    /**
     * Semantic Colors — Purpose-driven color usage
     */
    semantic: {
        // Success state (e.g., upload complete, search found results)
        success: '#10b981',
        // Warning state (e.g., presigned URL expiring soon)
        warning: '#f59e0b',
        // Error state (e.g., upload failed, 401 unauthorized)
        error: '#ef4444',
        // Info state (e.g., evaluation running)
        info: '#3b82f6',
    },

    /**
     * Border & Divider Colors — Subtle structural elements
     */
    border: {
        // Light border for cards, inputs
        light: '#e4e4e7',
        // Medium border for emphasis
        medium: '#d4d4d8',
        // Dark border for contrast
        dark: '#71717a',
    },

    /**
     * Overlay & Backdrop Colors — Semi-transparent layers
     */
    overlay: {
        // Black overlay for contrast (e.g., on image cards)
        black: 'rgba(0, 0, 0, 0.6)',
        // White overlay for lightening (e.g., hover states)
        white: 'rgba(255, 255, 255, 0.1)',
    },
} as const;