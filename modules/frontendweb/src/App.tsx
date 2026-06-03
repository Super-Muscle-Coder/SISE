import { ScaffoldContextProvider, ScaffoldErrorBoundary, ScaffoldAppShell } from './routers/scaffold_routers'

function App() {
    return (
        <ScaffoldErrorBoundary>
            <ScaffoldContextProvider>
                <ScaffoldAppShell>
                    <div className="mx-auto max-w-7xl px-6 py-8">
                        <h2 className="text-3xl font-bold text-gray-900">Welcome to SISE</h2>
                        <p className="mt-4 text-gray-600">
                            Smart Image Search Engine - Multimodal Retrieval Platform
                        </p>
                    </div>
                </ScaffoldAppShell>
            </ScaffoldContextProvider>
        </ScaffoldErrorBoundary>
    )
}

export default App