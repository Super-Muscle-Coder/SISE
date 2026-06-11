/**
 * @file main.tsx
 * @description Công dụng: Khởi động app, import CSS toàn cục, render App vào root
                Đây là nơi React bắt đầu, nếu app crash từ đầu thì sửa ở đây


    Trách nhiệm của main.tsx: Nó không phải page, mà là bootstrap file
    1.	Import CSS global - để tất cả page đều có styling
    2.	Import component root (App.tsx)
    3.	Render App vào <div id="root"></div> trong index.html
    4.	Setup React strict mode (phát hiện warning dev)
    Không phải page, mà là "setup file" hoặc "entry point"
 * @owner AG-04
 */

import React from 'react'
import ReactDOM from 'react-dom/client'

// ========================================================================
// GLOBAL STYLES & DESIGN SYSTEM - Import các tệp CSS toàn cục, bao gồm typography, resets và utilities để đảm bảo giao diện nhất quán trên toàn ứng dụng
// ========================================================================
import './styles/globals.css' // Global CSS (typography, resets, utilities)

// ========================================================================
// APP COMPONENTS - Import các thành phần chính của ứng dụng, bao gồm AppRouter và ScaffoldAppShell để thiết lập cấu trúc ứng dụng
// ========================================================================
import App from './App'

// ========================================================================
// RENDER APP
// ========================================================================
const rootElement = document.getElementById('root')  // Tiến hành render ứng dụng vào phần tử có id 'root' trong index.html


// Nếu không tìm thấy phần tử root, ném lỗi để tránh render vào một phần tử không tồn tại
if (!rootElement) { 
    throw new Error('Root element not found in index.html')
}


// Sử dụng React 18's createRoot API để render ứng dụng, bao bọc trong StrictMode để phát hiện các vấn đề tiềm ẩn
ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)