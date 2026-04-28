import { Navigate, Outlet, useLocation } from 'react-router';
import { useAppSelector } from '@/store';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function AdminRoute() {
  const { user, isAuthenticated, isInitialized } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!isInitialized) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user?.roles.includes('Admin')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
