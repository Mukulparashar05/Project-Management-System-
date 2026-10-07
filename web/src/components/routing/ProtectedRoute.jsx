import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../hooks/useAuth.js';
import { FullScreenLoader, FullScreenUnreachable } from './FullScreenStatus.jsx';

/** Renders child routes only for signed-in users; everyone else is sent to /login. */
export function ProtectedRoute() {
  const { status, retrySessionCheck, endSession } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <FullScreenLoader label="Restoring your session" />;
  if (status === 'unreachable') {
    return <FullScreenUnreachable onRetry={retrySessionCheck} onSignOut={() => endSession()} />;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Login and register pages: signed-in users are forwarded to where they were going. */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <FullScreenLoader label="Restoring your session" />;
  if (status === 'authenticated') {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />;
  }
  return <Outlet />;
}
