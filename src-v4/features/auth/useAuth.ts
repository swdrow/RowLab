/**
 * useAuth hook: access auth context from any component.
 * Throws if used outside AuthProvider.
 */
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import type { AuthContextValue } from '@/types/auth';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
