import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead as markAsReadThunk,
  markAllAsRead as markAllAsReadThunk,
} from '@/store/slices/notificationSlice';

export function useNotifications() {
  const dispatch = useAppDispatch();
  const { items, unreadCount, isLoading, hasMore, currentPage } =
    useAppSelector((s) => s.notification);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadCount());
    }
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
