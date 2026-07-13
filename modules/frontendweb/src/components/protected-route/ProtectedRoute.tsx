/**
 * @file ProtectedRoute.tsx
 * @layer components (Layer 2)
 * @description Guard component cho route yêu cầu đăng nhập. Gọi
 *              isAuthenticated() (auth_routers.ts) BÊN TRONG thân
 *              component — để React re-evaluate mỗi khi component này
 *              render (đúng lúc URL đổi tới route được bảo vệ), KHÔNG
 *              tính 1 lần tĩnh khi khai báo Route trong AppRoutes().
 *
 *              SỬA BUG: trước đây isAuthenticated() được gọi ngay trong
 *              thân hàm AppRoutes() (scaffold_routers.ts) để tính element
 *              tĩnh cho <Route path="/dashboard">. Vì AppRoutes() chỉ
 *              re-render khi có state/props đổi (không phải mỗi khi
 *              navigate() gọi), giá trị isAuthenticated() bị "đóng băng"
 *              từ lần render đầu tiên — dẫn đến trường hợp người dùng vừa
 *              đăng nhập xong, SessionNavigationHandler gọi
 *              navigate('/dashboard'), nhưng Route vẫn giữ element cũ
 *              (Navigate to="/") tính từ trước khi đăng nhập, có thể đá
 *              ngược người dùng về trang chủ ngay sau khi đăng nhập thành
 *              công. Đặt isAuthenticated() vào bên trong 1 component riêng
 *              (ProtectedRoute) đảm bảo nó được gọi lại đúng lúc component
 *              này render — tức đúng lúc URL match route được bảo vệ.
 * @owner AG-04
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../routers/auth_routers';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.ReactElement {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}