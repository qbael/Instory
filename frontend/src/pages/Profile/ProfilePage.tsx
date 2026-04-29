import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { PostDetailModal } from '@/components/post/PostDetailModal';
import {
  Grid3X3,
  Heart,
  Send,
  Settings,
  MessageCircle,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck,
  Camera,
  Plus,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { AlertDialog } from '@/components/ui/AlertDialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu';
import { ProfileHighlights } from '@/components/profile/ProfileHighlights';
import { StoryViewer } from '@/components/story/StoryViewer';
import { highlightService } from '@/services/highlightService';
import { storyService } from '@/services/storyService';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useAppSelector, useAppDispatch } from '@/store';
import { getOrCreateDirectChat } from '@/store/slices/chatSlice';
import { openModal } from '@/store/slices/uiSlice';
import { cn } from '@/utils/cn';
import type { StoryHighlight, StoryGroup } from '@/types';

type OwnTab = 'posts' | 'liked' | 'shared';
type OtherTab = 'posts';
type Tab = OwnTab | OtherTab;

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
    posts: ownPosts,
    isLoading: ownPostsLoading,
    hasMore: ownHasMore,
    loadMore: ownLoadMore,
    fetchPage,
    toggleLike,
    handleIncreaseCommentCount,
    handleDeletePostFromUI,
  } = usePosts({ userId: profile?.id ?? 0 });

  const {
    posts: sharedPosts,
    isLoading: sharedLoading,
    hasMore: sharedHasMore,
    loadMore: sharedLoadMore,
    fetchPage: fetchSharedPage,
  } = usePosts(profile?.id ? { sharedByUserId: profile.id } : 'none');

  const {
    posts: likedPosts,
    isLoading: likedLoading,
    hasMore: likedHasMore,
    loadMore: likedLoadMore,
    fetchPage: fetchLikedPage,
  } = usePosts(profile?.id ? { likedByUserId: profile.id } : 'none');

  const [tab, setTab] = useState<Tab>('posts');
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  // Chọn đúng danh sách bài theo tab đang active
  const posts = tab === 'posts' ? ownPosts : tab === 'liked' ? likedPosts : sharedPosts;
  const postsLoading = tab === 'posts' ? ownPostsLoading : tab === 'liked' ? likedLoading : sharedLoading;
  const hasMore = tab === 'posts' ? ownHasMore : tab === 'liked' ? likedHasMore : sharedHasMore;
  const loadMore = tab === 'posts' ? ownLoadMore : tab === 'liked' ? likedLoadMore : sharedLoadMore;

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: postsLoading,
    onLoadMore: loadMore,
  });

  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [storyGroup, setStoryGroup] = useState<StoryGroup | null>(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);

  const loadStories = useCallback(() => {
    if (!profile?.id) return;
    storyService
      .getByUser(profile.id)
      .then(({ data }) => setStoryGroup(data))
      .catch(() => setStoryGroup(null));
  }, [profile?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.id) { fetchPage(1); fetchSharedPage(1); fetchLikedPage(1); }
  }, [profile?.id, fetchPage, fetchSharedPage, fetchLikedPage]);

  const loadHighlights = useCallback(() => {
    if (!profile?.id) return;
    highlightService
      .getByUser(profile.id)
      .then(({ data }) => setHighlights(data))
      .catch(() => {});
  }, [profile?.id]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights]);

  useEffect(() => {
    window.addEventListener('highlight-created', loadHighlights);
    return () => window.removeEventListener('highlight-created', loadHighlights);
  }, [loadHighlights]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    window.addEventListener('story-created', loadStories);
    return () => window.removeEventListener('story-created', loadStories);
  }, [loadStories]);

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

  const currentPosts = posts;

  return (
    <div className="mx-auto max-w-[935px]">
      {/* ── Profile header ───────────────────────────────────────────── */}
      <header className="px-4 pt-6 pb-2">
        {/* Row: Avatar + Info */}
        <div className="flex gap-6">
          {/* Avatar */}
          <div className="group relative shrink-0">
            <div
              className={cn(
                'rounded-full p-[2px]',
                storyGroup
                  ? storyGroup.hasUnviewed
                    ? 'bg-gradient-to-tr from-warning via-accent to-primary'
                    : 'bg-border'
                  : 'bg-transparent',
              )}
              onClick={
                storyGroup
                  ? () => setStoryViewerOpen(true)
                  : isOwn
                    ? () => dispatch(openModal({ modal: 'createStory' }))
                    : undefined
              }
              style={storyGroup || isOwn ? { cursor: 'pointer' } : undefined}
            >
              <div className={cn('rounded-full', storyGroup ? 'bg-bg-card p-[2px]' : '')}>
                <Avatar
                  src={profile.avatarUrl}
                  alt={profile.fullName ?? profile.userName}
                  size="xl"
                  className="!h-20 !w-20"
                />
              </div>
            </div>
            {isOwn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
            {isOwn && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(openModal({ modal: 'createStory' }));
                }}
                className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-primary text-white ring-2 ring-bg-card hover:bg-primary/90"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
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
              <Link
                to="/stories/archive"
                className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
              >
                Xem kho lưu trữ
              </Link>
            </>
          ) : (
            <>
              {profile.friendshipStatus === 'accepted' ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex-1 cursor-pointer rounded-lg bg-border/60 px-4 py-[7px] text-center text-sm font-semibold text-text-primary transition-colors hover:bg-border"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4" />
                        Bạn bè
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onSelect={() => setUnfriendDialogOpen(true)}
                    >
                      <UserMinus className="h-4 w-4" />
                      Hủy kết bạn
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                onClick={async () => {
                  await dispatch(getOrCreateDirectChat(profile.id));
                  navigate('/chat');
                }}
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
              active={tab === 'shared'}
              onClick={() => setTab('shared')}
              icon={<Send className="h-3 w-3" />}
              label="Đã chia sẻ"
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
          <button
            key={post.id}
            type="button"
            onClick={() => setSelectedPostId(post.id)}
            className="group relative aspect-square overflow-hidden bg-border"
          >
            {post.images?.[0]?.imageUrl ? (
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
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {postsLoading && <Spinner />}
        </div>
      )}

      {storyViewerOpen && storyGroup && (
        <StoryViewer
          groups={[storyGroup]}
          initialGroupIndex={0}
          onClose={() => setStoryViewerOpen(false)}
          onDeleted={(storyId) => {
            setStoryGroup((prev) => {
              if (!prev) return prev;
              const stories = prev.stories.filter((s) => s.id !== storyId);
              return stories.length === 0 ? null : { ...prev, stories };
            });
          }}
        />
      )}

      {selectedPostId != null && (() => {
        const post = posts.find((p) => p.id === selectedPostId);
        if (!post) return null;
        return (
          <PostDetailModal
            post={post}
            isLiked={post.isLiked}
            onClose={() => setSelectedPostId(null)}
            onLikeToggle={(id) => { toggleLike(id); }}
            onCommentAdded={handleIncreaseCommentCount}
            onDeleted={(id) => { handleDeletePostFromUI(id); setSelectedPostId(null); }}
          />
        );
      })()}

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
    shared: {
      title: 'Chưa chia sẻ bài viết nào',
      subtitle: 'Khi bạn chia sẻ bài viết của người khác, chúng sẽ xuất hiện ở đây.',
    },
  };

  const { title, subtitle } = messages[tab];

  return (
    <div className="flex flex-col items-center py-16">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-text-primary">
        {tab === 'posts' && <Camera className="h-8 w-8" strokeWidth={1} />}
        {tab === 'liked' && <Heart className="h-8 w-8" strokeWidth={1} />}
        {tab === 'shared' && <Send className="h-8 w-8" strokeWidth={1} />}
      </div>
      <h2 className="mb-1 text-2xl font-extrabold">{title}</h2>
      <p className="max-w-xs text-center text-sm text-text-secondary">
        {subtitle}
      </p>
    </div>
  );
}
