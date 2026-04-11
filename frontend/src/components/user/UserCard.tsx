import { memo, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/userService';
import type { User } from '@/types';

interface UserCardProps {
  user: User;
  showFollowButton?: boolean;
}

export const UserCard = memo(function UserCard({
  user,
  showFollowButton = true,
}: UserCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      if (isFollowing) {
        await userService.unfollow(user.id);
      } else {
        await userService.follow(user.id);
      }
      setIsFollowing((prev) => !prev);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-border/10">
      <Link to={`/profile/${user.id}`}>
        <Avatar src={user.avatarUrl} alt={user.userName} size="md" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to={`/profile/${user.id}`}
          className="block truncate text-sm font-semibold text-text-primary no-underline hover:underline"
        >
          {user.userName}
        </Link>
        {user.fullName && (
          <p className="truncate text-xs text-text-secondary">{user.fullName}</p>
        )}
      </div>
      {showFollowButton && (
        <Button
          variant={isFollowing ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleFollow}
          isLoading={isLoading}
        >
          {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
        </Button>
      )}
    </div>
  );
});
