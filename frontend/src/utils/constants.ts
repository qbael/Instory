export const API_URL = import.meta.env.VITE_API_URL as string ?? '/api';
export const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL as string ?? '/hubs';

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
  CHAT: '/chat',
  ADMIN: '/admin',
} as const;
