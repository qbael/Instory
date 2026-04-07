import { useEffect } from 'react';
import { StoryBar } from '@/components/story/StoryBar';
import { PostCard } from '@/components/post/PostCard';
import { PostCardSkeleton } from '@/components/post/PostCardSkeleton';
import { usePosts } from '@/hooks/usePosts';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { Spinner } from '@/components/ui/Spinner';

export default function HomePage() {
  const { posts, isLoading, hasMore, loadMore, fetchPage, toggleLike } =
    usePosts('home');
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: loadMore,
  });

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const showSkeletons = isLoading && posts.length === 0;

  return (
    <div className="space-y-4">
      <StoryBar />

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
            Welcome to Instory
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Follow people to start seeing their posts here.
          </p>
        </div>
      )}

      {/* End of feed */}
      {!hasMore && posts.length > 0 && (
        <p className="pb-8 text-center text-sm text-text-secondary">
          You&apos;re all caught up
        </p>
      )}
    </div>
  );
}
