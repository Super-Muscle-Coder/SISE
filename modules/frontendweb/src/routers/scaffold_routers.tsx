import React, { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useScaffoldService } from '../services/scaffold_services'
import type { ScaffoldContextState } from '../entities/scaffold_entities'

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
