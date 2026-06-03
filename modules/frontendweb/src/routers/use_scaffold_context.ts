import { useContext } from 'react'
import type { ScaffoldContextState } from '../entities/scaffold_entities'
import { ScaffoldContext } from './scaffold_routers'

export const useScaffoldContext = (): ScaffoldContextState => {
    const context = useContext(ScaffoldContext)
    if (!context) {
        throw new Error('useScaffoldContext must be used within ScaffoldContextProvider')
    }
    return context
}
