import { useState, useCallback, use, useEffect } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner } from "@/components/ui/Spinner";
import { postService } from "@/services/postService";
import { timeAgo } from "@/utils/formatDate";
import { useAppSelector } from "@/store";
import type { Comment } from "@/types";

interface CommentSectionProps {
  postId: number;
  initialCount: number;
  showComments?: boolean;
  increaseCommentCount?: (postId: number) => void;
}

export function CommentSection({
  postId,
  initialCount,
  showComments,
  increaseCommentCount,
}: CommentSectionProps) {
  const user = useAppSelector((s) => s.auth.user);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    if (isLoaded) return;
    setIsLoading(true);
    try {
      const { data } = await postService.getComments(postId, {
        pageNumber: 1,
        pageSize: 20,
      });
      setComments(data.data || []);
      // console.log('Loaded comments:', data.data);
      setIsLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [postId, isLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Gọi API với { content } để backend nhận đúng định dạng
      // const response = await postService.addComment(postId, { content });
      // console.log('Add comment response:', response);
      // // SỬA Ở ĐÂY: Lấy data ở tầng thứ 2
      // const newAddedComment = response.data.data;

      const { data } = await postService.addComment(postId, content);
      console.log("Add comment response:", data);
      // SỬA Ở ĐÂY: Lấy data ở tầng thứ 2
      const newAddedComment = data.data;

      const completeComment = {
        ...newAddedComment,
        createdAt: newAddedComment.createdAt || new Date().toISOString(),
        user: {
          userName: user?.userName, // Lấy từ state Auth của bạn
          avatarUrl: user?.avatarUrl, // Lấy từ state Auth của bạn
        },
      } as Comment;
      setComments((prev) => [completeComment, ...prev]);
      if (increaseCommentCount) {
        increaseCommentCount(postId);
      }
      setNewComment("");
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    if (showComments && !isLoaded) {
      loadComments();
    }
  }, [showComments, postId]);
  return (
    <div className="border-t border-border">
      {/* Load comments trigger */}
      {/* {!isLoaded && initialCount > 0 && (
        <button
          type="button"
          onClick={loadComments}
          className="w-full cursor-pointer px-3 py-2 text-left text-sm text-text-secondary hover:text-text-primary"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner size="sm" /> Đang tải…
            </span>
          ) : (
            `Xem tất cả ${initialCount} bình luận`
          )}
        </button>
      )} */}

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="max-h-48 space-y-2.5 overflow-y-auto px-3 py-2">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar
                src={c.user?.avatarUrl || ""}
                alt={c.user?.userName || "User"}
                size="xs"
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="mr-1.5 font-semibold">
                    {c.user?.userName || "Unknown"}
                  </span>
                  {c.content}
                </p>
                <p className="mt-0.5 text-[11px] text-text-secondary">
                  {timeAgo(c.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment input */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-2.5 w-full">
        <Avatar src={user?.avatarUrl} alt={user?.userName ?? ""} size="xs" />
        <form
          onSubmit={handleSubmit}
          className="w-full flex items-center gap-2"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Thêm bình luận…"
            maxLength={1000}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/70 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="cursor-pointer text-sm font-semibold text-primary transition-opacity disabled:pointer-events-none disabled:opacity-40"
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
