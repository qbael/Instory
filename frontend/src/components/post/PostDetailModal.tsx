import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Smile,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { postService } from '@/services/postService';
import { timeAgo } from '@/utils/formatDate';
import { cn } from '@/utils/cn';
import { useAppSelector } from '@/store';
import type { Post, Comment } from '@/types';

interface PostDetailModalProps {
  post: Post;
  isLiked: boolean;
  onClose: () => void;
  onLikeToggle: (postId: number) => void;
  onCommentAdded?: (postId: number) => void;
  onDeleted?: (postId: number) => void;
}

function renderCaption(content: string) {
  const regex = /(#[\p{L}\p{N}_]+)/gu;
  return content.split(regex).map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <Link key={i} className="font-semibold text-primary" to={`/search?tag=${part.slice(1)}`}>
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function formatPostDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PostDetailModal({
  post,
  isLiked,
  onClose,
  onLikeToggle,
  onCommentAdded,
  onDeleted,
}: PostDetailModalProps) {
  const currentUser = useAppSelector((s) => s.auth.user);
  const isOwnPost = currentUser?.id === post.userId;

  const [imageIndex, setImageIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likesCount);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [localCommentsCount, setLocalCommentsCount] = useState(post.commentsCount);

  const backdropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const images = post.images ?? [];
  const hasMultiple = images.length > 1;

  // Sync isLiked from parent
  useEffect(() => {
    setLocalIsLiked(isLiked);
  }, [isLiked]);

  // Load comments on mount
  useEffect(() => {
    setCommentsLoading(true);
    postService
      .getComments(post.id, { pageNumber: 1, pageSize: 30 })
      .then(({ data }) => setComments(data.data ?? []))
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [post.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (showOptions) setShowOptions(false); else onClose(); }
      if (e.key === 'ArrowLeft' && !showOptions) setImageIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight' && !showOptions) setImageIndex((i) => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, images.length, showOptions]);

  const handleLike = () => {
    setLocalIsLiked((prev) => !prev);
    setLocalLikesCount((prev) => (localIsLiked ? prev - 1 : prev + 1));
    onLikeToggle(post.id);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data } = await postService.addComment(post.id, content);
      const added = data.data;
      setComments((prev) => [
        ...prev,
        {
          ...added,
          createdAt: added.createdAt ?? new Date().toISOString(),
          user: { userName: currentUser?.userName ?? '', avatarUrl: currentUser?.avatarUrl ?? null } as any,
        },
      ]);
      setLocalCommentsCount((c) => c + 1);
      onCommentAdded?.(post.id);
      setNewComment('');
    } catch {
      toast.error('Không thể thêm bình luận');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await postService.delete(post.id);
      toast.success('Đã xóa bài viết');
      onDeleted?.(post.id);
      onClose();
    } catch {
      toast.error('Xóa bài viết thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={(e) => { if (e.target === backdropRef.current && !showOptions) onClose(); }}
    >
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 cursor-pointer text-white/80 hover:text-white"
      >
        <X className="h-7 w-7" />
      </button>

      {/* Main dialog */}
      <div className="flex h-[90vh] max-h-[860px] w-[90vw] max-w-5xl overflow-hidden rounded-none bg-bg-card shadow-2xl sm:rounded-xl">

        {/* ── Left: image ──────────────────────────────────────────── */}
        <div className="relative flex flex-1 items-center justify-center bg-black">
          {images.length > 0 ? (
            <img
              src={images[imageIndex]?.imageUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-8">
              <p className="text-center text-sm text-white/60">{post.content}</p>
            </div>
          )}

          {hasMultiple && imageIndex > 0 && (
            <button
              type="button"
              onClick={() => setImageIndex((i) => i - 1)}
              className="absolute left-2 cursor-pointer rounded-full bg-white/90 p-1 text-black shadow hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {hasMultiple && imageIndex < images.length - 1 && (
            <button
              type="button"
              onClick={() => setImageIndex((i) => i + 1)}
              className="absolute right-2 cursor-pointer rounded-full bg-white/90 p-1 text-black shadow hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {hasMultiple && (
            <div className="absolute bottom-3 flex gap-1.5">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-[6px] w-[6px] rounded-full transition-colors',
                    i === imageIndex ? 'bg-white' : 'bg-white/40',
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Right panel ──────────────────────────────────────────── */}
        <div className="flex w-[380px] shrink-0 flex-col border-l border-border">

          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Link to={`/profile/${post.user.userName}`} onClick={onClose}>
              <Avatar src={post.user.avatarUrl} alt={post.user.userName} size="sm" />
            </Link>
            <Link
              to={`/profile/${post.user.userName}`}
              onClick={onClose}
              className="flex-1 truncate text-sm font-semibold text-text-primary no-underline hover:underline"
            >
              {post.user.userName}
            </Link>
            <button
              type="button"
              onClick={() => setShowOptions(true)}
              className="cursor-pointer rounded-full p-1 text-text-primary hover:text-text-secondary"
            >
              <span className="text-xl font-bold leading-none">···</span>
            </button>
          </div>

          {/* Scrollable: caption + comments */}
          <div className="flex-1 overflow-y-auto">
            {/* Caption */}
            {post.content && (
              <div className="flex gap-3 px-4 py-3">
                <Link to={`/profile/${post.user.userName}`} onClick={onClose} className="shrink-0">
                  <Avatar src={post.user.avatarUrl} alt={post.user.userName} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed">
                    <Link
                      to={`/profile/${post.user.userName}`}
                      onClick={onClose}
                      className="mr-1.5 font-semibold text-text-primary no-underline hover:underline"
                    >
                      {post.user.userName}
                    </Link>
                    {renderCaption(post.content)}
                  </p>
                  <p className="mt-1 text-[11px] text-text-secondary">{timeAgo(post.createdAt)}</p>
                </div>
              </div>
            )}

            {/* Comments */}
            {commentsLoading ? (
              <div className="flex justify-center py-6">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="space-y-4 px-4 pb-3">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar src={c.user?.avatarUrl ?? ''} alt={c.user?.userName ?? ''} size="xs" className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        <span className="mr-1.5 font-semibold">{c.user?.userName}</span>
                        {c.content}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-secondary">{timeAgo(c.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <div className="border-t border-border">
            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleLike}
                  className="cursor-pointer transition-transform active:scale-110"
                  aria-label={localIsLiked ? 'Bỏ thích' : 'Thích'}
                >
                  <Heart
                    className={cn(
                      'h-6 w-6',
                      localIsLiked ? 'fill-red-500 stroke-red-500' : 'stroke-text-primary hover:stroke-text-secondary',
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.focus()}
                  className="cursor-pointer text-text-primary hover:text-text-secondary"
                >
                  <MessageCircle className="h-6 w-6" />
                </button>
                <button type="button" className="cursor-pointer text-text-primary hover:text-text-secondary">
                  <RotateCcw className="h-6 w-6" />
                </button>
                <button type="button" className="cursor-pointer text-text-primary hover:text-text-secondary">
                  <Send className="h-6 w-6" />
                </button>
              </div>
              <button type="button" className="cursor-pointer text-text-primary hover:text-text-secondary">
                <Bookmark className="h-6 w-6" />
              </button>
            </div>

            {/* Likes count */}
            {localLikesCount > 0 && (
              <p className="px-4 pb-1 text-sm font-semibold">
                {localLikesCount.toLocaleString()} lượt thích
              </p>
            )}

            {/* Date */}
            <p className="px-4 pb-2 text-[11px] uppercase tracking-wide text-text-secondary">
              {formatPostDate(post.createdAt)}
            </p>

            {/* Comment input */}
            <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
              <Smile className="h-6 w-6 shrink-0 cursor-pointer text-text-secondary" />
              <form onSubmit={handleSubmitComment} className="flex flex-1 items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Thêm bình luận…"
                  maxLength={1000}
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none"
                />
                {newComment.trim() && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="cursor-pointer text-sm font-semibold text-primary disabled:opacity-40"
                  >
                    {isSubmitting ? <Spinner size="sm" /> : 'Đăng'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ── Options sheet ─────────────────────────────────────────── */}
      {showOptions && (
        <div
          className="absolute inset-0 z-60 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.currentTarget === e.target) setShowOptions(false); }}
        >
          <div className="w-[400px] overflow-hidden rounded-2xl bg-bg-card text-center shadow-xl">
            {isOwnPost && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="w-full cursor-pointer border-b border-border py-3.5 text-sm font-bold text-red-500 hover:bg-border/30 disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowOptions(false)}
              className="w-full cursor-pointer py-3.5 text-sm text-text-primary hover:bg-border/30"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
