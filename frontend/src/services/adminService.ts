import api from './api';
import type { ApiResponse, PaginatedResponse, PaginationParams, PostReport } from '@/types';

const BASE = '/admin';

export const adminService = {
  getReports(params?: PaginationParams) {
    return api.get<ApiResponse<PaginatedResponse<PostReport>>>(`${BASE}/reports`, {
      params,
    });
  },

  resolveReport(reportId: number, action: 'dismiss' | 'remove_post') {
    return api.put(`${BASE}/reports/${reportId}/resolve`, { action });
  },
};
