import api from './api';
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  User,
  UserProfile,
  Friendship,
  SearchParams,
  SearchResults,
} from '@/types';

const BASE = '/users';

export const userService = {
  getProfile(username: string) {
    return api.get<ApiResponse<UserProfile>>(`${BASE}/${username}`);
  },

  updateProfile(formData: FormData) {
    return api.put<ApiResponse<User>>(`${BASE}/profile`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getFollowers(userId: number, params?: PaginationParams) {
    return api.get<ApiResponse<PaginatedResponse<User>>>(
      `${BASE}/${userId}/followers`,
      { params },
    );
  },

  getFollowing(userId: number, params?: PaginationParams) {
    return api.get<ApiResponse<PaginatedResponse<User>>>(
      `${BASE}/${userId}/following`,
      { params },
    );
  },

  follow(userId: number) {
    return api.post(`${BASE}/${userId}/follow`);
  },

  unfollow(userId: number) {
    return api.delete(`${BASE}/${userId}/follow`);
  },

  getSuggested() {
    return api.get<ApiResponse<User[]>>(`${BASE}/suggested`);
  },

  sendFriendRequest(userId: number) {
    return api.post<ApiResponse<Friendship>>(`${BASE}/${userId}/friend-request`);
  },

  respondFriendRequest(requestId: number, accept: boolean) {
    return api.put(`/friendships/${requestId}`, {
      status: accept ? 'accepted' : 'declined',
    });
  },

  getFriendRequests(params?: PaginationParams) {
    return api.get<ApiResponse<PaginatedResponse<Friendship>>>(
      '/friendships/requests',
      { params },
    );
  },

  search(params: SearchParams) {
    return api.get<ApiResponse<SearchResults>>('/search', { params });
  },
};
