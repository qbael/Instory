import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  Grid3X3,
  Heart,
  Bookmark,
  Settings,
  MessageCircle,
  UserPlus,
  Camera,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ProfileHighlights } from '@/components/profile/ProfileHighlights';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useAppSelector } from '@/store';
import { cn } from '@/utils/cn';
import type { StoryHighlight, Post } from '@/types';

type OwnTab = 'posts' | 'liked' | 'saved';
type OtherTab = 'posts';
type Tab = OwnTab | OtherTab;

// ── Mock data (xóa khi backend sẵn sàng) ────────────────────────────────────

const MOCK_USER = {
  id: 0,
  userName: '',
  email: '',
  fullName: null as string | null,
  bio: null as string | null,
  avatarUrl: null as string | null,
  createdAt: new Date().toISOString(),
  updatedAt: null,
};

const MOCK_HIGHLIGHTS: StoryHighlight[] = [
  {
    id: 1,
    userId: 1,
    title: 'Du lịch',
    coverUrl: 'https://picsum.photos/seed/hl1/200',
    stories: [
      {
        id: 101,
        userId: 1,
        mediaUrl: 'https://picsum.photos/seed/s1/1080/1920',
        caption: 'Đà Lạt trip 🌸',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        user: { ...MOCK_USER, id: 1 },
        viewsCount: 42,
        isViewed: false,
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    title: 'Ẩm thực',
    coverUrl: 'https://picsum.photos/seed/hl2/200',
    stories: [
      {
        id: 102,
        userId: 1,
        mediaUrl: 'https://picsum.photos/seed/s2/1080/1920',
        caption: 'Phở Hà Nội 🍜',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        user: { ...MOCK_USER, id: 1 },
        viewsCount: 28,
        isViewed: true,
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    title: 'Gym',
    coverUrl: 'https://picsum.photos/seed/hl3/200',
    stories: [
      {
        id: 103,
        userId: 1,
        mediaUrl: 'https://picsum.photos/seed/s3/1080/1920',
        caption: 'Leg day 💪',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        user: { ...MOCK_USER, id: 1 },
        viewsCount: 15,
        isViewed: false,
      },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    userId: 1,
    title: 'Coding',
    coverUrl: 'https://picsum.photos/seed/hl4/200',
    stories: [
      {
        id: 104,
        userId: 1,
        mediaUrl: 'https://picsum.photos/seed/s4/1080/1920',
        caption: 'Late night coding 💻',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date(Date.now() - 14400000).toISOString(),
        user: { ...MOCK_USER, id: 1 },
        viewsCount: 33,
        isViewed: true,
      },
    ],
    createdAt: new Date().toISOString(),
  },
];

const MOCK_LIKED_POSTS: Post[] = Array.from({ length: 6 }, (_, i) => ({
  id: 900 + i,
  userId: 99,
  content: `Bài viết đã thích #${i + 1}`,
  imageUrl: `https://picsum.photos/seed/liked${i}/600`,
  createdAt: new Date().toISOString(),
  updatedAt: null,
  user: { ...MOCK_USER, id: 99, userName: 'other_user' },
  commentsCount: Math.floor(Math.random() * 20),
  likesCount: Math.floor(Math.random() * 100),
  sharesCount: 0,
  isLiked: true,
  hashtags: [],
}));

const MOCK_SAVED_POSTS: Post[] = Array.from({ length: 4 }, (_, i) => ({
  id: 800 + i,
  userId: 98,
  content: `Bài viết đã lưu #${i + 1}`,
  imageUrl: `https://picsum.photos/seed/saved${i}/600`,
  createdAt: new Date().toISOString(),
  updatedAt: null,
  user: { ...MOCK_USER, id: 98, userName: 'saved_user' },
  commentsCount: Math.floor(Math.random() * 15),
  likesCount: Math.floor(Math.random() * 80),
  sharesCount: 0,
  isLiked: false,
  hashtags: [],
}));

// ─────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isOwn = currentUser?.id === Number(userId);

  const {
    profile,
    isLoading: profileLoading,
    load: loadProfile,
    toggleFollow,
  } = useProfile(userId!);
  const {
    posts,
    isLoading: postsLoading,
    hasMore,
    loadMore,
    fetchPage,
  } = usePosts({ userId: Number(userId) });
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: postsLoading,
    onLoadMore: loadMore,
  });

  const [tab, setTab] = useState<Tab>('posts');

  const highlights = useMemo(() => MOCK_HIGHLIGHTS, []);

  useEffect(() => {
    loadProfile();
    fetchPage(1);
  }, [loadProfile, fetchPage]);

  useEffect(() => {
    setTab('posts');
  }, [userId]);

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
        <p className="text-lg font-semibold">Không tìm thấy người dùng</p>
      </div>
    );
  }

  const currentPosts =
    tab === 'liked'
      ? MOCK_LIKED_POSTS
      : tab === 'saved'
        ? MOCK_SAVED_POSTS
        : posts;

  return (
    <div className="mx-auto max-w-[935px]">
      {/* ── Profile header ───────────────────────────────────────────── */}
      <header className="px-4 pt-6 pb-2">
        {/* Row: Avatar + Info */}
        <div className="flex gap-6">
          {/* Avatar */}
          <div className="group relative shrink-0">
            <Avatar
              src={profile.avatarUrl}
              alt={profile.fullName ?? profile.userName}
              size="xl"
              className="!h-20 !w-20"
            />
            {isOwn && (
              <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {/* Info (right of avatar) */}
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            {/* Username row */}
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-normal">
                {profile.userName}
              </h1>
              {isOwn && (
                <button
                  type="button"
                  className="shrink-0 cursor-pointer p-0.5 text-text-primary hover:text-text-secondary"
                >
                  <Settings className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Name */}
            {profile.fullName && (
              <p className="mt-0.5 text-sm font-semibold">
                {profile.fullName}
              </p>
            )}

            {/* Stats inline */}
            <div className="mt-1 flex flex-wrap gap-x-5 text-sm">
              <span>
                <strong>{profile.postsCount}</strong>{' '}
                bài viết
              </span>
              <button type="button" className="cursor-pointer">
                <strong>{profile.followersCount.toLocaleString()}</strong>{' '}
                người theo dõi
              </button>
              <button type="button" className="cursor-pointer">
                Đang theo dõi{' '}
                <strong>{profile.followingCount.toLocaleString()}</strong>{' '}
                người dùng
              </button>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-1 whitespace-pre-line text-sm">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Action buttons (full-width, below header row) */}
        <div className="mt-4 flex gap-1.5">
          {isOwn ? (
            <>
              <button
                type="button"
                onClick={() => navigate('/profile/edit')}
                className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
              >
                Chỉnh sửa trang cá nhân
              </button>
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
              >
                Xem kho lưu trữ
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleFollow}
                className={cn(
                  'flex-1 cursor-pointer rounded-lg px-4 py-[7px] text-center text-sm font-semibold transition-colors',
                  profile.isFollowing
                    ? 'bg-border/60 text-text-primary hover:bg-border'
                    : 'bg-primary text-white hover:bg-primary-hover',
                )}
              >
                {profile.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </button>
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
              >
                Nhắn tin
              </button>
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded-lg bg-border/60 px-3 py-[7px] text-text-primary transition-colors hover:bg-border"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Story highlights ─────────────────────────────────────────── */}
      <ProfileHighlights highlights={highlights} isOwn={isOwn} />

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="mt-2 flex border-t border-border">
        <TabButton
          active={tab === 'posts'}
          onClick={() => setTab('posts')}
          icon={<Grid3X3 className="h-3 w-3" />}
          label="Bài viết"
        />
        {isOwn && (
          <>
            <TabButton
              active={tab === 'liked'}
              onClick={() => setTab('liked')}
              icon={<Heart className="h-3 w-3" />}
              label="Đã thích"
            />
            <TabButton
              active={tab === 'saved'}
              onClick={() => setTab('saved')}
              icon={<Bookmark className="h-3 w-3" />}
              label="Đã lưu"
            />
          </>
        )}
      </div>

      {/* ── Grid content ─────────────────────────────────────────────── */}
      {currentPosts.length === 0 && !postsLoading && (
        <EmptyTab tab={tab} isOwn={isOwn} />
      )}

      <div className="grid grid-cols-3 gap-1 pt-0.5">
        {currentPosts.map((post) => (
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
              <div className="flex h-full w-full items-center justify-center bg-bg p-3">
                <p className="line-clamp-4 text-center text-xs text-text-secondary">
                  {post.content}
                </p>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Heart className="h-5 w-5 fill-white" /> {post.likesCount}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <MessageCircle className="h-5 w-5 fill-white" />{' '}
                {post.commentsCount}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {tab === 'posts' && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {postsLoading && <Spinner />}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-t py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
        active
          ? 'border-text-primary text-text-primary'
          : 'border-transparent text-text-secondary hover:text-text-primary',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyTab({ tab, isOwn }: { tab: Tab; isOwn: boolean }) {
  const messages: Record<Tab, { title: string; subtitle: string }> = {
    posts: {
      title: isOwn ? 'Chia sẻ ảnh' : 'Chưa có bài viết',
      subtitle: isOwn
        ? 'Khi bạn chia sẻ ảnh, ảnh sẽ xuất hiện trên trang cá nhân của bạn.'
        : 'Người dùng này chưa đăng bài viết nào.',
    },
    liked: {
      title: 'Chưa thích bài viết nào',
      subtitle: 'Khi bạn thích bài viết, chúng sẽ xuất hiện ở đây.',
    },
    saved: {
      title: 'Chưa lưu bài viết nào',
      subtitle: 'Lưu ảnh và video mà bạn muốn xem lại.',
    },
  };

  const { title, subtitle } = messages[tab];

  return (
    <div className="flex flex-col items-center py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-text-primary">
        {tab === 'posts' && <Camera className="h-8 w-8" strokeWidth={1} />}
        {tab === 'liked' && <Heart className="h-8 w-8" strokeWidth={1} />}
        {tab === 'saved' && <Bookmark className="h-8 w-8" strokeWidth={1} />}
      </div>
      <h2 className="mb-1 text-2xl font-extrabold">{title}</h2>
      <p className="max-w-xs text-center text-sm text-text-secondary">
        {subtitle}
      </p>
    </div>
  );
}
