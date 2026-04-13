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
import { addRealtimeNotification } from '@/store/slices/notificationSlice';
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

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
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

  // Stable refs — SignalR handlers always see latest values without triggering reconnect
  const navigateRef = useRef(navigate);
  const locationRef = useRef(location.pathname);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { locationRef.current = location.pathname; }, [location.pathname]);

  // SignalR connect/disconnect — only depends on isAuthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      connectionRef.current?.stop();
      connectionRef.current = null;
      return;
    }

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

      toast.custom(
        (id) => (
          <div
            onClick={() => {
              toast.dismiss(id);
              if (navigateTo) navigateRef.current(navigateTo);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '340px',
              cursor: 'pointer',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-card)',
              padding: '12px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}
          >
            {/* Avatar + icon badge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {notification.actorAvatar ? (
                <img
                  src={notification.actorAvatar}
                  alt={notification.actorName ?? ''}
                  style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                }}>
                  {getInitials(notification.actorName)}
                </div>
              )}
              <span style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 20, height: 20, borderRadius: '50%',
                background: cfg?.color ?? '#3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 2px var(--color-bg-card)',
              }}>
                <Icon style={{ width: 10, height: 10, color: '#fff' }} />
              </span>
            </div>

            {/* Text */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{
                margin: 0, fontSize: 13, lineHeight: 1.4,
                color: 'var(--color-text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {notification.actorName && (
                  <span style={{ fontWeight: 600 }}>{notification.actorName} </span>
                )}
                {actionText[notification.type] ?? notification.message}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-text-secondary)' }}>
                Vừa xong
              </p>
            </div>
          </div>
        ),
        { duration: 5000 },
      );
    });

    connection.on('NewPost', () => setHasNewPosts(true));

    connection.start().catch((err) => console.error('SignalR connection failed:', err));
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
