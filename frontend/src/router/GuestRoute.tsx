import { Navigate, Outlet } from 'react-router';
import { useAppSelector } from '@/store';
import { FullPageSpinner } from '@/components/ui/Spinner';

export default function GuestRoute() {
  const { isAuthenticated, isInitialized } = useAppSelector((s) => s.auth);

  if (!isInitialized) {
    return <FullPageSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
