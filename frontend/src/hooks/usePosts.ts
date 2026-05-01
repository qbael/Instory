import { useState, useCallback, useEffect, useRef } from "react";
import type { NewsFeedItem, Post } from "@/types";
import { postService } from "@/services/postService";
import { hashtagService } from "@/services/hashtagService";

// Thêm "none" và { hashtag: string } vào FeedType
type FeedType = "home" | "none" | { userId: number } | { hashtag: string };

export function usePosts(feedType: FeedType = "home") {
  const [posts, setPosts] = useState<NewsFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const fetchingRef = useRef(false);
  const postsRef = useRef<NewsFeedItem[]>([]); // Dùng ref để luôn có dữ liệu mới nhất trong callback
  // Stringify feedType để dùng làm dependency ổn định cho useEffect/useCallback
  const feedTypeKey = JSON.stringify(feedType);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (fetchingRef.current || feedType === "none") return;

      const isUserFeed = typeof feedType === "object" && "userId" in feedType;
      const isHashtagFeed = typeof feedType === "object" && "hashtag" in feedType;

      if (isUserFeed && feedType.userId <= 0) return;
      if (isHashtagFeed && !feedType.hashtag) return;

      fetchingRef.current = true;
      setIsLoading(true);

      try {
        const paginationParams = { pageNumber: pageNum, pageSize: 10 };
        let response;

        if (isUserFeed) {
          response = await postService.getUserPosts(feedType.userId, paginationParams);
        } else if (isHashtagFeed) {
          // Giả định bạn có hàm này trong postService, nếu không hãy điều chỉnh lại nhé
          response = await hashtagService.getPostsByHashtag(feedType.hashtag, paginationParams); 
        } else {
          response = await postService.getFeed(paginationParams);
        }

        const result = response.data;
        setPosts((prev) => (pageNum === 1 ? result.data : [...prev, ...result.data]));
        setHasMore(result.hasNextPage && result.data.length > 0);
        setPage(pageNum);
      } catch {
        if (pageNum === 1) setPosts([]);
        setHasMore(false);
      } finally {
        fetchingRef.current = false;
        setIsLoading(false);
      }
    },
    // Dùng feedTypeKey làm dependency để hook cập nhật khi chuyển hashtag
    [feedTypeKey],
  );

  const refresh = useCallback(() => {
    fetchingRef.current = false;
    setPosts([]);
    setPage(1);
    setHasMore(true);
    if (feedType !== "none") {
      fetchPage(1);
    }
  }, [fetchPage, feedTypeKey]);

  // Tự động tải lại trang 1 khi thay đổi FeedType (chuyển tab, đổi hashtag...)
  useEffect(() => {
    if (feedType === "none") {
      setPosts([]);
      setHasMore(false);
      return;
    }
    refresh();
  }, [feedTypeKey, refresh]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const loadMore = useCallback(() => {
    if (!fetchingRef.current && hasMore) fetchPage(page + 1);
  }, [hasMore, page, fetchPage]);

const toggleLike = useCallback(async (postId: number) => {
    // 1. Lấy bài viết trực tiếp từ ref một cách đồng bộ
    const targetPost = postsRef.current.find((p) => p.post.id === postId);
    if (!targetPost) return;

    const wasLiked = targetPost.post.isLiked;

    // 2. Optimistic Update: Cập nhật giao diện ngay lập tức
    setPosts((prev) =>
      prev.map((p) => {
        if (p.post.id !== postId) return p;
        return {
          ...p,
          post: {
          ...p.post,    // Giữ nguyên các trường khác của bài post gốc (content, images...)
          isLiked: !wasLiked,
          likesCount: wasLiked ? p.post.likesCount - 1 : p.post.likesCount + 1,
      },
        };
      }),
    );
    // 3. Gọi API với dữ liệu chính xác
    try {
      if (wasLiked) {
        await postService.unlike(postId);
      } else {
        await postService.like(postId);
      }
    } catch {
      // 4. Nếu API lỗi, Rollback lại state cũ
      setPosts((prev) =>
        prev.map((p) => {
          if (p.post.id !== postId) return p;
          return {
            ...p,
            post: {
            ...p.post,    // Giữ nguyên các trường khác của bài post gốc (content, images...)
            isLiked: !wasLiked,
            likesCount: wasLiked ? p.post.likesCount - 1 : p.post.likesCount + 1,
          },
          };
        }),
      );
    }
  }, []); // dependency array rỗng, giúp reference của toggleLike luôn ổn định

  const handleIncreaseCommentCount = useCallback((postId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.post.id === postId ? 
        { ...p, 
          post: {
            ...p.post,
            commentsCount: p.post.commentsCount + 1
          } } : p,
      ),
    );
  }, []);

  const handleDeletePostFromUI = (deletedPostId: number) => {
    setPosts((prev) => prev.filter((p) => p.post.id !== deletedPostId));
  };

  useEffect(() => {
    // Chỉ bắt sự kiện tạo bài viết mới ở bảng tin home
    if (feedType !== "home") return;
    const handler = () => refresh();
    window.addEventListener("post-created", handler);
    return () => window.removeEventListener("post-created", handler);
  }, [feedTypeKey, refresh]);

  return {
    posts,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    toggleLike,
    fetchPage,
    handleIncreaseCommentCount,
    handleDeletePostFromUI,
  };
}