/**
 * @file spacing.ts
 * @layer design-system (Layer 0)
 * @description Spacing tokens - padding, margin, gaps
 * Aligns with Tailwind spacing scale for consistency
 * @owner AG-04
 */

export const SPACING = {
    // xs: 0.25rem (4px)
    xs: '0.25rem',
    // sm: 0.5rem (8px)
    sm: '0.5rem',
    // md: 0.75rem (12px)
    md: '0.75rem',
    // base: 1rem (16px) - DEFAULT
    base: '1rem',
    // lg: 1.5rem (24px)
    lg: '1.5rem',
    // xl: 2rem (32px)
    xl: '2rem',
    // 2xl: 2.5rem (40px)
    '2xl': '2.5rem',
    // 3xl: 3rem (48px)
    '3xl': '3rem',
    // 4xl: 3.5rem (56px)
    '4xl': '3.5rem',
    // 5xl: 4rem (64px)
    '5xl': '4rem',
    // 6xl: 8.75rem (140px) 
    '6xl': '8.75rem',
} as const;