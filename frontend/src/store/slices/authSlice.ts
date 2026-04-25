import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type {
  User,
  LoginDto,
  RegisterDto,
  GoogleLoginRequestDto,
  SendSignupOtpDto,
  VerifySignupOtpDto,
} from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (dto: LoginDto, { rejectWithValue }) => {
    try {
      const { data } = await authService.login(dto);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Đăng nhập thất bại',
      );
    }
  },
);

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (dto: GoogleLoginRequestDto, { rejectWithValue }) => {
    try {
      const { data } = await authService.googleLogin(dto);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Đăng nhập Google thất bại',
      );
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (dto: RegisterDto, { rejectWithValue }) => {
    try {
      const { data } = await authService.register(dto);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Đăng ký thất bại',
      );
    }
  },
);

export const sendSignupOtp = createAsyncThunk(
  'auth/sendSignupOtp',
  async (dto: SendSignupOtpDto, { rejectWithValue }) => {
    try {
      const { data } = await authService.sendSignupOtp(dto);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Gửi OTP thất bại',
      );
    }
  },
);

export const verifySignupOtp = createAsyncThunk(
  'auth/verifySignupOtp',
  async (dto: VerifySignupOtpDto, { rejectWithValue }) => {
    try {
      const { data } = await authService.verifySignupOtp(dto);
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Xác minh OTP thất bại',
      );
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authService.getMe();
      return data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Không thể lấy thông tin người dùng',
      );
    }
  },
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.userId,
          userName: action.payload.username,
          email: action.payload.email,
          fullName: null,
          bio: null,
          avatarUrl: null,
          createdAt: '',
          updatedAt: null,
        };
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.userId,
          userName: action.payload.username,
          email: action.payload.email,
          fullName: null,
          bio: null,
          avatarUrl: null,
          createdAt: '',
          updatedAt: null,
        };
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(sendSignupOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendSignupOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(sendSignupOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(verifySignupOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifySignupOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifySignupOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = null;
        state.isAuthenticated = false;
      })

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
