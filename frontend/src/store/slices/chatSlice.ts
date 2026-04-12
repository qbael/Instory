import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { chatService } from '@/services/chatService';
import type { Chat, ChatMessage } from '@/types/chat';

interface ChatState {
  chats: Chat[];
  activeChatId: number | null;
  messages: Record<number, ChatMessage[]>;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  activeChatId: null,
  messages: {},
  isLoadingChats: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,
};

export const fetchUserChats = createAsyncThunk('chat/fetchUserChats', async () => {
  const { data } = await chatService.getUserChats();
  return data;
});

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchChatMessages',
  async (chatId: number) => {
    const { data } = await chatService.getChatMessages(chatId);
    return { chatId, messages: data };
  },
);

export const getOrCreateDirectChat = createAsyncThunk(
  'chat/getOrCreateDirectChat',
  async (targetUserId: number) => {
    const { data } = await chatService.getOrCreateDirectChat(targetUserId);
    return data;
  },
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content }: { chatId: number; content: string }) => {
    const { data } = await chatService.sendMessage(chatId, content);
    return data;
  },
);

export const sendMediaMessage = createAsyncThunk(
  'chat/sendMediaMessage',
  async ({ chatId, file, content }: { chatId: number; file: File; content?: string }) => {
    const { data } = await chatService.sendMediaMessage(chatId, file, content);
    return data;
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChatId(state, action: PayloadAction<number | null>) {
      state.activeChatId = action.payload;
    },
    receiveMessage(state, action: PayloadAction<ChatMessage>) {
      const msg = action.payload;
      const list = state.messages[msg.chatId] ?? [];
      // Avoid duplicates
      if (!list.find((m) => m.id === msg.id)) {
        state.messages[msg.chatId] = [...list, msg];
      }
      // Update last message in chat list
      const chat = state.chats.find((c) => c.id === msg.chatId);
      if (chat) {
        chat.lastMessage = msg;
      }
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserChats
      .addCase(fetchUserChats.pending, (state) => {
        state.isLoadingChats = true;
        state.error = null;
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.isLoadingChats = false;
        state.chats = action.payload;
      })
      .addCase(fetchUserChats.rejected, (state) => {
        state.isLoadingChats = false;
        state.error = 'Failed to load chats';
      })

      // fetchChatMessages
      .addCase(fetchChatMessages.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages[action.payload.chatId] = action.payload.messages;
      })
      .addCase(fetchChatMessages.rejected, (state) => {
        state.isLoadingMessages = false;
      })

      // sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const msg = action.payload;
        const list = state.messages[msg.chatId] ?? [];
        if (!list.find((m) => m.id === msg.id)) {
          state.messages[msg.chatId] = [...list, msg];
        }
        const chat = state.chats.find((c) => c.id === msg.chatId);
        if (chat) chat.lastMessage = msg;
      })
      .addCase(sendMessage.rejected, (state) => {
        state.isSending = false;
      })

      // sendMediaMessage
      .addCase(sendMediaMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendMediaMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const msg = action.payload;
        const list = state.messages[msg.chatId] ?? [];
        if (!list.find((m) => m.id === msg.id)) {
          state.messages[msg.chatId] = [...list, msg];
        }
        const chat = state.chats.find((c) => c.id === msg.chatId);
        if (chat) chat.lastMessage = msg;
      })
      .addCase(sendMediaMessage.rejected, (state) => {
        state.isSending = false;
      })

      .addCase(getOrCreateDirectChat.fulfilled, (state, action) => {
        state.activeChatId = action.payload.id;
      });
  },
});

export const { setActiveChatId, receiveMessage, clearError } = chatSlice.actions;
export default chatSlice.reducer;
