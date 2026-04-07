import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Grid3X3, Film, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useAppSelector } from '@/store';
import { cn } from '@/utils/cn';

type Tab = 'posts' | 'stories';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isOwn = currentUser?.id === Number(userId);

  const { profile, isLoading: profileLoading, load: loadProfile, toggleFollow } =
    useProfile(userId!);
  const { posts, isLoading: postsLoading, hasMore, loadMore, fetchPage } =
    usePosts({ userId: Number(userId) });
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: postsLoading,
    onLoadMore: loadMore,
  });

  const [tab, setTab] = useState<Tab>('posts');

  useEffect(() => {
    loadProfile();
    fetchPage(1);
  }, [loadProfile, fetchPage]);

  if (profileLoading && !profile) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg font-semibold">User not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Profile header */}
      <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-16">
        {/* Avatar */}
        <Avatar
          src={profile.avatarUrl}
          alt={profile.fullName ?? profile.userName}
          size="xl"
          className="!h-[150px] !w-[150px] md:ml-8"
        />

        {/* Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="mb-4 flex flex-col items-center gap-3 md:flex-row">
            <h1 className="text-xl font-normal">{profile.userName}</h1>
            {isOwn ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/profile/edit')}
                >
                  Edit profile
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button
                variant={profile.isFollowing ? 'secondary' : 'primary'}
                size="sm"
                onClick={toggleFollow}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="mb-4 flex justify-center gap-8 md:justify-start">
            <span className="text-base">
              <strong>{profile.postsCount}</strong>{' '}
              <span className="text-text-secondary">posts</span>
            </span>
            <button type="button" className="cursor-pointer text-base">
              <strong>{profile.followersCount.toLocaleString()}</strong>{' '}
              <span className="text-text-secondary">followers</span>
            </button>
            <button type="button" className="cursor-pointer text-base">
              <strong>{profile.followingCount.toLocaleString()}</strong>{' '}
              <span className="text-text-secondary">following</span>
            </button>
          </div>

          {/* Name & Bio */}
          {profile.fullName && (
            <p className="text-sm font-semibold">{profile.fullName}</p>
          )}
          {profile.bio && (
            <p className="mt-0.5 whitespace-pre-line text-sm">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-border">
        <button
          type="button"
          onClick={() => setTab('posts')}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-t py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
            tab === 'posts'
              ? 'border-text-primary text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary',
          )}
        >
          <Grid3X3 className="h-3.5 w-3.5" /> Posts
        </button>
        <button
          type="button"
          onClick={() => setTab('stories')}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-t py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
            tab === 'stories'
              ? 'border-text-primary text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary',
          )}
        >
          <Film className="h-3.5 w-3.5" /> Stories
        </button>
      </div>

      {/* Posts grid */}
      {tab === 'posts' && (
        <>
          {posts.length === 0 && !postsLoading && (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold">No Posts Yet</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1 pt-1">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/profile/${userId}`}
                className="group relative aspect-square overflow-hidden bg-border"
              >
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-bg p-2">
                    <p className="line-clamp-3 text-center text-xs text-text-secondary">
                      {post.content}
                    </p>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                    ❤️ {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                    💬 {post.commentsCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-4">
            {postsLoading && <Spinner />}
          </div>
        </>
      )}

      {tab === 'stories' && (
        <div className="py-16 text-center text-sm text-text-secondary">
          Story highlights will appear here
        </div>
      )}
    </div>
  );
}
