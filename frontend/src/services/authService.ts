import api from './api';
import type {
  ApiResponse,
  AuthResponse,
  LoginDto,
  RegisterDto,
  TokenRequestDto,
  User,
} from '@/types';

const BASE = '/auth';

export const authService = {
  login(dto: LoginDto) {
    return api.post<ApiResponse<AuthResponse>>(`${BASE}/login`, dto);
  },

  register(dto: RegisterDto) {
    return api.post<ApiResponse<AuthResponse>>(`${BASE}/register`, dto);
  },

  refreshToken(dto: TokenRequestDto) {
    return api.post<ApiResponse<AuthResponse>>(`${BASE}/refresh`, dto);
  },

  getMe() {
    return api.get<ApiResponse<User>>(`${BASE}/me`);
  },

  logout() {
    return api.post(`${BASE}/logout`);
  },
};
