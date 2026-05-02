import type { NewsFeedItem } from "@/types";
import { PostCard } from "./PostCard";
import { Avatar } from "../ui";
import { Link } from "react-router";
import { timeAgo } from "@/utils/formatDate";
import { renderCaption } from "@/utils/renderCaption";
interface NewsFeedProps {
  feedItems: NewsFeedItem[];
  onLikeToggle: (postId: number) => void;
  onCommentAdded?: (postId: number) => void;
  onDeleteSuccess: (postId: number) => void;
}
const NewsFeed = ({ feedItems,onLikeToggle,onCommentAdded,onDeleteSuccess}: NewsFeedProps) => {
  return (
    <div className="flex flex-col gap-2 ">
      {feedItems.map((item) => {
        
        // 1. NẾU LÀ BÀI CHIA SẺ
        if (item.feedType === 'SHARE') {
          return (
            <div key={`share-${item.shareId}`} className="bg-white border border-border bg-bg-card rounded-xl p-2 shadow-sm mb-5">
              <div className="flex items-center gap-3 ">
              {/* Header người chia sẻ */}
              <Link to={`/profile/${item.sharer?.userName}`}>
                <Avatar
                  src={item.sharer?.avatarUrl}
                  alt={item.sharer?.fullName ?? item.sharer?.userName}
                  size="sm"
                />
              </Link>
              <div className="min-w-0 flex-1">
                  <Link
                  to={`/profile/${item.sharer?.userName}`}
                  className="block truncate text-sm font-semibold text-text-primary no-underline hover:underline w-fit"
                  >
                  {item.sharer?.userName} <span className="text-gray-500 text-sm">đã chia sẻ một bài viết</span>
                  </Link>
                  <p className="text-[11px] text-text-secondary">
                    {timeAgo(item.post.createdAt)}
                  </p>
                </div>
              </div>
              {/* Lời bình của người chia sẻ */}
              {item.shareCaption && (
                <p className="mb-3 mx-1 text-gray-800 text-sm">{renderCaption(item.shareCaption)}</p>
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