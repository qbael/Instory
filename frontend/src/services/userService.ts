import api from './api';
import type {
  PaginatedResponse,
  PaginationParams,
  User,
  UserProfile,
  Friendship,
  SearchParams,
  SearchResults,
} from '@/types';

const BASE = 'v1/profile';

export const userService = {
  getProfile(username: string) {
    return api.get<UserProfile>(`${BASE}/${username}`);
  },

  updateProfile(formData: FormData) {
    return api.put<User>(`${BASE}/me`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getFriends(userId: number, params?: PaginationParams) {
    return api.get<PaginatedResponse<User>>(`v1/users/${userId}/friends`, { params });
  },

  getSuggested() {
    return api.get<User[]>('v1/users/suggested');
  },

  sendFriendRequest(userId: number) {
    return api.post<Friendship>(`v1/friendship/${userId}/friend-request`);
  },

  cancelFriendRequest(userId: number) {
    return api.delete(`v1/friendship/${userId}/friend-request`);
  },

  unfriend(userId: number) {
    return api.delete(`v1/friendship/${userId}/friend`);
  },

  respondFriendRequest(requestId: number, accept: boolean) {
    return api.patch(`v1/friendship/${requestId}`, {
      status: accept ? 'accepted' : 'declined',
    });
  },

  getFriendRequests(params?: PaginationParams) {
    return api.get<PaginatedResponse<Friendship>>('v1/friendship/requests', { params });
  },

  getSentFriendRequests(params?: PaginationParams) {
    return api.get<PaginatedResponse<Friendship>>('v1/friendship/sent', { params });
  },

  search(params: SearchParams) {
    return api.get<SearchResults>('v1/search', { params });
  },
};
