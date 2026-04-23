import { memo } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PostActionsProps {
  isLiked: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  onLike: () => void;
  onCommentClick: () => void;
  onShare: () => void;
}

export const PostActions = memo(function PostActions({
  isLiked,
  likesCount,
  commentsCount,
  sharesCount,
  onLike,
  onCommentClick,
  onShare,
}: PostActionsProps) {
  return (
    <div className="px-3 pb-1 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-between gap-2" >
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
                  ? 'fill-red-500 stroke-red-500'
                  : 'stroke-text-primary hover:stroke-text-secondary',
              )}
            />
            </button>
            <span>{likesCount > 0 ? likesCount : ''}</span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
            type="button"
            onClick={onCommentClick}
            className="cursor-pointer text-text-primary hover:text-text-secondary"
            aria-label="Bình luận"
            title='Bình luận'
            >
              <MessageCircle className="h-6 w-6" />
            </button>

            <span>{commentsCount > 0 ? commentsCount : ''}</span>
          </div>

          <div className='flex items-center justify-between gap-2'>
            <button
              type="button"
              onClick={onShare}
              className="cursor-pointer text-text-primary hover:text-text-secondary"
              aria-label="Chia sẻ"
              title='Chia sẻ'
            >
              <Send className="h-6 w-6" />
            </button>
            <span>{sharesCount > 0 ? sharesCount : ''}</span>
          </div>
        </div>
        {/* <button
          type="button"
          className="cursor-pointer text-text-primary hover:text-text-secondary"
          aria-label="Lưu"
          title='Lưu'
        >
          <Bookmark className="h-6 w-6" />
        </button> */}
      </div>
        
      {/* {commentsCount > 0 && (
        <button
          type="button"
          onClick={onCommentClick}
          className="mt-1 cursor-pointer text-sm text-text-secondary"
        >
          Xem tất cả {commentsCount} bình luận
        </button>
      )} */}
    </div>
  );
});
