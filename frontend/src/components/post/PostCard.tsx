import { memo, useState } from 'react';
import { Link } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { PostActions } from './PostActions';
import { CommentSection } from './CommentSection';
import { timeAgo } from '@/utils/formatDate';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onLikeToggle: (postId: number) => void;
}

function renderCaption(content: string) {
  return content.split(/(#[a-zA-Z0-9_]+)/g).map((part, i) => {
    if (part.startsWith('#')) {
      const tag = part.slice(1);
      return (
        <Link
          key={i}
          to={`/search?tag=${tag}`}
          className="font-semibold text-text-link"
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export const PostCard = memo(function PostCard({ post, onLikeToggle }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Link to={`/profile/${post.userId}`}>
          <Avatar
            src={post.user.avatarUrl}
            alt={post.user.fullName ?? post.user.userName}
            size="sm"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${post.userId}`}
            className="block truncate text-sm font-semibold text-text-primary no-underline hover:underline"
          >
            {post.user.userName}
          </Link>
          <p className="text-[11px] text-text-secondary">
            {timeAgo(post.createdAt)}
          </p>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-full p-1 text-text-secondary transition-colors hover:bg-border/30 hover:text-text-primary"
          aria-label="More options"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className="aspect-square overflow-hidden bg-border">
          <img
            src={post.imageUrl}
            alt={post.content ?? 'Post image'}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <PostActions
        isLiked={post.isLiked}
        likesCount={post.likesCount}
        commentsCount={post.commentsCount}
        onLike={() => onLikeToggle(post.id)}
        onCommentClick={() => setShowComments(true)}
        onShare={() => {}}
      />

      {/* Caption */}
      {post.content && (
        <div className="px-3 pb-2">
          <p className="text-sm">
            <Link
              to={`/profile/${post.userId}`}
              className="mr-1.5 font-semibold text-text-primary no-underline hover:underline"
            >
              {post.user.userName}
            </Link>
            {renderCaption(post.content)}
          </p>
        </div>
      )}

      {/* Comments */}
      {showComments && (
        <CommentSection postId={post.id} initialCount={post.commentsCount} />
      )}
    </article>
  );
});
