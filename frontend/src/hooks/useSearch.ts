import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { userService } from '@/services/userService';
import type { SearchResults, SearchType } from '@/types';
import { postService } from '@/services/postService';

export function useSearch(type: SearchType) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (q: string, t: SearchType) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setIsLoading(true);
    try {
      if (t === 'people') {
        const { data } = await userService.searchUsers(q);
        setResults({ users: data, posts: [], hashtags: [] });
      } else if (t === 'posts') {
        const { data } = await userService.searchPosts(q);
        setResults({ users: [], posts: data, hashtags: [] });
      } else {
        const { data } = await userService.searchHashtags(q);
        setResults({ users: [], posts: [], hashtags: data });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery, type);
  }, [debouncedQuery, type, search]);

  const clear = useCallback(() => {
    setQuery('');
    setResults(null);
  }, []);

  const toggleLike = useCallback(async (postId: number) => {
    // 1. Lấy dữ liệu bài viết hiện tại
    if (!results?.posts) return;
    
    const targetPost = results.posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const wasLiked = targetPost.isLiked;

    // 2. Optimistic Update: Cập nhật object `results` chứa mảng `posts`
    setResults((prev) => {
      if (!prev) return prev; // Đề phòng prev null
      
      return {
        ...prev, // Giữ nguyên users và hashtags
        posts: prev.posts.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            isLiked: !wasLiked,
            likesCount: wasLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        }),
      };
    });

    // 3. Gọi API
    try {
      if (wasLiked) {
        await postService.unlike(postId);
      } else {
        await postService.like(postId);
      }
    } catch (error) {
      // 4. Rollback: Phục hồi lại trạng thái cũ cho riêng bài viết bị lỗi
      setResults((prev) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          posts: prev.posts.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              isLiked: wasLiked,
              likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1, 
            };
          }),
        };
      });
      

    }
  }, [results]);
  return { query, setQuery, results, isLoading, clear, toggleLike};
}
