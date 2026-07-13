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

  SỬA (đóng nhóm scaffold+auth, Vòng 3): router.tsx đã bị xóa — toàn bộ
  logic (BrowserRouter, route map, session navigation) đã sáp nhập vào
  scaffold_routers.ts theo đúng vai trò Composition Root duy nhất
  (Workflow_Centric_Architecture.md §2.4.1). RouterConfig đổi tên thành
  AppRoutes.
 * 
 * @owner AG-04
 */

import { ScaffoldContextProvider, ScaffoldErrorBoundary, ScaffoldAppShell, AppRouter, AppRoutes } from './routers/scaffold_routers';

function App() {
  return (
    <ScaffoldErrorBoundary>
      <ScaffoldContextProvider>
        <ScaffoldAppShell>
          <AppRouter>
            <AppRoutes />
          </AppRouter>
        </ScaffoldAppShell>
      </ScaffoldContextProvider>
    </ScaffoldErrorBoundary>
  );
}

export default App;