import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  login as loginThunk,
  googleLogin as googleLoginThunk,
  register as registerThunk,
  sendSignupOtp as sendSignupOtpThunk,
  verifySignupOtp as verifySignupOtpThunk,
  fetchCurrentUser,
  logout as logoutThunk,
  clearAuthError,
} from '@/store/slices/authSlice';
import type {
  LoginDto,
  RegisterDto,
  GoogleLoginRequestDto,
  SendSignupOtpDto,
  VerifySignupOtpDto,
} from '@/types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, isInitialized, error } =
    useAppSelector((s) => s.auth);

  const login = useCallback(
    (dto: LoginDto) => dispatch(loginThunk(dto)).unwrap(),
    [dispatch],
  );

  const googleLogin = useCallback(
    (dto: GoogleLoginRequestDto) => dispatch(googleLoginThunk(dto)).unwrap(),
    [dispatch],
  );

  const register = useCallback(
    (dto: RegisterDto) => dispatch(registerThunk(dto)).unwrap(),
    [dispatch],
  );

  const sendSignupOtp = useCallback(
    (dto: SendSignupOtpDto) => dispatch(sendSignupOtpThunk(dto)).unwrap(),
    [dispatch],
  );

  const verifySignupOtp = useCallback(
    (dto: VerifySignupOtpDto) =>
      dispatch(verifySignupOtpThunk(dto)).unwrap(),
    [dispatch],
  );

  const loadUser = useCallback(
    () => dispatch(fetchCurrentUser()).unwrap(),
    [dispatch],
  );

  const logout = useCallback(
    () => dispatch(logoutThunk()).unwrap(),
    [dispatch],
  );

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    googleLogin,
    register,
    sendSignupOtp,
    verifySignupOtp,
    loadUser,
    logout,
    clearError,
  };
}
