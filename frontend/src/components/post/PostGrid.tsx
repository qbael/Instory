import type { Post } from '@/types';
import { useState, memo } from 'react';
import { PostDetailModal } from './PostDetailModal';
import { Heart, MessageCircle } from 'lucide-react';


// Thêm định nghĩa Props để truyền các hàm xử lý từ component cha xuống Modal
interface PostGridProps {
  posts: Post[];    
  onLikeToggle?: (postId: number) => void;
  onCommentAdded?: (postId: number, comment: any) => void;
  onDeleted?: (postId: number) => void;
}

const PostGrid = memo(function PostGrid({ 
  posts,   
  onLikeToggle,
  onCommentAdded,
  onDeleted
}: PostGridProps) {
  // State để lưu trữ bài viết đang được chọn để hiển thị trên Modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <div
            key={post.id}
            // Mở modal khi click vào bài viết
            onClick={() => setSelectedPost(post)}
            // Đổi từ Link sang div, thêm cursor-pointer để hiển thị con trỏ chuột dạng tay
            className="group relative aspect-square overflow-hidden rounded bg-border cursor-pointer"
          >
            {post.images?.[0]?.imageUrl ? (
              <img
                src={post.images[0].imageUrl}
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
            <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Heart className="h-5 w-5 fill-white" /> {post.likesCount}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                <MessageCircle className="h-5 w-5 fill-white" />{' '}
                {post.commentsCount}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chỉ render Modal khi có một post được chọn */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          // Lấy trạng thái isLiked từ component cha, hoặc nếu post có sẵn trường isLiked thì bạn truyền selectedPost.isLiked
          isLiked={selectedPost.isLiked} 
          // Đóng modal bằng cách set selectedPost về null
          onClose={() => setSelectedPost(null)}
          onLikeToggle={() => onLikeToggle?.(selectedPost.id)}
          onCommentAdded={(comment) => onCommentAdded?.(selectedPost.id, comment)}
          onDeleted={() => {
            onDeleted?.(selectedPost.id);
            setSelectedPost(null); // Đóng modal sau khi xóa thành công
          }}
        />
      )}
    </>
  );
});

export default PostGrid;