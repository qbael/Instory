import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PostActionsProps {
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  onLike: () => void;
  onCommentClick: () => void;
  onShare: () => void;
}

export function PostActions({
  isLiked,
  likesCount,
  commentsCount,
  onLike,
  onCommentClick,
  onShare,
}: PostActionsProps) {
  return (
    <div className="px-3 pb-1 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onLike}
            className="cursor-pointer transition-transform active:scale-110"
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <Heart
              className={cn(
                'h-6 w-6',
                isLiked
                  ? 'fill-accent stroke-accent'
                  : 'stroke-text-primary hover:stroke-text-secondary',
              )}
            />
          </button>
          <button
            type="button"
            onClick={onCommentClick}
            className="cursor-pointer text-text-primary hover:text-text-secondary"
            aria-label="Comment"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="cursor-pointer text-text-primary hover:text-text-secondary"
            aria-label="Share"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        <button
          type="button"
          className="cursor-pointer text-text-primary hover:text-text-secondary"
          aria-label="Save"
        >
          <Bookmark className="h-6 w-6" />
        </button>
      </div>

      {likesCount > 0 && (
        <p className="mt-2 text-sm font-semibold">
          {likesCount.toLocaleString()} {likesCount === 1 ? 'like' : 'likes'}
        </p>
      )}
      {commentsCount > 0 && (
        <button
          type="button"
          onClick={onCommentClick}
          className="mt-1 cursor-pointer text-sm text-text-secondary"
        >
          View all {commentsCount} comments
        </button>
      )}
    </div>
  );
}
