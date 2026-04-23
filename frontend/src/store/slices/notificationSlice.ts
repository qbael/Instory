import {createAsyncThunk, createSlice, type PayloadAction} from '@reduxjs/toolkit';
import type {Notification} from '@/types';
import {notificationService} from '@/services/notificationService';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  hasMore: true,
  currentPage: 1,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (page: number = 1) => {
    const { data } = await notificationService.getAll({
      pageNumber: page,
      pageSize: 20,
    });
    return { ...data };
  },
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async () => {
    const { data } = await notificationService.getUnreadCount();
    return data;
  },
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (id: number) => {
    await notificationService.markAsRead(id);
    return id;
  },
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async () => {
    await notificationService.markAllAsRead();
  },
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addRealtimeNotification(state, action: PayloadAction<Notification>) {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    resetNotifications(state) {
      state.items = [];
      state.currentPage = 1;
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const { page, data, hasNextPage } = action.payload;
        if (page === 1) {
          state.items = data;
        } else {
          state.items.push(...data);
        }
        state.hasMore = hasNextPage;
        state.currentPage = page;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.isLoading = false;
      })

      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      .addCase(markAsRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addRealtimeNotification, resetNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;
