import api from './api';
import type {
  PaginatedResponse,
  PaginationParams,
  User,
  UserProfile,
  Friendship,
  SearchParams,
  SearchResults,
  Hashtag,
  Post,
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

  respondFriendRequestByUserId(requesterId: number, accept: boolean) {
    return api.patch(`v1/friendship/${requesterId}/respond`, {
      status: accept ? 'accepted' : 'declined',
    });
  },

  getFriendRequests(params?: PaginationParams) {
    return api.get<PaginatedResponse<Friendship>>('v1/friendship/requests', { params });
  },

  getSentFriendRequests(params?: PaginationParams) {
    return api.get<PaginatedResponse<Friendship>>('v1/friendship/sent', { params });
  },

  search: async (params: SearchParams): Promise<{ data: SearchResults }> => {
    try {
      // Dùng Promise.all để gọi song song các API đã được chia nhỏ ở Backend
      const [usersRes, hashtagsRes, postsRes] = await Promise.all([
        api.get<User[]>('v1/search/users', { params: { query: params.query } })
           .catch(() => ({ data: [] as User[] })),
           
        api.get<Hashtag[]>('v1/search/hashtags', { params: { query: params.query, limit: 10 } })
           .catch(() => ({ data: [] as Hashtag[] })),
                   
        api.get<Post[]>('v1/search/posts', { params: { query: params.query } })
          .catch(() => ({ data: [] as Post[] }))
      ]);
      
      const results: SearchResults = {
        users: usersRes.data || [],
        hashtags: hashtagsRes.data || [],
        posts: postsRes.data || [],
      };

      return { data: results };
    } catch (error) {
      console.error("Lỗi khi gọi API tìm kiếm:", error);
      throw error;
    }
  },
};
