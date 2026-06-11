/**
 * @file App.tsx
 * @layer routers (root)
 * @description Root application component with scaffold shell and router.
 * 
 * Công dụng: Root component - định nghĩa 3 tầng wrapper:
  1. ScaffoldErrorBoundary (bắt lỗi toàn app)
  2. ScaffoldContextProvider (cung cấp dữ liệu chung)
  3. ScaffoldAppShell (vỏ ngoài: header, footer, layout)
  Nếu thêm theme, session context, v.v. thường thêm ở đây
 * 
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
