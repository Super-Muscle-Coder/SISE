/**
 * @file postcss.config.mjs
 * @description PostCSS configuration for processing Tailwind CSS.
 *              Compiles Tailwind utilities into final CSS during build process.
 * @owner AG-04
 */

import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: {
    tailwindcss: {}, // Process Tailwind utilities
    autoprefixer: {}, // Add vendor prefixes (Safari, Firefox compatibility)
  },
}
