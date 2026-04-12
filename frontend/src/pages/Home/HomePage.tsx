import { useEffect, useCallback } from 'react';
import { StoryBar } from '@/components/story/StoryBar';
import { PostCard } from '@/components/post/PostCard';
import { PostCardSkeleton } from '@/components/post/PostCardSkeleton';
import { NewPostsBanner } from '@/components/layout/NewPostsBanner';
import { usePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useSignalRContext } from '@/hooks/useSignalRContext';
import { Spinner } from '@/components/ui/Spinner';

export default function HomePage() {
  const { posts, isLoading, hasMore, loadMore, fetchPage, toggleLike, refresh } =
    usePosts('home');
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: loadMore,
  });
  const { hasNewPosts, dismissNewPosts } = useSignalRContext();

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const handleNewPosts = useCallback(() => {
    refresh();
    dismissNewPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [refresh, dismissNewPosts]);

  const showSkeletons = isLoading && posts.length === 0;

  return (
    <div className="space-y-4">
      <StoryBar />

      <NewPostsBanner visible={hasNewPosts} onRefresh={handleNewPosts} />

      {/* Post feed */}
      {showSkeletons && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLikeToggle={toggleLike} />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isLoading && posts.length > 0 && <Spinner />}
      </div>

      {/* Empty state */}
      {!isLoading && posts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-text-primary">
            Chào mừng đến với Instory
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Hãy kết bạn với mọi người để xem bài viết của họ tại đây.
          </p>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <p className="pb-8 text-center text-sm text-text-secondary">
          Bạn đã xem hết bài viết
        </p>
      )}
    </div>
  );
}
