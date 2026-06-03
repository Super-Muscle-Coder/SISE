/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                canvas: '#FFFFFF',
                primary: {
                    text: '#111111',
                    accent: '#2563EB',
                },
                secondary: {
                    text: '#5F5F5F',
                    bg: '#EFEFEF',
                },
            },
            spacing: {
                gutter: '16px',
            },
            borderRadius: {
                card: '16px',
                pill: '32px',
            },
            transitionDuration: {
                smooth: '300ms',
            },
        },
    },
    plugins: [],
}