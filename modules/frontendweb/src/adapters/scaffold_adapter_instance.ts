/**
 * @file scaffold_adapter_instance.ts
 * @layer adapters
 * @description Singleton instance of ScaffoldAdapter for application-wide use.
 *              Initialized with API base URL from SCAFFOLD_CONFIG.
 * @owner AG-04
 */

import { ScaffoldAdapter } from './scaffold_adapters'
import { SCAFFOLD_CONFIG } from '../configs/scaffold_configs'

/**
 * Global Axios Adapter Instance
 * Used by all services, components, and hooks for HTTP communication.
 * Configuration sourced from SCAFFOLD_CONFIG (env-driven, no hardcoding).
 */
export const scaffoldAdapter = new ScaffoldAdapter(SCAFFOLD_CONFIG.API.baseUrl)