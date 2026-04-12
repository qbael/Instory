import api from './api';
import type {
  ApiResponse,
  Comment,
  CreateCommentDto,
  PaginatedResponse,
  PaginationParams,
  Post,
} from '@/types';

const BASE = 'v1/posts';

export const postService = {
  getFeed(params?: PaginationParams) {
    return api.get<ApiResponse<PaginatedResponse<Post>>>(BASE, { params });
  },

  getById(id: number) {
    return api.get<ApiResponse<Post>>(`${BASE}/${id}`);
  },

  create(formData: FormData) {
    return api.post<ApiResponse<Post>>(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update(id: number, formData: FormData) {
    return api.put<ApiResponse<Post>>(`${BASE}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete(id: number) {
    return api.delete(`${BASE}/${id}`);
  },

  like(id: number) {
    return api.post(`${BASE}/${id}/like`);
  },

  unlike(id: number) {
    return api.delete(`${BASE}/${id}/like`);
  },

  share(id: number, caption?: string) {
    return api.post(`${BASE}/${id}/share`, { caption });
  },

  getComments(postId: number, params?: PaginationParams) {
    return api.get<ApiResponse<PaginatedResponse<Comment>>>(
      `${BASE}/${postId}/comments`,
      { params },
    );
  },

  addComment(dto: CreateCommentDto) {
    return api.post<ApiResponse<Comment>>(
      `${BASE}/${dto.postId}/comments`,
      { content: dto.content },
    );
  },

  deleteComment(commentId: number) {
    return api.delete(`${BASE}/comments/${commentId}`);
  },

  report(postId: number, reason: string) {
    return api.post(`${BASE}/${postId}/report`, { reason });
  },

  getUserPosts(userId: number, params?: PaginationParams) {
    return api.get<ApiResponse<PaginatedResponse<Post>>>(
      `/users/${userId}/posts`,
      { params },
    );
  },
};
