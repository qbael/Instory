import api from './api';
import type {
  Notification,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

const BASE = 'v1/notifications';

export const notificationService = {
  getAll(params?: PaginationParams) {
    return api.get<PaginatedResponse<Notification>>(BASE, { params });
  },

  getUnreadCount() {
    return api.get<number>(`${BASE}/unread-count`);
  },

  markAsRead(id: number) {
    return api.put(`${BASE}/${id}/read`);
  },

  markAllAsRead() {
    return api.put(`${BASE}/read-all`);
  },
};
