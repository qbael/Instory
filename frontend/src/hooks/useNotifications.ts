import { useEffect, useCallback, useRef } from 'react';
import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchNotifications,
  fetchUnreadCount,
  addRealtimeNotification,
  markAsRead as markAsReadThunk,
  markAllAsRead as markAllAsReadThunk,
} from '@/store/slices/notificationSlice';
import { SIGNALR_URL, AUTH_TOKEN_KEY } from '@/utils/constants';
import type { Notification } from '@/types';

export function useNotifications() {
  const dispatch = useAppDispatch();
  const { items, unreadCount, isLoading, hasMore, currentPage } =
    useAppSelector((s) => s.notification);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    dispatch(fetchUnreadCount());

    const connection = new HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}/notifications`, {
        accessTokenFactory: () =>
          localStorage.getItem(AUTH_TOKEN_KEY) ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', (notification: Notification) => {
      dispatch(addRealtimeNotification(notification));
    });

    connection
      .start()
      .catch((err) => console.error('SignalR connection failed:', err));

    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, dispatch]);

  const load = useCallback(
    (page: number = 1) => dispatch(fetchNotifications(page)),
    [dispatch],
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      dispatch(fetchNotifications(currentPage + 1));
    }
  }, [dispatch, isLoading, hasMore, currentPage]);

  const markAsRead = useCallback(
    (id: number) => dispatch(markAsReadThunk(id)),
    [dispatch],
  );

  const markAllAsRead = useCallback(
    () => dispatch(markAllAsReadThunk()),
    [dispatch],
  );

  return {
    notifications: items,
    unreadCount,
    isLoading,
    hasMore,
    load,
    loadMore,
    markAsRead,
    markAllAsRead,
  };
}
