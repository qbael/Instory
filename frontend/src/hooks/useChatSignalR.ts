import { useEffect, useRef } from 'react';
import {
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { useAppDispatch, useAppSelector } from '@/store';
import { receiveMessage } from '@/store/slices/chatSlice';
import { SIGNALR_URL } from '@/utils/constants';
import type { ChatMessage } from '@/types/chat';

export function useChatSignalR() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      connectionRef.current?.stop().catch(() => {});
      connectionRef.current = null;
      return;
    }

    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}/chat`, { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveMessage', (message: ChatMessage) => {
      dispatch(receiveMessage(message));
    });

    connection.start().catch((err) => {
      if (isMounted) console.error('ChatHub SignalR connection failed:', err);
    });

    connectionRef.current = connection;

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [isAuthenticated, dispatch]);
}
