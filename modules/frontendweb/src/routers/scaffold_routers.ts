/**
 * @file scaffold_routers.ts
 * @layer routers
 * @description Global composition root with context provider, error boundary, app routes, and session navigation.
 *              0% JSX in routers layer (React.createElement only).
 * @owner AG-04
 */

import React, { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useScaffoldService } from '../services/scaffold_services'
import type { ScaffoldContextState } from '../entities/scaffold_entities'
import { AUTH_CONFIG } from '../configs/auth_configs'
import { LandingRoot } from '../pages/landing/LandingRoot'
import { ScaffoldFallbackUI } from '../components/scaffold-fallback'
import { ProtectedRoute } from '../components/protected-route'

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

const DashboardPage = (): React.ReactElement => {
    return React.createElement(
        'div',
        { className: 'mx-auto max-w-7xl px-6 py-8' },
        React.createElement(
            'h2',
            { className: 'text-3xl font-bold text-gray-900' },
            'Dashboard'
        ),
        React.createElement(
            'p',
            { className: 'mt-4 text-gray-600' },
            'Welcome! This is your dashboard. Album management and search features coming soon.'
        )
    )
}

export const ScaffoldContextProvider = ({ children }: ScaffoldContextProviderProps): React.ReactElement => {
    const scaffoldState = useScaffoldService()
    const [sessionExpired, setSessionExpired] = React.useState(false)

    React.useEffect(() => {
        const handleSessionExpired = (event: Event) => {
            const customEvent = event as CustomEvent
            console.warn('Session expired:', customEvent.detail?.reason)
            setSessionExpired(true)
        }

        window.addEventListener(AUTH_CONFIG.events.sessionExpired, handleSessionExpired)
        return () => window.removeEventListener(AUTH_CONFIG.events.sessionExpired, handleSessionExpired)
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
        return React.createElement(ScaffoldFallbackUI, {
            title: 'Session Expired',
            message: 'Your session has expired. Please log in again.',
            buttonLabel: 'Go to Login',
            onButtonClick: () => {
                window.location.href = '/login'
            },
        })
    }

    return React.createElement(
        ScaffoldContext.Provider,
        { value: scaffoldState },
        children
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
            return React.createElement(ScaffoldFallbackUI, {
                title: 'Something went wrong',
                message: this.state.error?.message || '',
                buttonLabel: 'Reload Page',
                onButtonClick: () => window.location.reload(),
            })
        }

        return React.createElement(React.Fragment, null, this.props.children)
    }
}

export function ScaffoldAppShell({ children }: { children: ReactNode }): React.ReactElement {
    return React.createElement('div', { className: 'scaffold-app-shell' }, children)
}

export function AppRoutes(): React.ReactElement {
    return React.createElement(
        Routes,
        null,
        React.createElement(Route, {
            path: '/*',
            element: React.createElement(LandingRoot),
        }),
        React.createElement(Route, {
            path: '/dashboard',
            element: React.createElement(
                ProtectedRoute,
                null,
                React.createElement(DashboardPage)
            ),
        })
    )
}

const SessionNavigationHandler = ({ children }: { children: ReactNode }): React.ReactElement => {
    const navigate = useNavigate()

    React.useEffect(() => {
        const handleSessionStarted = (event: Event) => {
            const customEvent = event as CustomEvent
            console.info('[Router] Session started', customEvent.detail)
            setTimeout(() => {
                navigate('/dashboard', { replace: true })
            }, 100)
        }

        window.addEventListener(
            AUTH_CONFIG.events.sessionStarted,
            handleSessionStarted as EventListener
        )

        return () => {
            window.removeEventListener(
                AUTH_CONFIG.events.sessionStarted,
                handleSessionStarted as EventListener
            )
        }
    }, [navigate])

    React.useEffect(() => {
        const handleSessionEnded = (event: Event) => {
            const customEvent = event as CustomEvent
            console.info('[Router] Session ended', customEvent.detail?.reason)
            navigate('/login', { replace: true })
        }

        window.addEventListener(
            AUTH_CONFIG.events.sessionEnded,
            handleSessionEnded as EventListener
        )

        return () => {
            window.removeEventListener(
                AUTH_CONFIG.events.sessionEnded,
                handleSessionEnded as EventListener
            )
        }
    }, [navigate])

    return React.createElement(React.Fragment, null, children)
}

export const AppRouter = ({ children }: { children: ReactNode }): React.ReactElement => {
    return React.createElement(
        BrowserRouter,
        null,
        React.createElement(SessionNavigationHandler, null, children)
    )
}