/**
 * @file index.ts
 * @layer design-system (Layer 0)
 * @description SINGLE IMPORT POINT for all design system tokens
 * 
 * Usage in components:
 * import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, ANIMATIONS } from '@/design-system';
 * import type { ColorsType, TypographyType } from '@/design-system';
 * 
 * @owner AG-04
 */

// Direct named exports - design token constants
export { COLORS } from './colors';
export { TYPOGRAPHY } from './typography';
export { SPACING } from './spacing';
export { SHADOWS } from './shadows';
export { ANIMATIONS } from './animations';

// Combined tokens object for convenient grouped access
export { ALL_TOKENS } from './tokens';

// Type exports for TypeScript type checking
export type { ColorsType, TypographyType, SpacingType, ShadowsType, AnimationsType } from './tokens';