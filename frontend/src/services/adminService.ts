import api from './api';
import type { PaginatedResponse, PaginationParams, AdminReport, User } from '@/types';

const BASE = 'v1/admin';

export interface AdminReportReason {
  id: number;
  code: string;
  name: string;
  description: string | null;
  severity: number;
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}

export interface CreateAdminReportReasonDto {
  code: string;
  name: string;
  description?: string;
  severity?: number;
}

export interface AdminPostUser {
  id: number;
  userName: string;
  avatarUrl: string | null;
}

export interface AdminPost {
  id: number;
  content: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  reportCount: number;
  user: AdminPostUser;
  images: { imageUrl: string }[];
}

export interface AdminPostsParams extends PaginationParams {
  search?: string;
}

export interface AdminUsersParams extends PaginationParams {
  search?: string;
}

export const adminService = {
  // ─── Reports ────────────────────────────────────────────────────────────
  getReports(params?: PaginationParams) {
    return api.get<PaginatedResponse<AdminReport>>(`${BASE}/reports`, { params });
  },

  resolveReport(reportId: number, action: 'dismiss' | 'remove_post') {
    return api.put(`${BASE}/reports/${reportId}/resolve`, { action });
  },

  // ─── Report Reasons ─────────────────────────────────────────────────────
  getReportReasons() {
    return api.get<AdminReportReason[]>(`${BASE}/report-reasons`);
  },

  createReportReason(dto: CreateAdminReportReasonDto) {
    return api.post<AdminReportReason>(`${BASE}/report-reasons`, dto);
  },

  deleteReportReason(reasonId: number) {
    return api.delete(`${BASE}/report-reasons/${reasonId}`);
  },

  // ─── Users ──────────────────────────────────────────────────────────────
  getUsers(params?: AdminUsersParams) {
    return api.get<PaginatedResponse<User>>(`${BASE}/users`, { params });
  },

  promoteToAdmin(userId: number) {
    return api.post(`${BASE}/users/${userId}/promote`);
  },

  toggleUserBlock(userId: number) {
    return api.post(`${BASE}/users/${userId}/toggle-block`);
  },

  // ─── Posts ──────────────────────────────────────────────────────────────
  getPosts(params?: AdminPostsParams) {
    return api.get<PaginatedResponse<AdminPost>>(`${BASE}/posts`, { params });
  },

  deletePost(postId: number) {
    return api.delete(`${BASE}/posts/${postId}`);
  },
};
