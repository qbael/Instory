import { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  Grid3X3,
  Heart,
  Bookmark,
  Settings,
  MessageCircle,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck,
  Camera,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { ProfileHighlights } from '@/components/profile/ProfileHighlights';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useAppSelector } from '@/store';
import { cn } from '@/utils/cn';
import type { StoryHighlight } from '@/types';

type OwnTab = 'posts' | 'liked' | 'saved';
type OtherTab = 'posts';
type Tab = OwnTab | OtherTab;

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.user);
  const isOwn = currentUser?.userName === username;

  const {
    profile,
    isLoading: profileLoading,
    load: loadProfile,
    sendFriendRequest,
    cancelFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriend,
  } = useProfile(username!);
  const {
    posts,
    isLoading: postsLoading,
    hasMore,
    loadMore,
    fetchPage,
  } = usePosts({ userId: profile?.id ?? 0 });
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: postsLoading,
    onLoadMore: loadMore,
  });

  const [tab, setTab] = useState<Tab>('posts');
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);

  const highlights = useMemo<StoryHighlight[]>(() => [], []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.id) fetchPage(1);
  }, [profile?.id, fetchPage]);

  useEffect(() => {
    setTab('posts');
  }, [username]);

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
    tab === 'liked' || tab === 'saved' ? [] : posts;

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
                <strong>{profile.friendsCount.toLocaleString()}</strong>{' '}
                bạn bè
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
              {profile.friendshipStatus === 'accepted' ? (
                <button
                  type="button"
                  onClick={() => setUnfriendDialogOpen(true)}
                  className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UserMinus className="h-4 w-4" />
                    Hủy kết bạn
                  </span>
                </button>
              ) : profile.friendshipStatus === 'pending' && profile.isRequester ? (
                <button
                  type="button"
                  onClick={cancelFriendRequest}
                  className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UserX className="h-4 w-4" />
                    Hủy lời mời
                  </span>
                </button>
              ) : profile.friendshipStatus === 'pending' && !profile.isRequester ? (
                <>
                  <button
                    type="button"
                    onClick={acceptFriendRequest}
                    className="flex-1 cursor-pointer rounded-lg bg-primary px-4 py-[7px] text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4" />
                      Chấp nhận
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={rejectFriendRequest}
                    className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <UserX className="h-4 w-4" />
                      Từ chối
                    </span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={sendFriendRequest}
                  className="flex-1 cursor-pointer rounded-lg bg-primary px-4 py-[7px] text-center text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4" />
                    Kết bạn
                  </span>
                </button>
              )}
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
              >
                Nhắn tin
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
            to={`/profile/${post.user.userName}`}
            className="group relative aspect-square overflow-hidden bg-border"
          >
            {post.images[0].imageUrl ? (
              <img
                src={post.images[0].imageUrl}
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

      <AlertDialog
        open={unfriendDialogOpen}
        onOpenChange={setUnfriendDialogOpen}
        title={`Hủy kết bạn với ${profile.fullName ?? profile.userName}?`}
        description="Sau khi hủy, bạn sẽ không thể xem các bài viết riêng tư của họ."
        confirmLabel="Hủy kết bạn"
        cancelLabel="Không"
        variant="danger"
        onConfirm={unfriend}
      />
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
