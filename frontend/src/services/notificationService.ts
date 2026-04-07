import api from './api';
import type {
  ApiResponse,
  Notification,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

const BASE = '/notifications';

export const notificationService = {
  getAll(params?: PaginationParams) {
    return api.get<ApiResponse<PaginatedResponse<Notification>>>(BASE, {
      params,
    });
  },

  getUnreadCount() {
    return api.get<ApiResponse<number>>(`${BASE}/unread-count`);
  },

  markAsRead(id: number) {
    return api.put(`${BASE}/${id}/read`);
  },

  markAllAsRead() {
    return api.put(`${BASE}/read-all`);
  },
};
