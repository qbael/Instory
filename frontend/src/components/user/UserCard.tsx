import { memo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import type { User, FriendshipStatus } from '@/types';

interface UserCardProps {
  user: User;
  friendshipStatus?: FriendshipStatus | null;
  showFriendButton?: boolean;
}

export const UserCard = memo(function UserCard({
  user,
  friendshipStatus: initialStatus = null,
  showFriendButton = true,
}: UserCardProps) {
  const [status, setStatus] = useState<FriendshipStatus | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleFriendAction = async () => {
    setIsLoading(true);
    try {
      if (status === 'accepted') {
        await userService.unfriend(user.id);
        setStatus(null);
      } else if (status === 'pending') {
        await userService.cancelFriendRequest(user.id);
        setStatus(null);
      } else {
        await userService.sendFriendRequest(user.id);
        setStatus('pending');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const buttonLabel =
    status === 'accepted'
      ? 'Bạn bè'
      : status === 'pending'
        ? 'Đã gửi lời mời'
        : 'Kết bạn';

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-border/10">
      <Link to={`/profile/${user.userName}`}>
        <Avatar src={user.avatarUrl} alt={user.userName} size="md" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/profile/${user.userName}`}
          className="block truncate text-sm font-semibold text-text-primary no-underline hover:underline"
        >
          {user.userName}
        </Link>
        {user.fullName && (
          <p className="truncate text-xs text-text-secondary">{user.fullName}</p>
        )}
      </div>
      {showFriendButton && (
        <Button
          variant={status ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleFriendAction}
          isLoading={isLoading}
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
});
