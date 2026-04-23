import api from './api';
import type { PaginatedResponse, Story, StoryGroup } from '@/types';

const BASE = 'v1/story';

export const storyService = {
  getFeed() {
    return api.get<StoryGroup[]>(BASE);
  },

  getById(id: number) {
    return api.get<Story>(`${BASE}/${id}`);
  },

  create(formData: FormData) {
    return api.post<Story>(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getArchive(page = 1, pageSize = 20) {
    return api.get<PaginatedResponse<Story>>(`${BASE}/archive`, {
      params: { page, pageSize },
    });
  },

  delete(id: number) {
    return api.delete(`${BASE}/${id}`);
  },

  markViewed(id: number) {
    return api.post(`${BASE}/${id}/view`);
  },
};
