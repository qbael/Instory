import api from './api';
import type { Chat, ChatMessage } from '@/types/chat';

const BASE = 'v1/chat';

export const chatService = {
  getUserChats() {
    return api.get<Chat[]>(`${BASE}`);
  },

  getChatMessages(chatId: number) {
    return api.get<ChatMessage[]>(`${BASE}/${chatId}/messages`);
  },

  getOrCreateDirectChat(targetUserId: number) {
    return api.post<{ id: number; type: string }>(`${BASE}/direct/${targetUserId}`);
  },

  sendMessage(chatId: number, content: string) {
    return api.post<ChatMessage>(`${BASE}/message`, { chatId, content });
  },

  sendMediaMessage(chatId: number, file: File, content?: string) {
    const formData = new FormData();
    formData.append('chatId', String(chatId));
    if (content) formData.append('content', content);
    formData.append('file', file);
    return api.post<ChatMessage>(`${BASE}/message/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createGroupChat(name: string, participantIds: number[]) {
    return api.post<{ id: number; type: string; name: string }>(`${BASE}/group`, {
      name,
      participantIds,
    });
  },
};
