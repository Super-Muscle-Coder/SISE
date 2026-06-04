/**
 * @file scaffold_adapter_instance.ts
 * @layer adapters
 * @description Singleton instance of ScaffoldAdapter for use throughout the app.
 * @owner AG-04
 */

import { ScaffoldAdapter } from './scaffold_adapters'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const scaffoldAdapter = new ScaffoldAdapter(baseURL)
