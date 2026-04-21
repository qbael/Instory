import { useState, useCallback, useEffect, useRef } from "react";
import type { Post } from "@/types";
import { postService } from "@/services/postService";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";

type FeedType = "home" | { userId: number };

export function usePosts(feedType: FeedType = "home") {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const fetchingRef = useRef(false);

  const userIdParam = feedType === "home" ? null : feedType.userId;

  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (fetchingRef.current) return;
      if (userIdParam !== null && userIdParam <= 0) return;
      fetchingRef.current = true;
      setIsLoading(true);
      try {
        const { data } =
          userIdParam === null
            ? await postService.getFeed({
                pageNumber: pageNum,
                pageSize: DEFAULT_PAGE_SIZE,
              })
            : await postService.getUserPosts(userIdParam, {
                pageNumber: pageNum,
                pageSize: DEFAULT_PAGE_SIZE,
              });

        const result = data;
        setPosts((prev) =>
          pageNum === 1 ? result.data : [...prev, ...result.data],
        );
        setHasMore(result.hasNextPage && result.data.length > 0);
        setPage(pageNum);
        console.log("Data fetched:", result.data);
      } catch {
        if (pageNum === 1) {
          setPosts([]);
        }
        setHasMore(false);
      } finally {
        fetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [userIdParam],
  );

  useEffect(() => {
    fetchPage(1);
  }, [userIdParam]);

  const loadMore = useCallback(() => {
    if (!fetchingRef.current && hasMore) fetchPage(page + 1);
  }, [hasMore, page, fetchPage]);

  const refresh = useCallback(() => {
    fetchingRef.current = false;
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1);
  }, [fetchPage]);

  const toggleLike = useCallback(async (postId: number) => {
    let wasLiked = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        wasLiked = p.isLiked;
        return {
          ...p,
          isLiked: !p.isLiked,
          likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
        };
      }),
    );
    try {
      if (wasLiked) await postService.unlike(postId);
      else await postService.like(postId);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
              }
            : p,
        ),
      );
    }
  }, []);

  const handleIncreaseCommentCount = useCallback((postId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
      ),
    );
  }, []);

  const handleDeletePostFromUI = (deletedPostId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
  };

  useEffect(() => {
    if (userIdParam !== null) return;
    const handler = () => refresh();
    window.addEventListener("post-created", handler);
    return () => window.removeEventListener("post-created", handler);
  }, [userIdParam, refresh]);

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
