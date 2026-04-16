import api from './api';
import type { StoryHighlight } from '@/types';

const BASE = 'v1/highlights';

export const highlightService = {
  getByUser(userId: number) {
    return api.get<StoryHighlight[]>(BASE, { params: { userId } });
  },

  create(title: string, cover?: File) {
    const formData = new FormData();
    formData.append('title', title);
    if (cover) formData.append('cover', cover);
    return api.post<StoryHighlight>(BASE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  addStory(highlightId: number, storyId: number) {
    return api.post<StoryHighlight>(`${BASE}/${highlightId}/stories`, { storyId });
  },

  removeStory(highlightId: number, storyId: number) {
    return api.delete(`${BASE}/${highlightId}/stories/${storyId}`);
  },

  delete(highlightId: number) {
    return api.delete(`${BASE}/${highlightId}`);
  },
};
