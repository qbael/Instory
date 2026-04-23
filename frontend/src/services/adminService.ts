import api from './api';
import type { PaginatedResponse, PaginationParams, PostReport } from '@/types';

const BASE = 'v1/admin';

export const adminService = {
  getReports(params?: PaginationParams) {
    return api.get<PaginatedResponse<PostReport>>(`${BASE}/reports`, { params });
  },

  resolveReport(reportId: number, action: 'dismiss' | 'remove_post') {
    return api.put(`${BASE}/reports/${reportId}/resolve`, { action });
  },
};
