import { useState, useCallback } from 'react';
import type { UserProfile } from '@/types';
import { userService } from '@/services/userService';

const MOCK_PROFILES: Record<string, UserProfile> = {
  '1': {
    id: 1,
    userName: 'mindang',
    email: 'mindang@example.com',
    fullName: 'Trần Minh Đăng',
    bio: '📸 Photography | 💻 Developer\nHCMC, Vietnam',
    avatarUrl: 'https://i.pravatar.cc/300?u=mindang',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: null,
    postsCount: 12,
    followersCount: 90,
    followingCount: 100,
    isFollowing: false,
    friendshipStatus: null,
  },
  '2': {
    id: 2,
    userName: 'janedoe',
    email: 'jane@example.com',
    fullName: 'Jane Doe',
    bio: '✨ Living my best life\n🎨 Digital artist & coffee lover',
    avatarUrl: 'https://i.pravatar.cc/300?u=janedoe',
    createdAt: '2025-02-15T00:00:00Z',
    updatedAt: null,
    postsCount: 24,
    followersCount: 340,
    followingCount: 180,
    isFollowing: true,
    friendshipStatus: null,
  },
  '3': {
    id: 3,
    userName: 'photoking',
    email: 'photo@example.com',
    fullName: 'Nguyễn Văn A',
    bio: '📷 Photographer\nBookings: DM me',
    avatarUrl: 'https://i.pravatar.cc/300?u=photoking',
    createdAt: '2025-03-10T00:00:00Z',
    updatedAt: null,
    postsCount: 56,
    followersCount: 1200,
    followingCount: 320,
    isFollowing: false,
    friendshipStatus: null,
  },
};

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await userService.getProfile(userId);
      setProfile(data.data);
    } catch {
      const mock = MOCK_PROFILES[userId];
      if (mock) setProfile(mock);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const toggleFollow = useCallback(async () => {
    const numId = Number(userId);
    let wasFollowing = false;

    setProfile((p) => {
      if (!p) return p;
      wasFollowing = p.isFollowing;
      return {
        ...p,
        isFollowing: !p.isFollowing,
        followersCount: p.isFollowing
          ? p.followersCount - 1
          : p.followersCount + 1,
      };
    });

    try {
      if (wasFollowing) await userService.unfollow(numId);
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
  }, [userId]);

  return { profile, isLoading, load, toggleFollow };
}
