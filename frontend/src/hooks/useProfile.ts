import { useState, useCallback } from 'react';
import type { UserProfile, FriendshipStatus } from '@/types';
import { userService } from '@/services/userService';

export function useProfile(username: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await userService.getProfile(username);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  const sendFriendRequest = useCallback(async () => {
    if (!profile) return;

    const prevStatus = profile.friendshipStatus;
    setProfile((p) => (p ? { ...p, friendshipStatus: 'pending', isRequester: true } : p));

    try {
      await userService.sendFriendRequest(profile.id);
    } catch {
      setProfile((p) => (p ? { ...p, friendshipStatus: prevStatus } : p));
    }
  }, [profile]);

  const cancelFriendRequest = useCallback(async () => {
    if (!profile) return;

    const prevStatus = profile.friendshipStatus;
    setProfile((p) => (p ? { ...p, friendshipStatus: null } : p));

    try {
      await userService.cancelFriendRequest(profile.id);
    } catch {
      setProfile((p) => (p ? { ...p, friendshipStatus: prevStatus } : p));
    }
  }, [profile]);

  const acceptFriendRequest = useCallback(async () => {
    if (!profile) return;

    const prevStatus = profile.friendshipStatus;
    const prevCount = profile.friendsCount;
    setProfile((p) =>
      p ? { ...p, friendshipStatus: 'accepted', friendsCount: p.friendsCount + 1 } : p,
    );

    try {
      await userService.respondFriendRequestByUserId(profile.id, true);
    } catch {
      setProfile((p) =>
        p ? { ...p, friendshipStatus: prevStatus, friendsCount: prevCount } : p,
      );
    }
  }, [profile]);

  const rejectFriendRequest = useCallback(async () => {
    if (!profile) return;

    const prevStatus = profile.friendshipStatus;
    setProfile((p) => (p ? { ...p, friendshipStatus: null } : p));

    try {
      await userService.respondFriendRequestByUserId(profile.id, false);
    } catch {
      setProfile((p) => (p ? { ...p, friendshipStatus: prevStatus } : p));
    }
  }, [profile]);

  const unfriend = useCallback(async () => {
    if (!profile) return;

    const prevStatus = profile.friendshipStatus;
    const prevCount = profile.friendsCount;
    setProfile((p) =>
      p ? { ...p, friendshipStatus: null, friendsCount: p.friendsCount - 1 } : p,
    );

    try {
      await userService.unfriend(profile.id);
    } catch {
      setProfile((p) =>
        p ? { ...p, friendshipStatus: prevStatus, friendsCount: prevCount } : p,
      );
    }
  }, [profile]);

  const updateFriendshipStatus = useCallback((status: FriendshipStatus | null) => {
    setProfile((p) => {
      if (!p) return p;
      const countDelta = status === 'accepted' && p.friendshipStatus !== 'accepted' ? 1 : 0;
      return { ...p, friendshipStatus: status, friendsCount: p.friendsCount + countDelta };
    });
  }, []);

  return {
    profile,
    isLoading,
    load,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriend,
    updateFriendshipStatus,
  };
}
