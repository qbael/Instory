import { memo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { MoreHorizontal, Trash2, Edit, Flag } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { PostActions } from "./PostActions";
import { CommentSection } from "./CommentSection";
import { ReportPostModal } from "./ReportPostModal";
import { timeAgo } from "@/utils/formatDate";
import { postService } from "@/services/postService";
import { useAppSelector } from "@/store";
import type { Post } from "@/types";
import ConfirmDialog from "@/utils/confirmDialog";
import SharePostModal from "./SharePostModal";
import Lightbox from "./LightBox";

interface PostCardProps {
  post: Post;
  onLikeToggle: (postId: number) => void;
  onCommentAdded?: (postId: number) => void;
  onDeleteSuccess: (postId: number) => void;
}

function renderCaption(content: string) {
  // \p{L} khớp với bất kỳ ký tự chữ cái nào trong bất kỳ ngôn ngữ nào
  // \p{N} khớp với bất kỳ con số nào
  // Cần thêm flag 'u' ở cuối Regex
  const regex = /(#[\p{L}\p{N}_]+)/gu; 

  return content.split(regex).map((part, i) => {
    if (part.startsWith("#")) {
      const tag = part.slice(1);
      return (
        <Link key={i} className="font-semibold" to={`/search?tag=${tag}`}>
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export const PostCard = memo(function PostCard({
  post,
  onLikeToggle,
  onCommentAdded,
  onDeleteSuccess,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Reference close menu when click outside
  const navigate = useNavigate();

  const currentUser = useAppSelector((s) => s.auth.user);

  // Check if current user owns the post
  const isOwnPost = currentUser && post.userId === currentUser.id;

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

const openImage = (index: number) => {
  setSelectedImageIndex(index);
  setIsLightboxOpen(true);
};
  // Handle delete post
  const handleDeletePost = async () => {
    const confirmed = await ConfirmDialog.show({
      title: "Xóa bài viết",
      message: "Bạn có chắc chắn muốn xóa bài viết này?",
      confirmText: "Xóa",
      cancelText: "Hủy",
    });

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await postService.delete(post.id);
      toast.success("Bài viết đã được xóa");
      setShowMenu(false);
      // Optionally, you can trigger a refresh of the feed here
      // by calling a callback or dispatching a Redux action
      onDeleteSuccess(post.id);
    } catch (error) {
      toast.error("Lỗi khi xóa bài viết");
      console.error("Delete post error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle report post
  const handleReportPost = () => {
    setShowReportModal(true);
    setShowMenu(false);
  };

  // Handle edit post
  const handleEditPost = () => {
    navigate(`/post/${post.id}/edit`);
    setShowMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  return (
    <article className="overflow-hidden rounded-lg border border-border bg-bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <Link to={`/profile/${post.user.userName}`}>
          <Avatar
            src={post.user.avatarUrl}
            alt={post.user.fullName ?? post.user.userName}
            size="sm"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${post.user.userName}`}
            className="block truncate text-sm font-semibold text-text-primary no-underline hover:underline w-fit"
          >
            {post.user.userName}
          </Link>
          <p className="text-[11px] text-text-secondary">
            {timeAgo(post.createdAt)}
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="cursor-pointer rounded-full p-1 text-text-secondary transition-colors hover:bg-border/30 hover:text-text-primary"
            aria-label="Thêm tùy chọn"
            title="Thêm tùy chọn"
            onClick={() => {
              setShowMenu(!showMenu);
            }}
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-7 top-1 mt-1 w-48 rounded-md border border-border bg-bg-card shadow-lg z-10">
              {isOwnPost ? (
                <>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeletePost}
                    className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-error/10 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "Đang xóa..." : "Xóa bài viết"}
                  </button>

                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-border/40 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    onClick={handleEditPost}
                  >
                    <Edit className="h-4 w-4" />
                    Chỉnh sửa bài viết
                  </button>
                </>

              ) : (
                <button
                  type="button"
                  onClick={handleReportPost}
                  className="w-full px-4 py-2.5 text-left text-sm text-error hover:bg-error/10 rounded-md transition-colors flex items-center gap-2"
                >
                  <Flag className="h-4 w-4" />
                  Báo cáo bài viết
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image */}
      {post.images && post.images.length > 0 && (
        <div className="px-3 pb-3">
          <div
            className={`grid gap-1 rounded-xl overflow-hidden cursor-pointer ${
              post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {post.images.slice(0, 4).map((img, i) => (
              <div 
                key={i} 
                className={`relative overflow-hidden bg-gray-100 ${
                  post.images.length === 3 && i === 0 ? "row-span-2" : "aspect-square"
                }`}
                onClick={() => openImage(i)} // Click vào ảnh nào mở đúng ảnh đó
              >
                <img
                  src={img.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay +N cho ảnh cuối cùng */}
                {i === 3 && post.images.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xl font-bold backdrop-blur-sm">
                    +{post.images.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <Lightbox
        images={post.images} 
        initialIndex={selectedImageIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />

      {/* Actions */}
      <PostActions
        postId={post.id}
        isLiked={post.isLiked}
        likesCount={post.likesCount}
        commentsCount={post.commentsCount}
        sharesCount={post.sharesCount}
        onLike={() => onLikeToggle(post.id)}
        onCommentClick={() => setShowComments(true)}
        onShare={() => {setShowShareModal(true)}}
      />

      {/* Caption */}
      {post.content && (
        <div className="px-3 pb-2">
          <p className="text-sm">
            <Link
              to={`/profile/${post.user.userName}`}
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
        <CommentSection
          postId={post.id}
          initialCount={post.commentsCount}
          showComments={showComments}
          increaseCommentCount={onCommentAdded}
        />
      )}

      {/* Report Modal */}
      <ReportPostModal
        postId={post.id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />

      <SharePostModal
        post={post}
        onClose={() => setShowShareModal(false)}
        isOpen={showShareModal}
      />
    </article>
  );
});
