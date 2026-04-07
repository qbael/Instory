import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  login as loginThunk,
  register as registerThunk,
  fetchCurrentUser,
  logout as logoutAction,
  clearAuthError,
} from '@/store/slices/authSlice';
import type { LoginDto, RegisterDto } from '@/types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading, isInitialized, error } =
    useAppSelector((s) => s.auth);

  const login = useCallback(
    (dto: LoginDto) => dispatch(loginThunk(dto)).unwrap(),
    [dispatch],
  );

  const register = useCallback(
    (dto: RegisterDto) => dispatch(registerThunk(dto)).unwrap(),
    [dispatch],
  );

  const loadUser = useCallback(
    () => dispatch(fetchCurrentUser()).unwrap(),
    [dispatch],
  );

  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    register,
    loadUser,
    logout,
    clearError,
  };
}
