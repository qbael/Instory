import { memo } from 'react';
import { Link } from 'react-router';
import { Heart, MessageCircle, UserPlus, Users, AtSign, Share2 } from 'lucide-react';
import { timeAgo } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import type { Notification, NotificationType } from '@/types';

const iconMap: Record<NotificationType, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  friend_request: Users,
  friend_accept: Users,
  post_share: Share2,
  mention: AtSign,
};

const colorMap: Record<NotificationType, string> = {
  like: 'text-accent',
  comment: 'text-primary',
  follow: 'text-primary',
  friend_request: 'text-success',
  friend_accept: 'text-success',
  post_share: 'text-primary',
  mention: 'text-warning',
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const Icon = iconMap[notification.type] ?? Heart;
  const color = colorMap[notification.type] ?? 'text-text-secondary';

  const profileLink =
    notification.type === 'follow' ||
    notification.type === 'friend_request' ||
    notification.type === 'friend_accept'
      ? `/profile/${notification.referenceId}`
      : undefined;

  const handleClick = () => {
    if (!notification.isRead) onMarkRead(notification.id);
  };

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
        notification.isRead ? 'hover:bg-border/10' : 'bg-primary/5 hover:bg-primary/10',
      )}
      onClick={handleClick}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full bg-bg',
            color,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {!notification.isRead && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-bg-card" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-primary">
          {notification.message ?? notificationLabel(notification.type)}
        </p>
        <p className="mt-0.5 text-[11px] text-text-secondary">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  if (profileLink) {
    return (
      <Link to={profileLink} className="block no-underline">
        {content}
      </Link>
    );
  }

  return <div className="cursor-pointer">{content}</div>;
});

function notificationLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    like: 'đã thích bài viết của bạn',
    comment: 'đã bình luận bài viết của bạn',
    follow: 'đã bắt đầu theo dõi bạn',
    friend_request: 'đã gửi lời mời kết bạn',
    friend_accept: 'đã chấp nhận lời mời kết bạn',
    post_share: 'đã chia sẻ bài viết của bạn',
    mention: 'đã nhắc đến bạn trong bình luận',
  };
  return labels[type];
}
