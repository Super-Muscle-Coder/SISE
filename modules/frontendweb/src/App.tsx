/**
 * @file App.tsx
 * @layer routers (root)
 * @description Root application component with scaffold shell and router.
 *              FIX R1: Routes wrapped in AppRouter to handle sessionStarted/sessionEnded events.
 * @owner AG-04
 */

import { ScaffoldContextProvider, ScaffoldErrorBoundary, ScaffoldAppShell } from './routers/scaffold_routers';
import { AppRouter, RouterConfig } from './routers/router';

function App() {
  return (
    <ScaffoldErrorBoundary>
      <ScaffoldContextProvider>
        <ScaffoldAppShell>
          <AppRouter>
            <RouterConfig />
          </AppRouter>
        </ScaffoldAppShell>
      </ScaffoldContextProvider>
    </ScaffoldErrorBoundary>
  );
}

export default App;
