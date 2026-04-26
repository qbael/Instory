import api from "./api";
import type {
  ApiResponse,
  Comment,
  CreateCommentDto,
  PaginatedResponse,
  PaginationParams,
  Post,
  ReportReason,
} from "@/types";

const BASE = "v1/posts";
const BASE_REPORT = "v1/reports";
export const postService = {
  getFeed(params?: PaginationParams) {
    return api.get(`${BASE}/feed`, { params });
  },

  getById(id: number) {
    return api.get<Post>(`${BASE}/${id}`);
  },

  create(formData: FormData) {
    return api.post<Post>(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update(id: number, formData: FormData) {
    return api.put<Post>(`${BASE}/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
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
    return api.get<PaginatedResponse<Comment>>(`${BASE}/${postId}/comments`, {
      params,
    });
  },

  addComment(postId: number, content: string) {
    return api.post<ApiResponse<Comment>>(`${BASE}/${postId}/comments`, {
      content,
    });
  },
  // addComment(postId: number, payload: { content: string }) {
  //       return api.post(`${BASE}/${postId}/comments`, payload);
  // },
  deleteComment(commentId: number) {
    return api.delete(`${BASE}/comments/${commentId}`);
  },

  getReportReasons() {
    return api.get<ReportReason[]>(`${BASE_REPORT}/reasons`);
  },

  report(postId: number, reasonId: number, reasonDetail?: string) {
    return api.post(`${BASE_REPORT}/${postId}`, { reasonId, reasonDetail });
  },

  getUserPosts(userId: number, params?: PaginationParams) {
    return api.get<PaginatedResponse<Post>>(`v1/users/${userId}/posts`, {
      params,
    });
  },
};
