import { useState, useCallback, useEffect, useRef } from 'react';
import type { Post, User } from '@/types';
import { postService } from '@/services/postService';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';

type FeedType = 'home' | { userId: number };

// ── Mock posts (xóa khi backend sẵn sàng) ──────────────────────────────────

const mockUser = (id: number, name: string): User => ({
  id,
  userName: name,
  email: `${name}@example.com`,
  fullName: null,
  bio: null,
  avatarUrl: `https://i.pravatar.cc/100?u=${name}`,
  createdAt: new Date().toISOString(),
  updatedAt: null,
});

const MOCK_POSTS: Post[] = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  userId: 1,
  content: `Bài viết #${i + 1}`,
  imageUrl: `https://picsum.photos/seed/post${i + 1}/600/600`,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: null,
  user: mockUser(1, 'mindang'),
  commentsCount: Math.floor(Math.random() * 30),
  likesCount: Math.floor(Math.random() * 150) + 5,
  sharesCount: 0,
  isLiked: Math.random() > 0.5,
  hashtags: [],
}));

export function usePosts(feedType: FeedType = 'home') {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const fetchingRef = useRef(false);

  const userIdParam = feedType === 'home' ? null : feedType.userId;

<<<<<<< HEAD
  const fetchPage = useCallback(
    async (pageNum: number) => {
      if (fetchingRef.current) return;
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

        const result = data.data;
        setPosts((prev) =>
          pageNum === 1 ? result.items : [...prev, ...result.items],
        );
        setHasMore(result.hasNextPage && result.items.length > 0);
        setPage(pageNum);
      } catch {
        if (pageNum === 1) {
          setPosts(MOCK_POSTS);
        }
        setHasMore(false);
      } finally {
        fetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [userIdParam],
  );
=======
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
            } catch (error: any) {
                if (error.response?.status === 404) {
                    console.warn('No posts found (404)');

                    setHasMore(false);
                    return;
                }

                console.error(error);
            } finally {
                setIsLoading(false);
            }
        },
        [feedType],
    );
>>>>>>> 36d67bce02c34e55ec7f701d44e636068c6583a3

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

  useEffect(() => {
    if (userIdParam !== null) return;
    const handler = () => refresh();
    window.addEventListener('post-created', handler);
    return () => window.removeEventListener('post-created', handler);
  }, [userIdParam, refresh]);

  return { posts, isLoading, hasMore, loadMore, refresh, toggleLike, fetchPage };
}
