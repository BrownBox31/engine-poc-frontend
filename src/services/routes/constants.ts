import apiClient from '../data/interceptor';

// Route paths constants
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ANALYTICS: '/analytics',
  ANALYTICS_ISSUES: '/analytics/issues',
  ENGINE_DASHBOARD: '/EngineInspector',
  INSPECTION_LIST: '/inspection/:vin',
  INSPECTION_DETAILS: '/inspection/:vin/:inspectionId',
  ROOT: '/',
} as const;

// Route configuration type
export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
  public?: boolean;
}

// Navigation utilities
export const navigationUtils = {
  goToLogin: () => {
    window.location.href = ROUTES.LOGIN;
  },
  
  goToDashboard: () => {
    window.location.href = ROUTES.ENGINE_DASHBOARD;
  },
  
  goToInspectionList: (vin: string) => {
    window.location.href = `/inspection/${vin}`;
  },
  
  goToInspectionDetails: (vin: string, inspectionId: string) => {
    window.location.href = `/inspection/${vin}/${inspectionId}`;
  },
  
  logout: () => {
    apiClient.clearTokens();
    window.location.href = ROUTES.LOGIN;
  },
  
  isCurrentRoute: (path: string): boolean => {
    return window.location.pathname === path;
  }
};
