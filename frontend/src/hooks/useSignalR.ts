import { useEffect, useRef, useCallback, useState } from 'react';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { useAppDispatch, useAppSelector } from '@/store';
import { addRealtimeNotification } from '@/store/slices/notificationSlice';
import { SIGNALR_URL, AUTH_TOKEN_KEY } from '@/utils/constants';
import type { Notification } from '@/types';

export function useSignalR() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const connectionRef = useRef<HubConnection | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const dismissNewPosts = useCallback(() => setHasNewPosts(false), []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}/notifications`, {
        accessTokenFactory: () => localStorage.getItem(AUTH_TOKEN_KEY) ?? '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', (notification: Notification) => {
      dispatch(addRealtimeNotification(notification));
    });

    connection.on('NewPost', () => {
      setHasNewPosts(true);
    });

    connection
      .start()
      .catch((err) => console.error('SignalR connection failed:', err));

    connectionRef.current = connection;

    return () => {
      if (
        connection.state !== HubConnectionState.Disconnected &&
        connection.state !== HubConnectionState.Disconnecting
      ) {
        connection.stop();
      }
    };
  }, [isAuthenticated, dispatch]);

  return { hasNewPosts, dismissNewPosts };
}
