import api from './api';
import type {
  AuthResponse,
  GoogleLoginRequestDto,
  LoginDto,
  RegisterDto,
  SendSignupOtpDto,
  VerifySignupOtpDto,
  User,
} from '@/types';

const BASE = 'v1/auth';

export const authService = {
  login(dto: LoginDto) {
    return api.post<AuthResponse>(`${BASE}/login`, dto);
  },

  googleLogin(dto: GoogleLoginRequestDto) {
    return api.post<AuthResponse>(`${BASE}/signin-google`, dto);
  },

  register(dto: RegisterDto) {
    return api.post<{ message: string }>(`${BASE}/register`, dto);
  },

  sendSignupOtp(dto: SendSignupOtpDto) {
    return api.post<{ message: string }>(`${BASE}/signup/send-otp`, dto);
  },

  verifySignupOtp(dto: VerifySignupOtpDto) {
    return api.post<{ message: string }>(`${BASE}/signup/verify-otp`, dto);
  },

  refreshToken() {
    return api.post<AuthResponse>(`${BASE}/refresh`);
  },

  getMe() {
    return api.get<User>(`${BASE}/me`);
  },

  logout() {
    return api.post(`${BASE}/logout`);
  },
};
