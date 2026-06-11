/**
 * @file tokens.ts
 * @layer design-system (Layer 0)
 * @description Main design tokens aggregator - combines all token categories
 * This is the unified export point for all design system tokens
 * @owner AG-04
 */

import { COLORS } from './colors';
import { TYPOGRAPHY } from './typography';
import { SPACING } from './spacing';
import { SHADOWS } from './shadows';
import { ANIMATIONS } from './animations';

/**
 * Combined tokens object for convenient access
 * Usage: import { ALL_TOKENS } from '@/design-system';
 * 
 * Then access like:
 * ALL_TOKENS.colors.background.primary
 * ALL_TOKENS.typography.heading.h1
 */
export const ALL_TOKENS = {
    colors: COLORS,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    shadows: SHADOWS,
    animations: ANIMATIONS,
} as const;

// Type exports for TypeScript type checking
export type ColorsType = typeof COLORS;
export type TypographyType = typeof TYPOGRAPHY;
export type SpacingType = typeof SPACING;
export type ShadowsType = typeof SHADOWS;
export type AnimationsType = typeof ANIMATIONS;