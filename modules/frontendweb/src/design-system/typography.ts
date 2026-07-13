/**
 * @file typography.ts
 * @layer design-system (Layer 0)
 * @description Typography tokens - font families, sizes, weights, line heights.
 *              ĐÂY LÀ NGUỒN SỰ THẬT DUY NHẤT (single source of truth) cho mọi
 *              giá trị typography trong toàn bộ dự án. styles/globals.css
 *              sinh CSS variable --text-* từ CHÍNH XÁC giá trị ở đây — không
 *              tự ý gõ tay giá trị khác ở globals.css.
 * Typography là nghệ thuật và kỹ thuật trình bày chữ viết. Nó bao gồm:
        Font family: loại phông chữ (ví dụ: Arial, Roboto, Times New Roman).
        Font size: kích thước chữ (ví dụ: 14px, 16px).
        Font weight: độ đậm/nhạt (ví dụ: normal, bold, 400, 700).
        Line height: khoảng cách giữa các dòng chữ.
        Letter spacing: khoảng cách giữa các ký tự.Typography là nghệ thuật và kỹ thuật trình bày chữ viết. Nó bao gồm:
        Font family: loại phông chữ (ví dụ: Arial, Roboto, Times New Roman).
        Font size: kích thước chữ (ví dụ: 14px, 16px).
        Font weight: độ đậm/nhạt (ví dụ: normal, bold, 400, 700).
        Line height: khoảng cách giữa các dòng chữ.
        Letter spacing: khoảng cách giữa các ký tự
 * 
 * @owner AG-04
 * @reference Figma typography scale
 */

export const TYPOGRAPHY = {
    /**
     * Font Families — Clean, modern sans-serif system
     */
    fontFamily: {
        base: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        mono: '"Fira Code", "Courier New", monospace',
    },

    /**
     * Heading Styles — Bold, distinctive, condensed tracking.
     * Bộ đầy đủ h1-h6 (trước đây chỉ có h1-h4, h5/h6 bị hardcode rời rạc
     * trong typography-base.css không qua token — đã sửa).
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
        h5: {
            fontSize: '1rem', // 16px
            fontWeight: '600',
            lineHeight: '1.5',
            letterSpacing: '0',
        },
        h6: {
            fontSize: '0.875rem', // 14px
            fontWeight: '600',
            lineHeight: '1.5',
            letterSpacing: '0',
        },
    },

    /**
     * Body Text Styles — Comfortable reading experience
     */
    body: {
        base: {
            fontSize: '1rem', // 16px
            fontWeight: '400',
            lineHeight: '1.6',
            letterSpacing: '0',
        },
        lg: {
            fontSize: '1.125rem', // 18px
            fontWeight: '400',
            lineHeight: '1.7',
            letterSpacing: '0',
        },
        sm: {
            fontSize: '0.875rem', // 14px
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
        },
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
        button: {
            fontSize: '1rem',
            fontWeight: '600',
            lineHeight: '1.4',
            letterSpacing: '0',
        },
        label: {
            fontSize: '0.875rem',
            fontWeight: '500',
            lineHeight: '1.4',
            letterSpacing: '0',
        },
        badge: {
            fontSize: '0.75rem',
            fontWeight: '600',
            lineHeight: '1',
            letterSpacing: '0.5px',
        },
    },
} as const;