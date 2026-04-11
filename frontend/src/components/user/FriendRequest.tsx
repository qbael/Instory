import { memo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import { timeAgo } from '@/utils/formatDate';
import type { Friendship } from '@/types';

interface FriendRequestProps {
  request: Friendship;
  onResponded?: () => void;
}

export const FriendRequest = memo(function FriendRequest({
  request,
  onResponded,
}: FriendRequestProps) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>(
    request.status,
  );
  const [isLoading, setIsLoading] = useState(false);

  const respond = async (accept: boolean) => {
    setIsLoading(true);
    try {
      await userService.respondFriendRequest(request.id, accept);
      setStatus(accept ? 'accepted' : 'declined');
      onResponded?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-3">
      <Link to={`/profile/${request.requesterId}`}>
        <Avatar
          src={request.requester.avatarUrl}
          alt={request.requester.userName}
          size="md"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <Link
            to={`/profile/${request.requesterId}`}
            className="font-semibold text-text-primary no-underline hover:underline"
          >
            {request.requester.userName}
          </Link>{' '}
          <span className="text-text-secondary">đã gửi lời mời kết bạn cho bạn</span>
        </p>
        <p className="text-[11px] text-text-secondary">
          {timeAgo(request.createdAt)}
        </p>
      </div>

      {status === 'pending' ? (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => respond(true)} isLoading={isLoading}>
            Chấp nhận
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => respond(false)}
            disabled={isLoading}
          >
            Từ chối
          </Button>
        </div>
      ) : (
        <span className="text-xs font-medium text-text-secondary">
          {status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
        </span>
      )}
    </div>
  );
});
