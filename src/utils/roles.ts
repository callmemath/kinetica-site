import type { User } from '../types';

/**
 * Utility functions for user role management with case-insensitive comparison
 */

export const normalizeRole = (role: string): string => {
  return role.toLowerCase().trim();
};

export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === 'admin';
};

export const isStaff = (user: User | null): boolean => {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === 'staff';
};

export const isAdminOrStaff = (user: User | null): boolean => {
  if (!user || !user.role) return false;
  const role = normalizeRole(user.role);
  return role === 'admin' || role === 'staff';
};

export const isUser = (user: User | null): boolean => {
  if (!user || !user.role) return false;
  return normalizeRole(user.role) === 'user';
};

export const getRoleDisplayName = (role: string): string => {
  const normalizedRole = normalizeRole(role);
  switch (normalizedRole) {
    case 'admin':
      return 'Amministratore';
    case 'staff':
      return 'Staff';
    case 'user':
      return 'Utente';
    default:
      return 'Ruolo sconosciuto';
  }
};

export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  const role = normalizeRole(user.role);
  
  switch (permission) {
    case 'manage_users':
    case 'manage_staff':
    case 'manage_services':
    case 'manage_settings':
      return role === 'admin';
    
    case 'manage_bookings':
    case 'view_reports':
      return role === 'admin' || role === 'staff';
    
    case 'view_own_bookings':
    case 'create_booking':
      return true; // All authenticated users
    
    default:
      return false;
  }
};
