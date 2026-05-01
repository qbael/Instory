import type { NewsFeedItem } from "@/types";
import { PostCard } from "./PostCard";
interface NewsFeedProps {
  feedItems: NewsFeedItem[];
  onLikeToggle: (postId: number) => void;
  onCommentAdded?: (postId: number) => void;
  onDeleteSuccess: (postId: number) => void;
}
const NewsFeed = ({ feedItems,onLikeToggle,onCommentAdded,onDeleteSuccess}: NewsFeedProps) => {
  return (
    <div className="flex flex-col gap-4">
      {feedItems.map((item, index) => {
        
        // 1. NẾU LÀ BÀI CHIA SẺ
        if (item.feedType === 'SHARE') {
          return (
            <div key={`share-${item.shareId}`} className="bg-white border rounded-xl p-4 shadow-sm mb-4">
              {/* Header người chia sẻ */}
              <div className="flex items-center gap-2 mb-2">
                <div className="font-bold text-gray-900">{item.sharer?.fullName}</div>
                <div className="text-gray-500 text-sm">đã chia sẻ một bài viết</div>
              </div>
              
              {/* Lời bình của người chia sẻ */}
              {item.shareCaption && (
                <p className="mb-3 text-gray-800 text-sm">{item.shareCaption}</p>
              )}

              {/* TÁI SỬ DỤNG LẠI COMPONENT CŨ: Chỉ cần truyền item.post vào */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <PostCard post={item.post} onLikeToggle={onLikeToggle} onDeleteSuccess={onDeleteSuccess} onCommentAdded={onCommentAdded}/> 
              </div>
            </div>
          );
        }

        // 2. NẾU LÀ BÀI GỐC BÌNH THƯỜNG
        return (
          <div key={`post-${item.post?.id}`} className="mb-4">
            {/* TÁI SỬ DỤNG LẠI COMPONENT CŨ */}
            <PostCard post={item.post} onLikeToggle={onLikeToggle} onDeleteSuccess={onDeleteSuccess} onCommentAdded={onCommentAdded}/> 
          </div>
        );
        
      })}
    </div>
  );
};
export default NewsFeed;