import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './media_routers';
import SearchDashboard from './media_search_routers';
import EvaluationDashboard from './eval_routers';

export function AppRouters(): React.ReactElement {
    return (
        <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/search" element={<SearchDashboard />} />
            <Route path="/evaluation" element={<EvaluationDashboard />} />
        </Routes>
    );
}

export default AppRouters;