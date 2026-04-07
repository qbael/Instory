import api from './api';
import type { ApiResponse, Story, StoryGroup } from '@/types';

const BASE = '/stories';

export const storyService = {
  getFeed() {
    return api.get<ApiResponse<StoryGroup[]>>(BASE);
  },

  getById(id: number) {
    return api.get<ApiResponse<Story>>(`${BASE}/${id}`);
  },

  create(formData: FormData) {
    return api.post<ApiResponse<Story>>(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete(id: number) {
    return api.delete(`${BASE}/${id}`);
  },

  markViewed(id: number) {
    return api.post(`${BASE}/${id}/view`);
  },
};
