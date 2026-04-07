import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import {
  LoginPage,
  RegisterPage,
  HomePage,
  ProfilePage,
  EditProfilePage,
  SearchPage,
  NotificationsPage,
  AdminPage,
  NotFoundPage,
} from './routes';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          {/* Guest-only routes (redirect to / if already authenticated) */}
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          {/* Protected routes (redirect to /login if not authenticated) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="profile/edit" element={<EditProfilePage />} />
              <Route path="profile/:userId" element={<ProfilePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
