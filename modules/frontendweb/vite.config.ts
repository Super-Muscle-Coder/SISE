import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
/*
•	vite.config.ts nằm ở root modules/frontendweb/ vì nó là global config cho toàn module
•	Nó không phải "đăng kí", mà là cấu hình
•	Mọi lệnh npm run dev | build | preview đều dùng config này
Khi nào sửa vite.config.ts?
•	 Thêm import alias mới (vd: @/components)
•	 Thay đổi dev/preview port
•	 Thêm plugin mới (vd: SVG loader)
•	 Thay đổi build output
•	 Không thường xuyên sửa
*/
export default defineConfig({
  // ========== 1. PLUGINS ==========
  plugins: [react()],           // ← Dùng React plugin để build .tsx/.jsx
  
  // ========== 2. RESOLVE (Import aliases) ==========
  resolve: { 
    alias: {
      '@/utils': path.resolve(__dirname, './utils'),
      '@': path.resolve(__dirname, './src'),     // ← Dùng @ thay vì ../../../src
    },
  },
  
  // ========== 3. DEV SERVER ========== 
  server: {
    port: 5173,                 // ← npm run dev chạy trên port 5173
    strictPort: false,          // ← Nếu port bận, dùng port khác
    open: true,                 // ← Tự động mở browser
  },
  
  // ========== 4. PREVIEW SERVER ==========
  preview: {
    port: 4173,                 // ← npm run preview chạy trên port 4173
    strictPort: false,
    open: true,
  },
  
  // ========== 5. BUILD ==========
  build: {
    target: 'ES2020',           // ← Compile sang JavaScript ES2020
    outDir: 'dist',             // ← Output folder
    minify: 'terser',           // ← Minify JS
    // SỬA (lần 2): 'esbuild' làm cssMinify BÁO LỖI "Cannot find package
    // esbuild" — bản vite v8.1.5 này không có sẵn esbuild trong
    // node_modules (đang chuyển dần sang rolldown/oxc theo các warning
    // build). Thay vì cài thêm gói giữa giai đoạn nước rút, tắt hẳn
    // minify CSS (false) — build sẽ chạy được ngay, chỉ đánh đổi file
    // CSS output lớn hơn 1 chút (không ảnh hưởng tính đúng đắn/tốc độ
    // chạy của app, chỉ ảnh hưởng dung lượng tải xuống — chấp nhận được
    // cho mục đích demo/bảo vệ đồ án).
    cssMinify: false,
  },
})