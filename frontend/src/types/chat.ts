// ─── Chat Types ──────────────────────────────────────────────────────────────

export interface ChatParticipant {
  userId: number;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

export type ChatType = 'Direct' | 'Group';

export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  senderName: string | null;
  senderAvatar: string | null;
  content: string | null;
  mediaUrl: string | null;
  createdAt: string;
}

export interface Chat {
  id: number;
  type: ChatType;
  name: string | null;
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
}

export interface Friend {
  id: number;
  userName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}