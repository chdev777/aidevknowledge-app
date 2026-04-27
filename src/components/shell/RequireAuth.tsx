import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/firebase/auth-context.js';
import { FullPageSpinner } from '../shared/Spinner.js';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'unauthed') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (status === 'profileMissing') {
    return <Navigate to="/signup?completeProfile=1" replace />;
  }
  return <>{children}</>;
}
