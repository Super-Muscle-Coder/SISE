/**
 * @file main.tsx
 * @description React application entry point. Initializes app shell and context providers.
 * @owner AG-04
 */

import React from 'react'
import ReactDOM from 'react-dom/client'

// ========================================================================
// GLOBAL STYLES & DESIGN SYSTEM
// ========================================================================
import './styles/globals.css' // Global CSS (typography, resets, utilities)

// ========================================================================
// APP COMPONENTS
// ========================================================================
import App from './App'

// ========================================================================
// RENDER APP
// ========================================================================
const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Root element not found in index.html')
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)