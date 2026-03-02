import { Navigate } from 'react-router-dom';
import apiClient from '../data/interceptor';
import { ROUTES } from './constants';

// Protected Route wrapper component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = apiClient.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  return <>{children}</>;
};

// Public Route wrapper (redirects to dashboard if already authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = ROUTES.DASHBOARD 
}) => {
  const isAuthenticated = apiClient.isAuthenticated();
  
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};


