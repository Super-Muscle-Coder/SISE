/**
 * @file index.ts
 * @layer components (Layer 3)
 * @description Central export point for all components.
 *              SỬA: thêm export * from './header' — LandingHeader mới tách
 *              từ page-layouts/landing-layout/LandingLayout.tsx (trước đây
 *              header nằm lẫn trong layout, nay là component độc lập ngang
 *              hàng Footer).
 * @owner AG-04
 */

export * from './common';
export * from './auth';
export * from './footer';
export * from './nav';
export * from './header';