/**
 * @file shadows.ts
 * @layer design-system (Layer 0)
 * @description Box shadow tokens - subtle and purposeful
 * Pinterest aesthetic: minimal shadows, strategic depth
 * @owner AG-04
 */

export const SHADOWS = {
    // None - for flat, borderless elements
    none: 'none',

    // sm: Subtle shadow for inputs, small buttons
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

    // md: Medium shadow for cards, default elements
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

    // lg: Large shadow for modals, floating panels
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

    // xl: Extra large shadow for hero sections, prominent overlays
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

    // 2xl: Maximum shadow for emphasis
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

    // inner: Inset shadow for depth (e.g., sunken buttons)
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
} as const;