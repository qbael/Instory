import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Loader2, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { hashtagService } from "@/services/hashtagService";
import { PostCard } from "@/components/post";
import { Input } from "@/components/ui/Input";
import type { Hashtag } from "@/types";
import { usePosts } from "@/hooks/usePosts";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

export default function HashtagTrending() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [searchResults, setSearchResults] = useState<Hashtag[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(
    searchParams.get("tag") || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  
  // Dùng usePosts với hashtag đang được chọn. Nếu không có chọn thì truyền "none" để không fetch.
  const {
    posts,
    toggleLike,
    handleDeletePostFromUI,
    handleIncreaseCommentCount,
    isLoading: postsLoading,
    hasMore,
    loadMore,
  } = usePosts(selectedHashtag ? { hashtag: selectedHashtag } : "none");
  // console.log("Posts for hashtag", posts);
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: postsLoading,
    onLoadMore: loadMore,
  });

  // Tải hashtag trending lúc mới vào trang
  useEffect(() => {
    const loadTrendingHashtags = async () => {
      try {
        setIsLoadingTrending(true);
        const { data } = await hashtagService.getTrendingHashtags(5);
        setTrendingHashtags(data);
        
        // Nếu ban đầu không có tag nào trên URL thì tự chọn tag Top 1
        if (!selectedHashtag && data.length > 0) {
          setSelectedHashtag(data[0].tag);
        }
      } catch (error) {
        toast.error("Lỗi tải hashtag xu hướng");
        console.error("Error loading trending hashtags:", error);
      } finally {
        setIsLoadingTrending(false);
      }
    };

    loadTrendingHashtags();
  }, [selectedHashtag]);

  // Tìm kiếm hashtag
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        try {
          setIsSearching(true);
          const { data } = await hashtagService.searchHashtags(searchQuery, 10);
          setSearchResults(data);
        } catch (error) {
          console.error("Error searching hashtags:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Danh sách hashtag cần hiển thị
  const displayedHashtags = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return trendingHashtags;
  }, [searchQuery, searchResults, trendingHashtags]);

  // Cập nhật khi user click chọn hashtag
  const handleSelectHashtag = (tag: string) => {
    setSelectedHashtag(tag);
    setSearchParams({ tag }); // Cập nhật lại URL parameters
  };

  return (
    <div className="">
      {/* Main Content */}
      <div className="">
        {/* Search Header */}
        <div className="sticky top-0 z-10 mb-6 space-y-4 rounded-lg border border-border bg-bg-card p-4 shadow-sm">
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary z-[2]" />
            <Input
              type="text"
              placeholder="Tìm kiếm hashtag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-text-secondary" />
            )}
          </div>
        </div>

        {/* Danh sách Hashtags */}
        <div className="mb-6 rounded-lg border border-border bg-bg-card p-4">
          <h2 className="mb-4 font-semibold text-text-primary">
            {searchQuery.trim() ? "Kết quả tìm kiếm" : "Trending Hashtags"}
          </h2>

          {isLoadingTrending && !searchQuery && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!isLoadingTrending && displayedHashtags.length === 0 && (
            <p className="py-4 text-center text-text-secondary">
              {searchQuery.trim() ? "Không tìm thấy hashtag" : "Chưa có hashtag xu hướng"}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {displayedHashtags.map((hashtag) => (
              <button
                key={hashtag.id}
                onClick={() => handleSelectHashtag(hashtag.tag)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                  selectedHashtag === hashtag.tag
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-bg-secondary text-text-primary hover:bg-bg-tertiary"
                }`}
              >
                #{hashtag.tag}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Display */}
        {selectedHashtag && (
          <div className="space-y-4">
            <div className="p-4">
              <h1 className="mb-4 font-semibold text-text-primary">
                Bài viết với #{selectedHashtag}
              </h1>

              {postsLoading && posts.length === 0 && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {!postsLoading && posts.length === 0 && (
                <p className="py-8 text-center text-text-secondary">
                  Chưa có bài viết nào cho hashtag này
                </p>
              )}

              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLikeToggle={toggleLike}
                    onDeleteSuccess={handleDeletePostFromUI}
                    onCommentAdded={handleIncreaseCommentCount}
                  />
                ))}
              </div>

              {/* Infinite Scroll Sentinel */}
              <div ref={sentinelRef} className="flex justify-center py-8">
                {postsLoading && hasMore && posts.length > 0 && (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}