import { useState, useCallback } from 'react';
import type { Post } from '@/types';
import { postService } from '@/services/postService';

export function usePost(postId: number) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await postService.getById(postId);
      setPost(data);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  const toggleLike = useCallback(async () => {
    if (!post) return;

    setPost((p) =>
      p
        ? {
            ...p,
            isLiked: !p.isLiked,
            likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
          }
        : p,
    );

    try {
      if (post.isLiked) await postService.unlike(postId);
      else await postService.like(postId);
    } catch {
      setPost((p) =>
        p
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p,
      );
    }
  }, [post, postId]);

  return { post, isLoading, load, toggleLike };
}
