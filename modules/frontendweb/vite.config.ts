import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@/utils': path.resolve(__dirname, './utils'),
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        strictPort: false,
        open: true,
    },
    preview: {
        port: 4173,
        strictPort: false,
        open: true,
    },
    build: {
        target: 'ES2020',
        outDir: 'dist',
        minify: 'terser',
    },
})