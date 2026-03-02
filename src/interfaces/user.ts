// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UserRole = {
  ADMIN: 'admin',
  INSPECTOR: 'inspector',
  MANAGER: 'manager',
  VIEWER: 'viewer'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
