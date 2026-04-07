import { useState, useCallback, useEffect } from 'react';
import type { Post } from '@/types';
import { postService } from '@/services/postService';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';

type FeedType = 'home' | { userId: number };

export function usePosts(feedType: FeedType = 'home') {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setIsLoading(true);
      try {
        const { data } =
          feedType === 'home'
            ? await postService.getFeed({
                pageNumber: pageNum,
                pageSize: DEFAULT_PAGE_SIZE,
              })
            : await postService.getUserPosts(feedType.userId, {
                pageNumber: pageNum,
                pageSize: DEFAULT_PAGE_SIZE,
              });

        const result = data.data;
        setPosts((prev) =>
          pageNum === 1 ? result.items : [...prev, ...result.items],
        );
        setHasMore(result.hasNextPage);
        setPage(pageNum);
      } finally {
        setIsLoading(false);
      }
    },
    [feedType],
  );

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) fetchPage(page + 1);
  }, [isLoading, hasMore, page, fetchPage]);

  const refresh = useCallback(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1);
  }, [fetchPage]);

  const toggleLike = useCallback(
    async (postId: number) => {
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
      try {
        const post = posts.find((p) => p.id === postId);
        if (post?.isLiked) await postService.unlike(postId);
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
    },
    [posts],
  );

  useEffect(() => {
    if (feedType !== 'home') return;
    const handler = () => refresh();
    window.addEventListener('post-created', handler);
    return () => window.removeEventListener('post-created', handler);
  }, [feedType, refresh]);

  return { posts, isLoading, hasMore, loadMore, refresh, toggleLike, fetchPage };
}
