/**
 * @file scaffold_routers.tsx
 * @layer routers
 * @description Global app shell with context provider, error boundary, and session management.
 * @owner AG-04
 */

import React, { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useScaffoldService } from '../services/scaffold_services'
import type { ScaffoldContextState } from '../entities/scaffold_entities'
import { AUTH_CONFIG } from '../configs/auth_configs'

export const ScaffoldContext = createContext<ScaffoldContextState | undefined>(
    undefined
)

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

    React.useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === AUTH_CONFIG.storage.tokenKey) {
                if (e.newValue === null || e.newValue === '') {
                    console.info('[Cross-Tab] Token cleared. Syncing session end.')
                    const event = new CustomEvent(AUTH_CONFIG.events.sessionEnded, {
                        detail: { reason: 'token_cleared_in_another_tab' },
                    })
                    window.dispatchEvent(event)
                    setSessionExpired(true)
                } else if (e.newValue !== e.oldValue) {
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

interface ScaffoldErrorBoundaryProps {
    children: ReactNode
}

interface ScaffoldErrorBoundaryState {
    hasError: boolean
    error?: Error
}

export class ScaffoldErrorBoundary extends React.Component<
    ScaffoldErrorBoundaryProps,
    ScaffoldErrorBoundaryState
> {
    constructor(props: ScaffoldErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): ScaffoldErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ScaffoldErrorBoundary caught error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-white">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-red-600">Something went wrong</h1>
                        <p className="mt-4 text-gray-600">{this.state.error?.message}</p>
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

        return this.props.children
    }
}

/**
 * ScaffoldAppShell: Main app shell wrapper
 * UPDATED: No longer renders global header - each page manages its own header
 * LandingPage has LandingLayout with sticky header
 * DashboardPage has DashboardLayout with its own header
 */
export function ScaffoldAppShell({ children }: { children: ReactNode }): React.ReactElement {
    return (
        <div className="scaffold-app-shell">
            {/* NO GLOBAL HEADER - Each page layout manages its own header */}
            {children}
        </div>
    )
}