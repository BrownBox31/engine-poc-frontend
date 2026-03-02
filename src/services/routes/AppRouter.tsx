import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants';
import { ProtectedRoute, PublicRoute } from './index';

// Import pages
import Login from '../../pages/login';
import Dashboard from '../../pages/dashboard';
import InspectionList from '../../pages/inspection-list';
import InspectionDetails from '../../pages/inspection-details';
import Analytics from '../../pages/analytics';
import AnalyticsIssuesPage from '../../pages/analytics-issues';
import EngineInspector from '../../pages/EngineInspector';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Root route - redirect to dashboard if authenticated, login if not */}

          <Route
          path={ROUTES.ROOT}
          element={
            <Navigate
              to={localStorage.getItem('accessToken') ? ROUTES.ENGINE_DASHBOARD : ROUTES.LOGIN}
              replace
            />
          }
        />
        {/* <Route
          path={ROUTES.ROOT}
          element={
            <Navigate
              to={localStorage.getItem('accessToken') ? ROUTES.DASHBOARD : ROUTES.LOGIN}
              replace
            />
          }
        /> */}

        {/* Public routes */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path={ROUTES.ENGINE_DASHBOARD}
          element={
            <ProtectedRoute>
              <EngineInspector />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.ANALYTICS}
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ANALYTICS_ISSUES}
          element={
            <ProtectedRoute>
              <AnalyticsIssuesPage />
            </ProtectedRoute>
          }
        />


        <Route
          path={ROUTES.INSPECTION_LIST}
          element={
            <ProtectedRoute>
              <InspectionList />
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.INSPECTION_DETAILS}
          element={
            <ProtectedRoute>
              <InspectionDetails />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to dashboard or login */}
        <Route
          path="*"
          element={
            <Navigate
              to={localStorage.getItem('accessToken') ? ROUTES.ENGINE_DASHBOARD : ROUTES.LOGIN}
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
