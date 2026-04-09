import { useEffect, useMemo } from 'react';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { NotificationItem } from '@/components/notification/NotificationItem';
import { NotificationSkeleton } from '@/components/notification/NotificationSkeleton';
import { useNotifications } from '@/hooks/useNotifications';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import type { Notification } from '@/types';

const DAY = 86_400_000;
const WEEK = 7 * DAY;

function groupNotifications(items: Notification[]) {
  const now = Date.now();
  const groups: { label: string; items: Notification[] }[] = [
    { label: 'Hôm nay', items: [] },
    { label: 'Tuần này', items: [] },
    { label: 'Trước đó', items: [] },
  ];

  for (const n of items) {
    const diff = now - new Date(n.createdAt).getTime();
    if (diff < DAY) groups[0].items.push(n);
    else if (diff < WEEK) groups[1].items.push(n);
    else groups[2].items.push(n);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    load,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: loadMore,
  });

  useEffect(() => {
    load(1);
  }, [load]);

  const groups = useMemo(() => groupNotifications(notifications), [notifications]);

  const showSkeletons = isLoading && notifications.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Thông báo</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Skeletons */}
      {showSkeletons && (
        <div className="rounded-lg border border-border bg-bg-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Grouped notifications */}
      {groups.map((group) => (
        <div key={group.label} className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            {group.label}
          </h2>
          <div className="rounded-lg border border-border bg-bg-card">
            {group.items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={markAsRead}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isLoading && notifications.length > 0 && <Spinner />}
      </div>

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-lg font-semibold text-text-primary">
            Chưa có thông báo
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Khi ai đó tương tác với bài viết của bạn, bạn sẽ thấy ở đây.
          </p>
        </div>
      )}
    </div>
  );
}
