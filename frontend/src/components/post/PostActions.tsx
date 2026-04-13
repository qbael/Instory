import { memo } from 'react';
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

export const PostActions = memo(function PostActions({
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
            aria-label={isLiked ? 'Bỏ thích' : 'Thích'}
            title={isLiked ? 'Bỏ thích' : 'Thích'}
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
            aria-label="Bình luận"
            title='Bình luận'
          >
            <MessageCircle className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="cursor-pointer text-text-primary hover:text-text-secondary"
            aria-label="Chia sẻ"
            title='Chia sẻ'
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        <button
          type="button"
          className="cursor-pointer text-text-primary hover:text-text-secondary"
          aria-label="Lưu"
          title='Lưu'
        >
          <Bookmark className="h-6 w-6" />
        </button>
      </div>

      {likesCount > 0 && (
        <p className="mt-2 text-sm font-semibold">
          {likesCount.toLocaleString()} lượt thích
        </p>
      )}
      {commentsCount > 0 && (
        <button
          type="button"
          onClick={onCommentClick}
          className="mt-1 cursor-pointer text-sm text-text-secondary"
        >
          Xem tất cả {commentsCount} bình luận
        </button>
      )}
    </div>
  );
});
