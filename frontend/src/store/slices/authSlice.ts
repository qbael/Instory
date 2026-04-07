import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { User, LoginDto, RegisterDto } from '@/types';
import { authService } from '@/services/authService';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

const initialState: AuthState = {
  user: null,
  token: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
  isInitialized: !storedToken,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (dto: LoginDto, { rejectWithValue }) => {
    try {
      const { data } = await authService.login(dto);
      const auth = data.data;
      localStorage.setItem(AUTH_TOKEN_KEY, auth.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      return auth;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Login failed',
      );
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (dto: RegisterDto, { rejectWithValue }) => {
    try {
      const { data } = await authService.register(dto);
      const auth = data.data;
      localStorage.setItem(AUTH_TOKEN_KEY, auth.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
      return auth;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Registration failed',
      );
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authService.getMe();
      return data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? 'Failed to fetch user',
      );
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    },
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
        state.token = action.payload.token;
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

      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.token = action.payload.token;
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
      .addCase(register.rejected, (state, action) => {
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
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
