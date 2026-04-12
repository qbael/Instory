import { lazy } from 'react';

export const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
export const RegisterPage = lazy(() => import('@/pages/Auth/RegisterPage'));
export const HomePage = lazy(() => import('@/pages/Home/HomePage'));
export const ProfilePage = lazy(() => import('@/pages/Profile/ProfilePage'));
export const EditProfilePage = lazy(() => import('@/pages/Profile/EditProfilePage'));
export const SearchPage = lazy(() => import('@/pages/Search/SearchPage'));
export const NotificationsPage = lazy(() => import('@/pages/Notifications/NotificationsPage'));
export const AdminPage = lazy(() => import('@/pages/Admin/AdminPage'));
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
export const ChatPage = lazy(() => import('@/pages/Chat/ChatPage'));
