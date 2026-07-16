/**
 * @file search_routers.ts
 * @layer routers
 * @description Search router layer (0% JSX), thin wrapper for search services.
 * @owner AG-04
 */

import { useSearch } from '../services/search_services'

export function useSearchController() {
    return useSearch()
}