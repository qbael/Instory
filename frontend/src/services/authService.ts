import api from './api';
import type {
  AuthResponse,
  LoginDto,
  RegisterDto,
  User,
} from '@/types';

const BASE = 'v1/auth';

export const authService = {
  login(dto: LoginDto) {
    return api.post<AuthResponse>(`${BASE}/login`, dto);
  },

  register(dto: RegisterDto) {
    return api.post<{ message: string }>(`${BASE}/register`, dto);
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
