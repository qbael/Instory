import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { toast } from 'sonner';
import { Heart, MessageCircle, UserPlus, Users, Bookmark } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { addRealtimeNotification, fetchUnreadCount } from '@/store/slices/notificationSlice';
import { SIGNALR_URL } from '@/utils/constants';
import type { Notification, NotificationType } from '@/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const iconConfig: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  FriendRequestReceived: { icon: UserPlus,     color: '#22c55e' },
  FriendRequestAccepted: { icon: Users,         color: '#22c55e' },
  NewMessage:            { icon: MessageCircle, color: '#3b82f6' },
  PostLiked:             { icon: Heart,         color: '#ef4444' },
  PostCommented:         { icon: MessageCircle, color: '#3b82f6' },
  PostSaved:             { icon: Bookmark,      color: '#f59e0b' },
};

const actionText: Record<NotificationType, string> = {
  FriendRequestReceived: 'đã gửi lời mời kết bạn cho bạn.',
  FriendRequestAccepted: 'đã chấp nhận lời mời kết bạn.',
  NewMessage:            'đã nhắn tin cho bạn.',
  PostLiked:             'đã thích bài viết của bạn.',
  PostCommented:         'đã bình luận bài viết của bạn.',
  PostSaved:             'đã lưu bài viết của bạn.',
};

function getNavigateTo(n: Notification): string | undefined {
  switch (n.type) {
    case 'FriendRequestReceived':
    case 'FriendRequestAccepted':
      return n.actorUsername ? `/profile/${n.actorUsername}` : undefined;
    case 'NewMessage':
      return '/chat';
    default:
      return undefined;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSignalR() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const connectionRef = useRef<HubConnection | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const dismissNewPosts = useCallback(() => setHasNewPosts(false), []);

  // Fetch initial unread count as soon as the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUnreadCount());
    }
  }, [isAuthenticated, dispatch]);

  // Stable refs — SignalR handlers always see latest values without triggering reconnect
  const navigateRef = useRef(navigate);
  const locationRef = useRef(location.pathname);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { locationRef.current = location.pathname; }, [location.pathname]);

  // SignalR connect/disconnect — only depends on isAuthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      connectionRef.current?.stop().catch(() => {});
      connectionRef.current = null;
      return;
    }

    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}/notifications`, { withCredentials: true })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', (notification: Notification) => {
      dispatch(addRealtimeNotification(notification));

      // Don't show toast when already viewing the notifications page
      if (locationRef.current === '/notifications') return;

      const cfg = iconConfig[notification.type];
      const Icon = cfg?.icon ?? MessageCircle;
      const navigateTo = getNavigateTo(notification);

      toast(notification.actorName ?? 'Thông báo mới', {
        description: actionText[notification.type] ?? notification.message,
        icon: <Icon size={16} color={cfg?.color ?? '#3b82f6'} />,
        duration: 5000,
        action: navigateTo
          ? { label: 'Xem', onClick: () => navigateRef.current(navigateTo) }
          : undefined,
      });
    });

    connection.on('NewPost', () => setHasNewPosts(true));

    connection.start().catch((err) => {
      if (isMounted) console.error('SignalR connection failed:', err);
    });
    connectionRef.current = connection;

    return () => {
      isMounted = false;
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [isAuthenticated, dispatch]);

  return { hasNewPosts, dismissNewPosts };
}
