/**
 * @file animations.ts
 * @layer design-system (Layer 0)
 * @description Animation & transition timing tokens.
 *              ĐÂY LÀ NGUỒN SỰ THẬT DUY NHẤT cho duration/easing/transitions.
 *              @keyframes thật (CSS) định nghĩa ở styles/animations.css —
 *              tên keyframe ở đây PHẢI khớp tên @keyframes bên đó.
 * 
 * Animation tokens là gì?
        Duration: thời gian chạy hiệu ứng (ví dụ: nhanh 150ms, bình thường 300ms, chậm 500ms).
        Easing: cách hiệu ứng thay đổi tốc độ theo thời gian (linear, ease-in, ease-out, ease-in-out). Đây thường là các hàm cubic-bezier.
        Keyframes: tên các hoạt ảnh được định nghĩa trong CSS (@keyframes). File này chỉ liệt kê tên để tham chiếu, còn nội dung chi tiết nằm ở styles/animations.css.Animation tokens là gì?
        Duration: thời gian chạy hiệu ứng (ví dụ: nhanh 150ms, bình thường 300ms, chậm 500ms).
        Easing: cách hiệu ứng thay đổi tốc độ theo thời gian (linear, ease-in, ease-out, ease-in-out). Đây thường là các hàm cubic-bezier.
        Keyframes: tên các hoạt ảnh được định nghĩa trong CSS (@keyframes). File này chỉ liệt kê tên để tham chiếu, còn nội dung chi tiết nằm ở styles/animations.css.
 * @owner AG-04
 */

export const ANIMATIONS = {
    /**
     * Transition Durations (milliseconds)
     */
    duration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
    },

    /**
     * Easing Functions — Cubic Bezier curves
     */
    easing: {
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },

    /**
     * Keyframe Animation Definitions — tham chiếu, giá trị thật nằm ở
     * styles/animations.css. Danh sách tên PHẢI khớp 1-1 với @keyframes bên đó.
     *
     * SỬA: trước đây `slideInUp` bị định nghĩa 2 lần khác nhau trong
     * animations.css (bản 10px dùng chung, bản 250px dành riêng Footer AOS)
     * — CSS âm thầm lấy định nghĩa sau cùng, khiến mọi nơi dùng
     * .animate-slide-in-up vô tình chạy hiệu ứng 250px sai. Đã tách tên:
     * `slideInUp` (chuẩn, 10px, dùng chung) và `footerRevealUp` (250px,
     * chỉ Footer.tsx dùng qua class riêng .animate-footer-reveal).
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
        footerRevealUp: {
            '0%': { transform: 'translateY(250px)', opacity: '0' },
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
     */
    transitions: {
        smooth: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        colors: 'color 300ms cubic-bezier(0.4, 0, 0.2, 1), background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
} as const;

/**
 * Animation configuration cho hiệu ứng AOS-like của Footer (reveal khi cuộn
 * tới). SỬA: đổi tên keyframe theo footerRevealUp (xem lý do ở trên).
 */
export const AnimationConfig = {
    footerReveal: {
        duration: '600ms',
        easing: 'ease-out',
        keyframe: 'footerRevealUp',
    },
    footerRevealDelayed: (delayMs: number) => ({
        duration: '600ms',
        easing: 'ease-out',
        animation: `footerRevealUp 600ms ease-out ${delayMs}ms forwards`,
        visibility: 'hidden', // Default hidden, hiện ra khi animation chạy
    }),
};