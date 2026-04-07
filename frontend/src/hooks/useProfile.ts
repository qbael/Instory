import { useState, useCallback } from 'react';
import type { UserProfile } from '@/types';
import { userService } from '@/services/userService';

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await userService.getProfile(userId);
      setProfile(data.data);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const toggleFollow = useCallback(async () => {
    if (!profile) return;

    const numId = Number(userId);
    setProfile((p) =>
      p
        ? {
            ...p,
            isFollowing: !p.isFollowing,
            followersCount: p.isFollowing
              ? p.followersCount - 1
              : p.followersCount + 1,
          }
        : p,
    );

    try {
      if (profile.isFollowing) await userService.unfollow(numId);
      else await userService.follow(numId);
    } catch {
      setProfile((p) =>
        p
          ? {
              ...p,
              isFollowing: !p.isFollowing,
              followersCount: p.isFollowing
                ? p.followersCount - 1
                : p.followersCount + 1,
            }
          : p,
      );
    }
  }, [profile, userId]);

  return { profile, isLoading, load, toggleFollow };
}
