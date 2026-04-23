import { memo } from 'react';
import { Link } from 'react-router';
import {
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Bookmark,
} from 'lucide-react';
import { timeAgo } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import type { Notification, NotificationType } from '@/types';

// ─── Icon badge config ────────────────────────────────────────────────────────

const iconConfig: Record<
  NotificationType,
  { icon: React.ElementType; bg: string; text: string }
> = {
  FriendRequestReceived: { icon: UserPlus,       bg: 'bg-success',  text: 'text-white' },
  FriendRequestAccepted: { icon: Users,           bg: 'bg-success',  text: 'text-white' },
  NewMessage:            { icon: MessageCircle,   bg: 'bg-primary',  text: 'text-white' },
  PostLiked:             { icon: Heart,           bg: 'bg-accent',   text: 'text-white' },
  PostCommented:         { icon: MessageCircle,   bg: 'bg-primary',  text: 'text-white' },
  PostSaved:             { icon: Bookmark,        bg: 'bg-warning',  text: 'text-white' },
};

const actionText: Record<NotificationType, string> = {
  FriendRequestReceived: 'đã gửi lời mời kết bạn cho bạn.',
  FriendRequestAccepted: 'đã chấp nhận lời mời kết bạn.',
  NewMessage:            'đã nhắn tin cho bạn.',
  PostLiked:             'đã thích bài viết của bạn.',
  PostCommented:         'đã bình luận bài viết của bạn.',
  PostSaved:             'đã lưu bài viết của bạn.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getNavigateTo(n: Notification): string | undefined {
  switch (n.type) {
    case 'FriendRequestReceived':
    case 'FriendRequestAccepted':
      return n.actorUsername ? `/profile/${n.actorUsername}` : undefined;
    case 'NewMessage':
      return '/chat';
    // PostLiked / PostCommented / PostSaved: chưa có route post
    default:
      return undefined;
  }
}

const isPostNotification = (type: NotificationType) =>
  type === 'PostLiked' || type === 'PostCommented' || type === 'PostSaved';

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
}

export const NotificationItem = memo(function NotificationItem({
  notification: n,
  onMarkRead,
}: NotificationItemProps) {
  const config = iconConfig[n.type];
  const Icon = config?.icon ?? MessageCircle;
  const navigateTo = getNavigateTo(n);

  const handleClick = () => {
    if (!n.isRead) onMarkRead(n.id);
  };

  const content = (
    <div
      onClick={handleClick}
      className={cn(
        'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
        n.isRead ? 'hover:bg-bg' : 'bg-primary/5 hover:bg-primary/10',
      )}
    >
      {/* Avatar + icon badge */}
      <div className="relative shrink-0">
        {n.actorAvatar ? (
          <img
            src={n.actorAvatar}
            alt={n.actorName ?? ''}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-border text-sm font-semibold text-text-secondary">
            {getInitials(n.actorName)}
          </div>
        )}
        {config && (
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-bg-card',
              config.bg,
              config.text,
            )}
          >
            <Icon className="h-2.5 w-2.5" />
          </span>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-text-primary">
          {n.actorName && (
            <span className="font-semibold">{n.actorName} </span>
          )}
          {actionText[n.type] ?? n.message}
        </p>
        <p className="mt-0.5 text-[11px] text-text-secondary">
          {timeAgo(n.createdAt)}
        </p>
      </div>

      {/* Post thumbnail slot (PostLiked / PostCommented / PostSaved) */}
      {isPostNotification(n.type) && (
        <div className="h-11 w-11 shrink-0 rounded-sm bg-border" />
      )}

      {/* Unread dot */}
      {!n.isRead && !isPostNotification(n.type) && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );

  if (navigateTo) {
    return (
      <Link to={navigateTo} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
});
