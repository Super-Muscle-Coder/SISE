/**
 * @file scaffold_routers.tsx
 * @layer routers
 * @description Global app shell with context provider, error boundary, and session management.
 *              FIX 1.4: Added cross-tab synchronization via 'storage' event listener.
 *              Listens for token changes in localStorage across browser tabs and dispatches logout event.
 * @owner AG-04
 */

import React, { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useScaffoldService } from '../services/scaffold_services'
import type { ScaffoldContextState } from '../entities/scaffold_entities'
import { AUTH_CONFIG } from '../configs/auth_config'

export const ScaffoldContext = createContext<ScaffoldContextState | undefined>(
    undefined
)

// Hook exported in separate file to satisfy react-refresh rules
// Import via: import { useScaffoldContext } from '../routers/use_scaffold_context'
export const useScaffoldContextHelper = (): ScaffoldContextState => {
    const context = useContext(ScaffoldContext)
    if (!context) {
        throw new Error('useScaffoldContext must be used within ScaffoldContextProvider')
    }
    return context
}

interface ScaffoldContextProviderProps {
    children: ReactNode
}

export const ScaffoldContextProvider: React.FC<
    ScaffoldContextProviderProps
> = ({ children }) => {
    const scaffoldState = useScaffoldService()
    const [sessionExpired, setSessionExpired] = React.useState(false)

    React.useEffect(() => {
        const handleSessionExpired = (event: Event) => {
            const customEvent = event as CustomEvent
            console.warn('Session expired:', customEvent.detail?.reason)
            setSessionExpired(true)
        }

        window.addEventListener('sessionExpired', handleSessionExpired)
        return () => window.removeEventListener('sessionExpired', handleSessionExpired)
    }, [])

    /**
     * FIX 1.4: Cross-Tab Synchronization
     * Listen to localStorage changes from other tabs (e.g., Tab A logs out).
     * When token is removed, dispatch logout event to clear UI in this tab.
     */
    React.useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            // Check if the auth token was removed in another tab
            if (e.key === AUTH_CONFIG.storage.tokenKey) {
                if (e.newValue === null || e.newValue === '') {
                    // Token was cleared - likely logout in another tab
                    console.info('[Cross-Tab] Token cleared. Syncing session end.')
                    const event = new CustomEvent(AUTH_CONFIG.events.sessionEnded, {
                        detail: { reason: 'token_cleared_in_another_tab' },
                    })
                    window.dispatchEvent(event)
                    setSessionExpired(true)
                } else if (e.newValue !== e.oldValue) {
                    // Token changed - might be new login in another tab
                    console.info('[Cross-Tab] Token changed. Syncing session start.')
                    const event = new CustomEvent(AUTH_CONFIG.events.sessionStarted, {
                        detail: { reason: 'token_updated_in_another_tab' },
                    })
                    window.dispatchEvent(event)
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    if (sessionExpired) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">Session Expired</h1>
                    <p className="mt-4 text-gray-600">Your session has expired. Please log in again.</p>
                    <button
                        onClick={() => {
                            window.location.href = '/login'
                        }}
                        className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-white transition-all duration-300 hover:scale-105"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        )
    }

    return (
        <ScaffoldContext.Provider value={scaffoldState}>
            {children}
        </ScaffoldContext.Provider>
    )
}

export const ScaffoldErrorBoundary: React.FC<{
    children: ReactNode
}> = ({ children }) => {
    const [hasError, setHasError] = React.useState(false)

    React.useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error('Global error caught:', event.error)
            setHasError(true)
        }

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            console.error('Unhandled promise rejection:', event.reason)
            setHasError(true)
        }

        window.addEventListener('error', handleError)
        window.addEventListener('unhandledrejection', handleUnhandledRejection)
        return () => {
            window.removeEventListener('error', handleError)
            window.removeEventListener('unhandledrejection', handleUnhandledRejection)
        }
    }, [])

    if (hasError) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900">
                        Something went wrong
                    </h1>
                    <p className="mt-4 text-gray-600">
                        Please refresh the page to try again.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-white transition-all duration-300 hover:scale-105"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}

export const ScaffoldAppShell: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    return (
        <div className="flex min-h-screen w-full flex-col bg-white">
            <header className="border-b border-gray-200 bg-white px-6 py-4">
                <nav className="mx-auto max-w-7xl flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">SISE</h1>
                    <div className="flex gap-4">
                        {/* Placeholder for nav items */}
                    </div>
                </nav>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <p className="text-center text-sm text-gray-600">
                    © 2026 Smart Image Search Engine. All rights reserved.
                </p>
            </footer>
        </div>
    )
}
