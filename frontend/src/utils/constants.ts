export const API_URL = import.meta.env.API_BASE_URL as string ?? 'http://localhost:5174/api';
export const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL as string ?? 'http://localhost:5000/hubs';

export const AUTH_TOKEN_KEY = 'instory_token';
export const REFRESH_TOKEN_KEY = 'instory_refresh_token';

export const DEFAULT_PAGE_SIZE = 20;
export const STORY_DURATION_HOURS = 24;
export const MAX_IMAGE_SIZE_MB = 10;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile/:username',
  EDIT_PROFILE: '/profile/edit',
  SEARCH: '/search',
  NOTIFICATIONS: '/notifications',
  ADMIN: '/admin',
} as const;
